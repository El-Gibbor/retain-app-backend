import { z } from 'zod';
import { PaymentMethod } from '../generated/prisma/client';

const MAX_AMOUNT = 9_999_999_999.99;

const amount = z
  .number('Amount must be a number')
  .positive('Amount must be greater than 0')
  .max(MAX_AMOUNT)
  .transform((value) => Math.round(value * 100) / 100);

const notes = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((value) => value || null);

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  amount,
  date: z.iso.date('Date must be in YYYY-MM-DD format'),
  paymentMethod: z.enum(PaymentMethod, 'Choose a valid payment method'),
  // Falls back to the default category when omitted
  categoryId: z.uuid('Choose a valid category').optional(),
  notes,
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, 'Provide at least one field to update');

// Accepts ?key=a,b or ?key=a&key=b
const csvList = <T extends z.ZodType>(item: T) =>
  z.preprocess(
    (value) =>
      (Array.isArray(value) ? value.join(',') : String(value))
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    z.array(item),
  );

export const listExpensesQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    categoryId: csvList(z.uuid()).optional(),
    paymentMethod: csvList(z.enum(PaymentMethod)).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    minAmount: z.coerce.number().nonnegative().optional(),
    maxAmount: z.coerce.number().nonnegative().optional(),
    sortBy: z.enum(['date', 'amount']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  })
  .refine((q) => q.minAmount === undefined || q.maxAmount === undefined || q.minAmount <= q.maxAmount, {
    message: '"minAmount" must not exceed "maxAmount"',
    path: ['minAmount'],
  });

export const idParamSchema = z.object({ id: z.uuid() });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
