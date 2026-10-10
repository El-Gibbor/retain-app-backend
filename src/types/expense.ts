import type { PaymentMethod } from '../generated/prisma/client';

export interface ExpenseDto {
  id: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  category: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
