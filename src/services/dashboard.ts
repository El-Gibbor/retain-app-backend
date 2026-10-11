import { prisma } from '../lib/prisma';
import type { CategorySpending, DashboardSummary } from '../types/dashboard';
import { monthRange } from '../utils/date';
import { getBudgetSummary } from './budget';
import { toExpenseDto, withCategory } from './expense';

const RECENT_EXPENSES_LIMIT = 5;

async function getSpendingByCategory(
  userId: string,
  start: Date,
  end: Date,
): Promise<CategorySpending[]> {
  const groups = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  if (groups.length === 0) return [];

  const categories = await prisma.category.findMany({
    where: { id: { in: groups.map((group) => group.categoryId) } },
    select: { id: true, name: true },
  });
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const grandTotal = groups.reduce((sum, group) => sum + (group._sum.amount?.toNumber() ?? 0), 0);

  return groups
    .map((group) => {
      const total = group._sum.amount?.toNumber() ?? 0;
      return {
        categoryId: group.categoryId,
        name: names.get(group.categoryId) ?? 'Unknown',
        total,
        count: group._count._all,
        percentage: grandTotal ? Math.round((total / grandTotal) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getDashboardSummary(userId: string, month: string): Promise<DashboardSummary> {
  const { start, end } = monthRange(month);
  const where = { userId, date: { gte: start, lt: end } };

  const [budget, expenseCount, highest, spendingByCategory, recent] = await Promise.all([
    getBudgetSummary(userId, month),
    prisma.expense.count({ where }),
    prisma.expense.findFirst({
      where,
      include: withCategory,
      orderBy: [{ amount: 'desc' }, { date: 'desc' }],
    }),
    getSpendingByCategory(userId, start, end),
    prisma.expense.findMany({
      where,
      include: withCategory,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: RECENT_EXPENSES_LIMIT,
    }),
  ]);

  return {
    month,
    budget,
    expenseCount,
    highestExpense: highest ? toExpenseDto(highest) : null,
    spendingByCategory,
    recentExpenses: recent.map(toExpenseDto),
  };
}
