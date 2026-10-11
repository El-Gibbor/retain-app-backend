import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listCategories } from '../services/category';

export const categoryRouter = Router();

categoryRouter.get('/', requireAuth, async (_req, res) => {
  res.json(await listCategories());
});
