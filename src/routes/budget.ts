import { Router } from 'express';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { monthParamSchema, setBudgetSchema } from '../schemas/budget';
import { getBudgetSummary, setBudget } from '../services/budget';

export const budgetRouter = Router();

budgetRouter.use(requireAuth);

budgetRouter.get('/:month', async (req, res) => {
  const { month } = monthParamSchema.parse(req.params);
  res.json(await getBudgetSummary(getAuthUser(req).id, month));
});

budgetRouter.put('/:month', async (req, res) => {
  const { month } = monthParamSchema.parse(req.params);
  const input = setBudgetSchema.parse(req.body);
  res.json(await setBudget(getAuthUser(req).id, month, input));
});
