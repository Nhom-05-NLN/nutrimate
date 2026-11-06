import { Router } from 'express';
import * as adminNotificationController from '../controllers/adminNotificationController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAdmin);
router.get('/', adminNotificationController.listNotifications);
router.delete('/', adminNotificationController.deleteAllNotifications);
router.patch('/read-all', adminNotificationController.markAllRead);
router.patch('/:id/read', adminNotificationController.markRead);
router.delete('/:id', adminNotificationController.deleteNotification);

export default router;
