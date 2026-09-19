import { Router } from 'express';
import * as healthController from '../controllers/healthController.js';

const router = Router();

router.get('/health', healthController.getHealth);
router.get('/tech-stack', healthController.getTechStack);
router.get('/database/schema', healthController.getSchemaSql);

export default router;
