import type { Category, Expense, Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import type { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from '../schemas/expense';
import type { ExpenseDto } from '../types/expense';
import type { Paginated } from '../types/pagination';
import { formatDateOnly, parseDateOnly } from '../utils/date';
import { HttpError } from '../utils/http-error';

const withCategory = { category: { select: { id: true, name: true } } } as const;

type ExpenseWithCategory = Expense & { category: Pick<Category, 'id' | 'name'> };

export const toExpenseDto = (expense: ExpenseWithCategory): ExpenseDto => ({
  id: expense.id,
  title: expense.title,
  amount: expense.amount.toNumber(),
  date: formatDateOnly(expense.date),
  paymentMethod: expense.paymentMethod,
  notes: expense.notes,
  category: expense.category,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

async function resolveCategoryId(categoryId?: string): Promise<string> {
  const category = categoryId
    ? await prisma.category.findUnique({ where: { id: categoryId } })
    : await prisma.category.findFirst({ where: { isDefault: true } });

  if (!category) {
    throw new HttpError(400, categoryId ? 'Category not found' : 'Default category is missing');
  }
  return category.id;
}

async function findOwnedExpense(userId: string, id: string): Promise<ExpenseWithCategory> {
  const expense = await prisma.expense.findFirst({ where: { id, userId }, include: withCategory });
  // 404 rather than 403 so other users' expense ids are not revealed
  if (!expense) {
    throw new HttpError(404, 'Expense not found');
  }
  return expense;
}

function buildWhere(userId: string, query: ListExpensesQuery): Prisma.ExpenseWhereInput {
  const { search, categoryId, paymentMethod, from, to, minAmount, maxAmount } = query;

  return {
    userId,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(categoryId?.length && { categoryId: { in: categoryId } }),
    ...(paymentMethod?.length && { paymentMethod: { in: paymentMethod } }),
    ...((from || to) && {
      date: {
        ...(from && { gte: parseDateOnly(from) }),
        ...(to && { lte: parseDateOnly(to) }),
      },
    }),
    ...((minAmount !== undefined || maxAmount !== undefined) && {
      amount: {
        ...(minAmount !== undefined && { gte: minAmount }),
        ...(maxAmount !== undefined && { lte: maxAmount }),
      },
    }),
  };
}

export async function listExpenses(
  userId: string,
  query: ListExpensesQuery,
): Promise<Paginated<ExpenseDto>> {
  const { sortBy, sortOrder, page, limit } = query;
  const where = buildWhere(userId, query);

  const [total, expenses] = await prisma.$transaction([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: withCategory,
      // Tie-breakers keep page boundaries stable
      orderBy: [{ [sortBy]: sortOrder }, { createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: expenses.map(toExpenseDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getExpense(userId: string, id: string): Promise<ExpenseDto> {
  return toExpenseDto(await findOwnedExpense(userId, id));
}

export async function createExpense(userId: string, input: CreateExpenseInput): Promise<ExpenseDto> {
  const expense = await prisma.expense.create({
    data: {
      title: input.title,
      amount: input.amount,
      date: parseDateOnly(input.date),
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      categoryId: await resolveCategoryId(input.categoryId),
      userId,
    },
    include: withCategory,
  });
  return toExpenseDto(expense);
}

export async function updateExpense(
  userId: string,
  id: string,
  input: UpdateExpenseInput,
): Promise<ExpenseDto> {
  await findOwnedExpense(userId, id);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      title: input.title,
      amount: input.amount,
      date: input.date ? parseDateOnly(input.date) : undefined,
      paymentMethod: input.paymentMethod,
      notes: 'notes' in input ? input.notes : undefined,
      categoryId: input.categoryId ? await resolveCategoryId(input.categoryId) : undefined,
    },
    include: withCategory,
  });
  return toExpenseDto(expense);
}

export async function deleteExpense(userId: string, id: string): Promise<void> {
  const { count } = await prisma.expense.deleteMany({ where: { id, userId } });
  if (count === 0) {
    throw new HttpError(404, 'Expense not found');
  }
}
