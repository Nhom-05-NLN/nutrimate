import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { getDashboard } from '../controllers/adminDashboardController.js';

const router = Router();

router.use(requireAdmin);
router.get('/', getDashboard);

export default router;
