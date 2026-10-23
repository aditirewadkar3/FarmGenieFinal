import express from 'express';
import { createEquipment, getNearbyEquipment, getMyEquipment, updateEquipment } from '../controllers/equipment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all equipment routes
router.use(protect);

// Get nearby equipment (Available to all authenticated users)
router.get('/nearby', getNearbyEquipment);

// Manage my listings
router.get('/my-listings', getMyEquipment);

router
    .route('/')
    .post(createEquipment);

router
    .route('/:id')
    .patch(updateEquipment);

export default router;
