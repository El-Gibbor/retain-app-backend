import type { Request } from 'express';
import { z } from 'zod';
import { HttpError } from './http-error';

const idParamSchema = z.object({ id: z.uuid() });

// Malformed ids are treated as missing records rather than bad requests
export const parseIdParam = (req: Request, resource: string): string => {
  const result = idParamSchema.safeParse(req.params);
  if (!result.success) {
    throw new HttpError(404, `${resource} not found`);
  }
  return result.data.id;
};
