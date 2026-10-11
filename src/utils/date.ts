// Dates are stored as Postgres DATE values at UTC midnight
export const parseDateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export const formatDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

// Half-open range [start, end) covering a YYYY-MM month
export const monthRange = (month: string): { start: Date; end: Date } => {
  const start = parseDateOnly(`${month}-01`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

export const currentMonth = (): string => new Date().toISOString().slice(0, 7);
