import asyncHandler from 'express-async-handler';
import { predictYieldService, getYieldMetadataService, fetchOpenMeteoWeather } from '../services/cropYield.service.js';
import { calculateRegionalRecommendations, getAIRegionalCropAdvisory } from '../services/cropRecommendation.service.js';
import {
  generateCompleteFarmingPlan,
  recommendTopCrops,
  assessCropSuitability,
  normalizeToAcres,
  AGRONOMIC_CROPS_DB,
} from '../services/cropPlanner.service.js';
import FarmingPlan from '../models/farmingPlan.model.js';
import User from '../models/user.model.js';

// --- Predict Crop Yield ---
export const predictCropYield = asyncHandler(async (req, res) => {
  const { crop, state, season, area, areaUnit, annualRainfall, soilType, irrigation, latitude, longitude, weatherContext } = req.body;

  if (!crop) {
    return res.status(400).json({ message: 'Crop type is required' });
  }

  const prediction = await predictYieldService({
    crop,
    state,
    season,
    area: area || 1,
    areaUnit: areaUnit || 'acres',
    annualRainfall,
    soilType,
    irrigation,
    latitude,
    longitude,
    weatherContext,
  });

  res.json({ success: true, data: prediction });
});

// --- Get Yield Model Metadata ---
export const getYieldMetadata = asyncHandler(async (req, res) => {
  const metadata = await getYieldMetadataService();
  res.json({ success: true, metadata });
});

// --- Get Weather for Location (Open-Meteo Proxy) ---
export const getOpenMeteoWeather = asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }
  const weather = await fetchOpenMeteoWeather(lat, lon);
  if (!weather) {
    return res.status(502).json({ message: 'Failed to retrieve weather data from Open-Meteo' });
  }
  res.json({ success: true, data: weather });
});

// --- Get Crop Recommendations for Region & Map Location ---
export const getCropRecommendations = asyncHandler(async (req, res) => {
  const {
    latitude,
    longitude,
    state = 'Maharashtra',
    district = '',
    soilType = 'black',
    season = 'All',
    irrigation = 'irrigated',
  } = req.body;

  let weatherData = null;
  if (latitude && longitude) {
    try {
      weatherData = await fetchOpenMeteoWeather(latitude, longitude);
    } catch (wErr) {
      console.warn('[Crop Recommendations] Weather fetch skipped:', wErr.message);
    }
  }

  const result = calculateRegionalRecommendations({
    state,
    district,
    soilType,
    season,
    weatherData,
    irrigation,
  });

  res.json({
    success: true,
    data: {
      ...result,
      weather: weatherData,
      coordinates: { latitude, longitude },
    },
  });
});

// --- Get AI Regional Crop Advisory Report ---
export const getAICropAdvisory = asyncHandler(async (req, res) => {
  const {
    latitude,
    longitude,
    state = 'Maharashtra',
    district = '',
    soilType = 'black',
    season = 'Kharif',
    irrigation = 'irrigated',
    language = 'en',
  } = req.body;

  let weatherData = null;
  if (latitude && longitude) {
    try {
      weatherData = await fetchOpenMeteoWeather(latitude, longitude);
    } catch {}
  }

  const user = req.user?._id ? await User.findById(req.user._id).lean() : null;

  const result = await getAIRegionalCropAdvisory({
    latitude,
    longitude,
    state,
    district,
    soilType,
    season,
    irrigation,
    weatherData,
    language,
    userApiKey: user?.groqApiKey,
  });

  res.json(result);
});

// ══════════════════════════════════════════════════════════════════════════════
//  CROP GUIDE & FARMING PLANNER CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

// --- Get Supported Crops Metadata for Dropdown ---
export const getSupportedPlannerCrops = asyncHandler(async (req, res) => {
  const list = Object.keys(AGRONOMIC_CROPS_DB).map((key) => {
    const c = AGRONOMIC_CROPS_DB[key];
    return {
      id: c.id,
      displayName: c.displayName,
      scientificName: c.scientificName,
      category: c.category,
      seasons: c.seasons,
      durationDays: c.durationDays,
      waterRequirement: c.waterRequirement,
      primaryStates: c.primaryStates,
    };
  });
  res.json({ success: true, count: list.length, crops: list });
});

