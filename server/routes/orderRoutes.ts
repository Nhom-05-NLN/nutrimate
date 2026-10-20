import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';

const router = Router();

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/payment', orderController.updatePaymentStatus);

export default router;
