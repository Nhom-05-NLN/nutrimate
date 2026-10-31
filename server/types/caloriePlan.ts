export type NutritionGoal = 'lose_weight' | 'maintain_weight' | 'gain_weight';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';

export interface CalorieProfile {
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  activityLevel: ActivityLevel | null;
  nutritionGoal: NutritionGoal | null;
}

export interface CaloriePlan extends CalorieProfile {
  bmi: number;
  bmrKcal: number;
  tdeeKcal: number;
  targetCalories: number;
  adjustmentKcal: number;
}
