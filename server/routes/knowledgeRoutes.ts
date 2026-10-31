import { Router } from 'express';
import * as knowledgeController from '../controllers/knowledgeController.js';

const router = Router();

router.get('/', knowledgeController.listKnowledge);
router.post('/', knowledgeController.createKnowledge);
router.post('/import', knowledgeController.importKnowledge);
router.put('/:id', knowledgeController.updateKnowledge);
router.delete('/:id', knowledgeController.deleteKnowledge);

export default router;
