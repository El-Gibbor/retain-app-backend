import { prisma } from '../lib/prisma';
import type { CategoryInput } from '../schemas/category';
import type { CategoryDeletionResult, CategoryDto } from '../types/category';
import { HttpError } from '../utils/http-error';

const categorySelect = { id: true, name: true, isDefault: true } as const;

export async function listCategories(): Promise<CategoryDto[]> {
  return prisma.category.findMany({
    select: categorySelect,
    // Default category sorts last so real categories lead in dropdowns
    orderBy: [{ isDefault: 'asc' }, { name: 'asc' }],
  });
}

// The DB constraint is case-sensitive, so "food" and "Food" are caught here
async function assertNameAvailable(name: string, excludeId?: string): Promise<void> {
  const clash = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, NOT: excludeId ? { id: excludeId } : undefined },
  });
  if (clash) {
    throw new HttpError(409, `A category named "${clash.name}" already exists`);
  }
}

async function findCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new HttpError(404, 'Category not found');
  }
  return category;
}

export async function createCategory({ name }: CategoryInput): Promise<CategoryDto> {
  await assertNameAvailable(name);
  return prisma.category.create({ data: { name }, select: categorySelect });
}

export async function renameCategory(id: string, { name }: CategoryInput): Promise<CategoryDto> {
  await findCategory(id);
  await assertNameAvailable(name, id);
  return prisma.category.update({ where: { id }, data: { name }, select: categorySelect });
}

export async function deleteCategory(id: string): Promise<CategoryDeletionResult> {
  const category = await findCategory(id);
  if (category.isDefault) {
    throw new HttpError(400, 'The default category cannot be deleted');
  }

  const fallback = await prisma.category.findFirst({ where: { isDefault: true }, select: categorySelect });
  if (!fallback) {
    throw new HttpError(500, 'Default category is missing');
  }

  // Reassign and delete together so no expense is left pointing at a missing category
  const [{ count }] = await prisma.$transaction([
    prisma.expense.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } }),
    prisma.category.delete({ where: { id } }),
  ]);

  return { deletedId: id, reassignedExpenses: count, reassignedTo: fallback };
}
