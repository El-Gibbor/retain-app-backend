import { prisma } from '../lib/prisma';
import type { CategoryDto } from '../types/category';

export async function listCategories(): Promise<CategoryDto[]> {
  return prisma.category.findMany({
    select: { id: true, name: true, isDefault: true },
    // Default category sorts last so real categories lead in dropdowns
    orderBy: [{ isDefault: 'asc' }, { name: 'asc' }],
  });
}
