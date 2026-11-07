import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { listAdminCategories, validateCategory, writeCategory, removeCategory, categoryTransaction, CategoryInputError } from '../repositories/adminCategoryRepository.js';

const router = Router();
router.use(requireAdmin);
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
