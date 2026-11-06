import { Router } from 'express';
import * as voucherController from '../controllers/voucherController.js';

const router = Router();

router.get('/', voucherController.getVouchers);
router.post('/validate', voucherController.validateVoucher);
router.post('/', voucherController.createVoucher);
router.patch('/:id/toggle', voucherController.toggleVoucher);
router.delete('/:id', voucherController.deleteVoucher);

export default router;
