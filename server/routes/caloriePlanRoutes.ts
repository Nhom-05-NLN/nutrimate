import { NextFunction, Request, Response, Router } from 'express';
import { AuthLocals, requireAuth } from '../middleware/authMiddleware.js';
import * as caloriePlanController from '../controllers/caloriePlanController.js';

const router = Router();

function requireCustomer(
  _req: Request,
  res: Response<unknown, Partial<AuthLocals>>,
  next: NextFunction,
): void {
  if (res.locals.auth?.role !== 'customer') {
    res.status(403).json({ success: false, message: 'Chức năng này chỉ dành cho khách hàng.' });
    return;
  }
  next();
}

router.use(requireAuth, requireCustomer);
router.get('/', caloriePlanController.getPlan);
router.put('/profile', caloriePlanController.updateProfile);

export default router;
