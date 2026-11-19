import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { reserveProductSku, releaseProductSku } from '../repositories/adminProductRepository.js';
import { listAdminProducts, validateProduct, saveProduct, deleteProduct, ProductInputError } from '../repositories/adminProductRepository.js';

const router = Router();
router.use(requireAdmin);
router.post('/release-sku', async (req, res) => {
  if (typeof req.body?.skuReservation !== 'string') {
    res.status(400).json({ success: false, message: 'Mã giữ chỗ không hợp lệ.' });
    return;
  }
  try { await releaseProductSku(req.body.skuReservation); res.json({ success: true }); }
  catch { res.status(503).json({ success: false, message: 'Không thể giải phóng mã SKU.' }); }
});
router.post('/reserve-sku', async (_req, res) => {
  try { res.json({ success: true, data: await reserveProductSku() }); }
  catch { res.status(503).json({ success: false, message: 'Không thể cấp mã SKU. Vui lòng thử lại.' }); }
});
router.get('/', async (_req,res) => {
  try { res.json({ success:true,data:await listAdminProducts() }); }
  catch { res.status(503).json({ success:false,message:'Không thể tải sản phẩm từ cơ sở dữ liệu.' }); }
});
for (const method of ['post','put'] as const) {
  router[method](method === 'post' ? '/' : '/:id', async (req,res) => {
    try {
      const id = await saveProduct(validateProduct(req.body ?? {}, method === 'put'),method === 'put' && 'id' in req.params ? req.params.id : undefined);
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
