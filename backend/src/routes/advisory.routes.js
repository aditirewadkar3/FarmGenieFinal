import express from 'express';
import { getAdvisoriesForFarmer } from '../controllers/advisory.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.route('/').get(protect, getAdvisoriesForFarmer);
export default router;
