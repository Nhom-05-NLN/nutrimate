import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/nutritionDiaryController.js';

const router = Router();
router.use(requireAuth);
router.get('/', controller.getDay);
router.post('/meals', controller.createMeal);
router.delete('/meals/:id', controller.deleteMeal);
router.post('/water', controller.createWater);
export default router;
