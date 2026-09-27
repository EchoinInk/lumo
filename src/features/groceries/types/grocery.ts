export interface GroceryItem { id: string; name: string; quantity: number; unit: string; checked: boolean; sourceIds: string[]; generated: boolean; manuallyModified: boolean; createdAt: string; updatedAt: string; deletedAt?: string | null; version: number; }
export interface GroceryInput { name: string; quantity: number; unit: string; }
export interface GeneratedGroceryIngredient { name: string; quantity: number; unit: string; sourceId: string; legacySourceId?: string; }
