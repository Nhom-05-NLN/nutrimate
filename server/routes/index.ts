import { Router } from 'express';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import voucherRoutes from './voucherRoutes.js';
import chatRoutes from './chatRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';
import healthRoutes from './healthRoutes.js';
import caloriePlanRoutes from './caloriePlanRoutes.js';
import authRoutes from './authRoutes.js';
import nutritionDiaryRoutes from './nutritionDiaryRoutes.js';
import adminCustomerRoutes from './adminCustomerRoutes.js';
import adminNotificationRoutes from './adminNotificationRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import adminProductRoutes from './adminProductRoutes.js';
import adminCategoryRoutes from './adminCategoryRoutes.js';

const apiRouter = Router();

apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/vouchers', voucherRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/calorie-plan', caloriePlanRoutes);
apiRouter.use('/nutrition-diary', nutritionDiaryRoutes);
apiRouter.use('/knowledge', knowledgeRoutes);
apiRouter.use('/admin/customers', adminCustomerRoutes);
apiRouter.use('/admin/notifications', adminNotificationRoutes);
apiRouter.use('/admin/dashboard', adminDashboardRoutes);
apiRouter.use('/admin/products', adminProductRoutes);
apiRouter.use('/admin/categories', adminCategoryRoutes);

export default apiRouter;
