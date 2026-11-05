import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as caloriePlanController from '../controllers/caloriePlanController.js';

const router = Router();
router.use(requireAuth);
router.get('/', caloriePlanController.getPlan);
router.put('/profile', caloriePlanController.updateProfile);

export default router;
