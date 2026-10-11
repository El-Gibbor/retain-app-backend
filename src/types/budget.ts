export type BudgetStatus = 'unset' | 'within' | 'approaching' | 'over';

export interface BudgetSummary {
  month: string;
  budget: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
}
