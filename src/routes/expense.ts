import { Router, type Request } from 'express';
import { getAuthUser, requireAuth } from '../middleware/auth';
import {
  createExpenseSchema,
  idParamSchema,
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
import { HttpError } from '../utils/http-error';

export const expenseRouter = Router();

expenseRouter.use(requireAuth);

const parseExpenseId = (req: Request): string => {
  const result = idParamSchema.safeParse(req.params);
  if (!result.success) {
    throw new HttpError(404, 'Expense not found');
  }
  return result.data.id;
};

expenseRouter.get('/', async (req, res) => {
  const query = listExpensesQuerySchema.parse(req.query);
  res.json(await listExpenses(getAuthUser(req).id, query));
});

expenseRouter.get('/:id', async (req, res) => {
  res.json(await getExpense(getAuthUser(req).id, parseExpenseId(req)));
});

expenseRouter.post('/', async (req, res) => {
  const input = createExpenseSchema.parse(req.body);
  res.status(201).json(await createExpense(getAuthUser(req).id, input));
});

expenseRouter.patch('/:id', async (req, res) => {
  const id = parseExpenseId(req);
  const input = updateExpenseSchema.parse(req.body);
  res.json(await updateExpense(getAuthUser(req).id, id, input));
});

expenseRouter.delete('/:id', async (req, res) => {
  await deleteExpense(getAuthUser(req).id, parseExpenseId(req));
  res.status(204).end();
});
