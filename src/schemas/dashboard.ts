import { z } from 'zod';
import { currentMonth } from '../utils/date';
import { monthSchema } from './budget';

export const dashboardQuerySchema = z.object({
  month: monthSchema.default(currentMonth),
});
