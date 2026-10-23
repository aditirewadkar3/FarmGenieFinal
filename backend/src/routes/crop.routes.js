import express from 'express';
import { addCrop, getCrops, deleteCrop } from '../controllers/crop.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

// Farmer routes
router.post('/', addCrop);
router.get('/', getCrops);
router.delete('/:id', deleteCrop);

export default router;
