import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';
import { getReviews, createReview } from '../controllers/productReviewController.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/sales-summary', requireAdmin, productController.getSalesSummary);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', requireAuth, createReview);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);

export default router;
