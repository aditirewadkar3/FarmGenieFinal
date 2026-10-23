import express from 'express';
import { findLocalExperts } from '../controllers/agronomist.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/local', findLocalExperts);

export default router;
