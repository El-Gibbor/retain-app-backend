import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { categoryInputSchema } from '../schemas/category';
import { getAdminInsights } from '../services/admin';
import { createCategory, deleteCategory, renameCategory } from '../services/category';
import { parseIdParam } from '../utils/params';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.post('/categories', async (req, res) => {
  res.status(201).json(await createCategory(categoryInputSchema.parse(req.body)));
});

adminRouter.patch('/categories/:id', async (req, res) => {
  const id = parseIdParam(req, 'Category');
  res.json(await renameCategory(id, categoryInputSchema.parse(req.body)));
});

adminRouter.delete('/categories/:id', async (req, res) => {
  res.json(await deleteCategory(parseIdParam(req, 'Category')));
});

adminRouter.get('/insights', async (_req, res) => {
  res.json(await getAdminInsights());
});
