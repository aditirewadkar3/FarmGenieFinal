import express from 'express';
import { addLocation, listLocations } from '../controllers/location.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/', addLocation);
router.get('/', listLocations);

export default router;
