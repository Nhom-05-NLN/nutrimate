export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionDiaryEntry {
  id: number;
  mealType: MealType;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  createdAt: string;
}

export interface WaterDiaryEntry {
  id: number;
  amountMl: number;
  loggedAt: string;
}

export interface NutritionDiaryDay {
  date: string;
  meals: NutritionDiaryEntry[];
  waterLogs: WaterDiaryEntry[];
  totals: { calories: number; protein: number; carbs: number; fat: number; sugar: number; waterMl: number };
}
