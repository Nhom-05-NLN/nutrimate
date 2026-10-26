import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import * as knowledgeController from '../controllers/knowledgeController.js';

const router = Router();

router.post('/ask', chatController.askChatbot);
router.get('/knowledge', knowledgeController.listKnowledge);
router.post('/knowledge', knowledgeController.createKnowledge);
router.put('/knowledge/:id', knowledgeController.updateKnowledge);
router.delete('/knowledge/:id', knowledgeController.deleteKnowledge);

export default router;
