import { Router } from 'express';
import { getAuthUser, requireAuth } from '../middleware/auth';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from '../schemas/expense';
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
} from '../services/expense';
import { parseIdParam } from '../utils/params';

export const expenseRouter = Router();

expenseRouter.use(requireAuth);

expenseRouter.get('/', async (req, res) => {
  const query = listExpensesQuerySchema.parse(req.query);
  res.json(await listExpenses(getAuthUser(req).id, query));
});

expenseRouter.get('/:id', async (req, res) => {
  res.json(await getExpense(getAuthUser(req).id, parseIdParam(req, 'Expense')));
});

expenseRouter.post('/', async (req, res) => {
  const input = createExpenseSchema.parse(req.body);
  res.status(201).json(await createExpense(getAuthUser(req).id, input));
});

expenseRouter.patch('/:id', async (req, res) => {
  const id = parseIdParam(req, 'Expense');
  const input = updateExpenseSchema.parse(req.body);
  res.json(await updateExpense(getAuthUser(req).id, id, input));
});

expenseRouter.delete('/:id', async (req, res) => {
  await deleteExpense(getAuthUser(req).id, parseIdParam(req, 'Expense'));
  res.status(204).end();
});
