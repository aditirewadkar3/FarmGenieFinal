import express from 'express';
import {
  predictCropYield,
  getYieldMetadata,
  getOpenMeteoWeather,
  getCropRecommendations,
  getAICropAdvisory,
  getSupportedPlannerCrops,
  generateFarmingPlanHandler,
  saveFarmingPlanHandler,
  getFarmerFarmingPlansHandler,
  getFarmingPlanByIdHandler,
  updateFarmingPlanTaskHandler,
  deleteFarmingPlanHandler,
} from '../controllers/crop.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

// Crop yield prediction & weather endpoints
router.post('/predict-yield', predictCropYield);
router.get('/yield-metadata', getYieldMetadata);
router.get('/weather-data', getOpenMeteoWeather);

// Crop recommendation & regional agronomy endpoints
router.post('/recommend', getCropRecommendations);
router.post('/recommend-ai', getAICropAdvisory);

// End-to-End Farming Planner & Crop Guide endpoints
router.get('/planner-crops', getSupportedPlannerCrops);
router.post('/plan', generateFarmingPlanHandler);
router.post('/farming-plan', saveFarmingPlanHandler);
router.get('/farming-plans', getFarmerFarmingPlansHandler);
router.get('/farming-plan/:id', getFarmingPlanByIdHandler);
router.put('/farming-plan/:id/task', updateFarmingPlanTaskHandler);
router.delete('/farming-plan/:id', deleteFarmingPlanHandler);

export default router;
