import { z } from 'zod';

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format');

export const monthParamSchema = z.object({ month: monthSchema });

export const setBudgetSchema = z.object({
  amount: z
    .number('Amount must be a number')
    .positive('Budget must be greater than 0')
    .max(9_999_999_999.99)
    .transform((value) => Math.round(value * 100) / 100),
});

export type SetBudgetInput = z.infer<typeof setBudgetSchema>;
