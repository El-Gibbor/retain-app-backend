import { Router } from 'express';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { dashboardQuerySchema } from '../schemas/dashboard';
import { getDashboardSummary } from '../services/dashboard';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, async (req, res) => {
  const { month } = dashboardQuerySchema.parse(req.query);
  res.json(await getDashboardSummary(getAuthUser(req).id, month));
});
