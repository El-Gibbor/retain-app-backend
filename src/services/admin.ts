import { prisma } from '../lib/prisma';
import type { AdminInsights, CategoryUsage } from '../types/admin';
import { currentMonth, monthRange } from '../utils/date';
import { toPublicUser } from './auth';
import { toExpenseDto, withCategory } from './expense';

const RANKING_SIZE = 5;
const RECENT_LIMIT = 5;

// Every category is included, so unused ones still show up in the least-used ranking
async function getCategoryUsage(): Promise<CategoryUsage[]> {
  const [categories, groups] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.expense.groupBy({ by: ['categoryId'], _sum: { amount: true }, _count: { _all: true } }),
  ]);
  const usage = new Map(groups.map((group) => [group.categoryId, group]));

  return categories.map(({ id, name }) => {
    const group = usage.get(id);
    return {
      categoryId: id,
      name,
      total: group?._sum.amount?.toNumber() ?? 0,
      count: group?._count._all ?? 0,
    };
  });
}

const mostUsed = (a: CategoryUsage, b: CategoryUsage): number =>
  b.count - a.count || b.total - a.total || a.name.localeCompare(b.name);

const leastUsed = (a: CategoryUsage, b: CategoryUsage): number =>
  a.count - b.count || a.total - b.total || a.name.localeCompare(b.name);

export async function getAdminInsights(): Promise<AdminInsights> {
  const { start, end } = monthRange(currentMonth());

  const [totalUsers, totals, expensesThisMonth, categoryUsage, recentExpenses, recentUsers] =
    await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.expense.aggregate({ _count: { _all: true }, _sum: { amount: true } }),
      prisma.expense.count({ where: { date: { gte: start, lt: end } } }),
      getCategoryUsage(),
      prisma.expense.findMany({
        include: { ...withCategory, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
    ]);

  return {
    totalUsers,
    totalExpenses: totals._count._all,
    totalExpenseValue: totals._sum.amount?.toNumber() ?? 0,
    expensesThisMonth,
    spendingByCategory: [...categoryUsage].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)),
    topCategories: [...categoryUsage].sort(mostUsed).slice(0, RANKING_SIZE),
    bottomCategories: [...categoryUsage].sort(leastUsed).slice(0, RANKING_SIZE),
    recentExpenses: recentExpenses.map((expense) => ({ ...toExpenseDto(expense), user: expense.user })),
    recentUsers: recentUsers.map(toPublicUser),
  };
}
