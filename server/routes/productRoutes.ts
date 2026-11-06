import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/sales-summary', requireAdmin, productController.getSalesSummary);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);

export default router;
