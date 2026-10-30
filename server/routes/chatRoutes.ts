import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import * as knowledgeController from '../controllers/knowledgeController.js';

const router = Router();

router.post('/ask', chatController.askChatbot);
router.get('/knowledge', knowledgeController.listKnowledge);
router.post('/knowledge', knowledgeController.createKnowledge);
router.put('/knowledge/:id', knowledgeController.updateKnowledge);
router.delete('/knowledge/:id', knowledgeController.deleteKnowledge);
import { createNutritionImageController, parseImageBody } from '../controllers/nutritionImageController.js';
import { createChatController } from '../controllers/chatController.js';

const router = Router();

const controller = createChatController();
const nutritionImageController = createNutritionImageController();
router.post('/session', controller.session);
router.post('/conversations', controller.create);
router.get('/conversations', controller.list);
router.get('/conversations/:id/messages', controller.history);
router.post('/conversations/:id/messages', controller.ask);
router.post('/ask', controller.ask);
router.post('/nutrition-images', nutritionImageController.authorize, parseImageBody, nutritionImageController.upload);
router.get('/nutrition-images/:filename', nutritionImageController.authorize, nutritionImageController.image);

export default router;
