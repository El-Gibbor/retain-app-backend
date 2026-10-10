// Dates are stored as Postgres DATE values at UTC midnight
export const parseDateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export const formatDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
