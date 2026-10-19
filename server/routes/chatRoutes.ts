import { Router } from 'express';
import { createChatController } from '../controllers/chatController.js';

const router = Router();

const controller = createChatController();
router.post('/conversations', controller.create);
router.get('/conversations', controller.list);
router.get('/conversations/:id/messages', controller.history);
router.post('/conversations/:id/messages', controller.ask);
router.post('/ask', controller.ask);

export default router;
