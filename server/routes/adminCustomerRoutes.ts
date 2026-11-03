import { Router } from 'express';
import * as adminCustomerController from '../controllers/adminCustomerController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAdmin);
router.get('/', adminCustomerController.listCustomers);
router.post('/', adminCustomerController.createCustomer);
router.put('/:id', adminCustomerController.updateCustomer);
router.delete('/:id', adminCustomerController.deleteCustomer);

export default router;
