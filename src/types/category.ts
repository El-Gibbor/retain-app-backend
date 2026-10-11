export interface CategoryDto {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface CategoryDeletionResult {
  deletedId: string;
  reassignedExpenses: number;
  reassignedTo: CategoryDto;
}
