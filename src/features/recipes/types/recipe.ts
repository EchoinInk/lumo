export interface RecipeIngredient { id: string; name: string; quantity: number; unit: string; }
export interface Recipe { id: string; name: string; servings: number; ingredients: RecipeIngredient[]; instructions: string; createdAt: string; updatedAt: string; deletedAt?: string | null; version: number; }
export interface RecipeInput { name: string; servings: number; ingredients: Omit<RecipeIngredient, "id">[]; instructions: string; }
