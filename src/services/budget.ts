import { prisma } from '../lib/prisma';
import type { SetBudgetInput } from '../schemas/budget';
import type { BudgetStatus, BudgetSummary } from '../types/budget';
import { monthRange } from '../utils/date';

// Share of the budget at which spending counts as approaching the limit
const APPROACHING_THRESHOLD = 0.8;

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export function getBudgetStatus(budget: number | null, spent: number): BudgetStatus {
  if (budget === null) return 'unset';
  if (spent > budget) return 'over';
  if (spent >= budget * APPROACHING_THRESHOLD) return 'approaching';
  return 'within';
}

export async function getMonthlySpent(userId: string, month: string): Promise<number> {
  const { start, end } = monthRange(month);
  const { _sum } = await prisma.expense.aggregate({
    where: { userId, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return _sum.amount?.toNumber() ?? 0;
}

export async function getBudgetSummary(userId: string, month: string): Promise<BudgetSummary> {
  const [record, spent] = await Promise.all([
    prisma.budget.findUnique({ where: { userId_month: { userId, month } } }),
    getMonthlySpent(userId, month),
  ]);
  const budget = record ? record.amount.toNumber() : null;

  return {
    month,
    budget,
    spent,
    remaining: budget === null ? null : roundMoney(budget - spent),
    percentUsed: budget === null ? null : Math.round((spent / budget) * 1000) / 10,
    status: getBudgetStatus(budget, spent),
  };
}

export async function setBudget(
  userId: string,
  month: string,
  { amount }: SetBudgetInput,
): Promise<BudgetSummary> {
  await prisma.budget.upsert({
    where: { userId_month: { userId, month } },
    update: { amount },
    create: { userId, month, amount },
  });
  return getBudgetSummary(userId, month);
}
