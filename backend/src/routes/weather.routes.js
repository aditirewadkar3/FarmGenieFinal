import express from 'express';
import { getWeatherForFarmer } from '../controllers/weather.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/').get(protect, getWeatherForFarmer);

export default router;
