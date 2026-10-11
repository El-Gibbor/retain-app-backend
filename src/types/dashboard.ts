import type { BudgetSummary } from './budget';
import type { ExpenseDto } from './expense';

export interface CategorySpending {
  categoryId: string;
  name: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DashboardSummary {
  month: string;
  budget: BudgetSummary;
  expenseCount: number;
  highestExpense: ExpenseDto | null;
  spendingByCategory: CategorySpending[];
  recentExpenses: ExpenseDto[];
}
