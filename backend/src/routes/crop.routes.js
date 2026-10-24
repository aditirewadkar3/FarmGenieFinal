import express from 'express';
import {
  predictCropYield,
  getYieldMetadata,
  getOpenMeteoWeather,
} from '../controllers/crop.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

// Crop yield prediction & weather endpoints
router.post('/predict-yield', predictCropYield);
router.get('/yield-metadata', getYieldMetadata);
router.get('/weather-data', getOpenMeteoWeather);

export default router;
