import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { reserveCategoryCode, releaseCategoryCode } from '../repositories/adminCategoryRepository.js';
import { listAdminCategories, validateCategory, writeCategory, removeCategory, categoryTransaction, CategoryInputError } from '../repositories/adminCategoryRepository.js';

const router = Router();
router.use(requireAdmin);
router.post('/reserve-code', async (_req,res) => {
  try { res.json({success:true,data:await reserveCategoryCode()}); }
  catch (error) { res.status(error instanceof CategoryInputError ? error.status : 503).json({success:false,message:'Không thể cấp mã danh mục.'}); }
});
router.post('/release-code', async (req,res) => {
  if (typeof req.body?.codeReservation !== 'string') {res.status(400).json({success:false}); return;}
  try {await releaseCategoryCode(req.body.codeReservation);res.json({success:true});}
  catch {res.status(503).json({success:false,message:'Không thể giải phóng mã danh mục.'});}
});
router.get('/',async (_req,res) => {
  try { res.json({ success:true,data:await listAdminCategories() }); }
  catch { res.status(503).json({ success:false,message:'Không thể tải danh mục từ cơ sở dữ liệu.' }); }
});
for (const method of ['post','put'] as const) {
  router[method](method === 'post' ? '/' : '/:id',async (req,res) => {
    try {
      const input = validateCategory(req.body ?? {});
      const id = method === 'put' && 'id' in req.params ? req.params.id : undefined;
      const saved = await categoryTransaction(client => writeCategory(client,input,id));
      res.status(method === 'post' ? 201 : 200).json({ success:true,data:{ id:saved } });
    } catch (error) {
      res.status(error instanceof CategoryInputError ? error.status : 503).json({ success:false,
        message:error instanceof CategoryInputError ? error.message : 'Không thể lưu danh mục vào cơ sở dữ liệu.' });
    }
  });
}
router.delete('/:id',async (req,res) => {
  try { await categoryTransaction(client => removeCategory(client,req.params.id)); res.json({ success:true }); }
  catch (error) { res.status(error instanceof CategoryInputError ? error.status : 503).json({ success:false,
    message:error instanceof CategoryInputError ? error.message : 'Không thể xóa danh mục khỏi cơ sở dữ liệu.' }); }
});
export default router;
