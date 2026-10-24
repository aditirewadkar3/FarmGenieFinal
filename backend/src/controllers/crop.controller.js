import asyncHandler from 'express-async-handler';
import { predictYieldService, getYieldMetadataService, fetchOpenMeteoWeather } from '../services/cropYield.service.js';

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