// --- Generate Farming Plan or Auto-Recommendations ---
export const generateFarmingPlanHandler = asyncHandler(async (req, res) => {
  const {
    crop, // optional: string or empty
    cropVariety,
    sowingDate,
    area = 1,
    areaUnit = 'acres',
    state = 'Maharashtra',
    district = '',
    latitude,
    longitude,
    soilType = 'unknown',
    irrigation = 'irrigated',
    budget = 0,
    preference = 'balanced',
    soilTest,
    weatherContext,
  } = req.body;

  const areaInAcres = normalizeToAcres(area, areaUnit);

  let weather = weatherContext;
  if (!weather && latitude && longitude) {
    try {
      weather = await fetchOpenMeteoWeather(latitude, longitude);
    } catch {}
  }

  // OPTION A: Farmer selected a specific crop
  if (crop && crop.trim() && crop.trim() !== 'auto') {
    const chosenCrop = crop.trim();
    const plan = await generateCompleteFarmingPlan({
      cropId: chosenCrop,
      cropVariety,
      sowingDate,
      area,
      areaUnit,
      state,
      district,
      latitude,
      longitude,
      soilType,
      irrigation,
      budget,
      preference,
      soilTest,
      weatherContext: weather,
    });

    return res.json({
      success: true,
      mode: 'plan',
      selectedCrop: chosenCrop,
      plan,
      weather,
    });
  }

  // OPTION B: No crop selected -> Generate Top Ranked Recommendations
  const seasonDetermined = req.body.season || 'Kharif';
  const recommendations = recommendTopCrops({
    state,
    district,
    soilType,
    season: seasonDetermined,
    irrigation,
    areaInAcres,
    budget,
    preference,
    weatherData: weather,
    soilTest,
  });

  res.json({
    success: true,
    mode: 'recommendations',
    recommendations,
    weather,
    evaluatedConditions: {
      state,
      district,
      season: seasonDetermined,
      soilType,
      irrigation,
      areaInAcres,
      budget,
    },
  });
});

// --- Save Farming Plan to Database ---
export const saveFarmingPlanHandler = asyncHandler(async (req, res) => {
  const planData = req.body;

  if (!planData || !planData.cropName || !planData.farmDetails) {
    return res.status(400).json({ message: 'Valid crop farming plan data is required' });
  }

  const newPlan = new FarmingPlan({
    ...planData,
    farmer: req.user._id,
    planTitle: planData.planTitle || `${planData.cropName} Plan (${planData.farmDetails?.area?.value} ${planData.farmDetails?.area?.unit})`,
  });

  const saved = await newPlan.save();
  res.status(201).json({ success: true, plan: saved });
});

// --- Get Farmer's Saved Farming Plans ---
export const getFarmerFarmingPlansHandler = asyncHandler(async (req, res) => {
  const plans = await FarmingPlan.find({ farmer: req.user._id })
    .select('planTitle cropName cropVariety season sowingDate farmDetails suitabilityAssessment cropOverview budgetEstimates calendarTasks createdAt')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, count: plans.length, plans });
});

// --- Get Single Farming Plan by ID ---
export const getFarmingPlanByIdHandler = asyncHandler(async (req, res) => {
  const plan = await FarmingPlan.findOne({
    _id: req.params.id,
    farmer: req.user._id,
  });

  if (!plan) {
    return res.status(404).json({ message: 'Farming plan not found' });
  }

  res.json({ success: true, plan });
});

// --- Toggle / Update Calendar Task Completion ---
export const updateFarmingPlanTaskHandler = asyncHandler(async (req, res) => {
  const { taskId, completed } = req.body;

  const plan = await FarmingPlan.findOne({
    _id: req.params.id,
    farmer: req.user._id,
  });

  if (!plan) {
    return res.status(404).json({ message: 'Farming plan not found' });
  }

  const task = plan.calendarTasks.find((t) => t.taskId === taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found in plan' });
  }

  task.completed = completed;
  task.completedAt = completed ? new Date() : null;

  await plan.save();
  res.json({ success: true, task });
});

// --- Delete Farming Plan ---
export const deleteFarmingPlanHandler = asyncHandler(async (req, res) => {
  const plan = await FarmingPlan.findOneAndDelete({
    _id: req.params.id,
    farmer: req.user._id,
  });

  if (!plan) {
    return res.status(404).json({ message: 'Farming plan not found' });
  }

  res.json({ success: true, message: 'Plan deleted successfully' });
});
