import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { listAdminProducts, validateProduct, saveProduct, deleteProduct, ProductInputError } from '../repositories/adminProductRepository.js';

const router = Router();
router.use(requireAdmin);
router.get('/', async (_req,res) => {
  try { res.json({ success:true,data:await listAdminProducts() }); }
  catch { res.status(503).json({ success:false,message:'Không thể tải sản phẩm từ cơ sở dữ liệu.' }); }
});
for (const method of ['post','put'] as const) {
  router[method](method === 'post' ? '/' : '/:id', async (req,res) => {
    try {
      const id = await saveProduct(validateProduct(req.body ?? {}),method === 'put' && 'id' in req.params ? req.params.id : undefined);
      res.status(method === 'post' ? 201 : 200).json({ success:true,data:{ id } });
    } catch (error) {
      res.status(error instanceof ProductInputError ? error.status : 503).json({ success:false,
        message:error instanceof ProductInputError ? error.message : 'Không thể lưu sản phẩm vào cơ sở dữ liệu.' });
    }
  });
}
router.delete('/:id',async (req,res) => {
  try { await deleteProduct(req.params.id); res.json({ success:true }); }
  catch (error) { res.status(error instanceof ProductInputError ? error.status : 503).json({ success:false,
    message:error instanceof ProductInputError ? error.message : 'Không thể xóa sản phẩm khỏi cơ sở dữ liệu.' }); }
});
export default router;
