import { Router } from 'express';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import chatRoutes from './chatRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';
import healthRoutes from './healthRoutes.js';

const apiRouter = Router();

apiRouter.use('/', healthRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/knowledge', knowledgeRoutes);

export default apiRouter;
