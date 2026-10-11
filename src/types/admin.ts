import type { PublicUser } from './auth';
import type { ExpenseDto } from './expense';

export interface CategoryUsage {
  categoryId: string;
  name: string;
  total: number;
  count: number;
}

export interface AdminExpenseDto extends ExpenseDto {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminInsights {
  totalUsers: number;
  totalExpenses: number;
  totalExpenseValue: number;
  expensesThisMonth: number;
  spendingByCategory: CategoryUsage[];
  topCategories: CategoryUsage[];
  bottomCategories: CategoryUsage[];
  recentExpenses: AdminExpenseDto[];
  recentUsers: PublicUser[];
}
