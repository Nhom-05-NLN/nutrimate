import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/customer/login', authController.customerLogin);
router.post('/admin/login', authController.adminLogin);
router.get('/me', requireAuth, authController.me);
router.put('/me', requireAuth, authController.updateMe);
router.patch('/me/diet-preferences', requireAuth, authController.updateDietPreferences);
router.get('/me/addresses', requireAuth, authController.listAddresses);
router.post('/me/addresses', requireAuth, authController.createAddress);
router.put('/me/addresses/:addressId', requireAuth, authController.editAddress);
router.patch('/me/addresses/:addressId/default', requireAuth, authController.setDefaultAddress);
router.delete('/me/addresses/:addressId', requireAuth, authController.deleteAddress);
router.patch('/me/avatar', requireAuth, authController.updateAvatar);
router.post('/logout', authController.logout);

export default router;