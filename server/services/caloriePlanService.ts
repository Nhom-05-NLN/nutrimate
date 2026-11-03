import { ActivityLevel, CaloriePlan, CalorieProfile, NutritionGoal } from '../types/caloriePlan.js';
import * as caloriePlanRepository from '../repositories/caloriePlanRepository.js';

export class CaloriePlanError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'CaloriePlanError';
  }
}

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

const goalAdjustments: Record<NutritionGoal, number> = {
  lose_weight: -300,
  maintain_weight: 0,
  gain_weight: 300,
};

export function calculateCaloriePlan(profile: CalorieProfile): CaloriePlan | null {
  const { heightCm, weightKg, age, gender, activityLevel, nutritionGoal } = profile;
  const hasMissingRequiredFields = (
    heightCm == null ||
    weightKg == null ||
    age == null ||
    gender == null ||
    activityLevel == null ||
    nutritionGoal == null
  );

  if (hasMissingRequiredFields) {
    return null;
  }

  if (
    !Number.isFinite(heightCm) ||
    heightCm < 80 ||
    heightCm > 250 ||
    !Number.isFinite(weightKg) ||
    weightKg < 20 ||
    weightKg > 400 ||
    !Number.isInteger(age) ||
    age < 13 ||
    age > 120 ||
    (gender !== 'male' && gender !== 'female' && gender !== 'other') ||
    !(activityLevel in activityFactors) ||
    !(nutritionGoal in goalAdjustments)
  ) {
    return null;
  }

  const sexOffset = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  const bmrKcal = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset);
  const tdeeKcal = Math.round(bmrKcal * activityFactors[activityLevel]);
  const requestedTargetCalories = tdeeKcal + goalAdjustments[nutritionGoal];
  const targetCalories = Math.max(1200, requestedTargetCalories);
  return {
    ...profile,
    bmi: Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10,
    bmrKcal,
    tdeeKcal,
    adjustmentKcal: targetCalories - tdeeKcal,
    targetCalories,
    minimumTargetApplied: requestedTargetCalories < 1200,
  };
}

function validateProfile(input: unknown): CalorieProfile {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new CaloriePlanError('Dữ liệu hồ sơ không hợp lệ.', 400);
  }
  const value = input as Record<string, unknown>;
  const heightCm = value.heightCm;
  const weightKg = value.weightKg;
  const age = value.age;
  const gender = value.gender;
  const activityLevel = value.activityLevel;
  const nutritionGoal = value.nutritionGoal;

  if (typeof heightCm !== 'number' || !Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250) {
    throw new CaloriePlanError('Chiều cao phải từ 80 đến 250 cm.', 400);
  }
  if (typeof weightKg !== 'number' || !Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    throw new CaloriePlanError('Cân nặng phải từ 20 đến 400 kg.', 400);
  }
  if (typeof age !== 'number' || !Number.isInteger(age) || age < 13 || age > 120) {
    throw new CaloriePlanError('Tuổi phải là số nguyên từ 13 đến 120.', 400);
  }
  if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
    throw new CaloriePlanError('Vui lòng chọn giới tính hợp lệ.', 400);
  }
  if (activityLevel !== 'sedentary' && activityLevel !== 'light' && activityLevel !== 'moderate' && activityLevel !== 'high') {
    throw new CaloriePlanError('Vui lòng chọn mức độ hoạt động hợp lệ.', 400);
  }
  if (nutritionGoal !== 'lose_weight' && nutritionGoal !== 'maintain_weight' && nutritionGoal !== 'gain_weight') {
    throw new CaloriePlanError('Vui lòng chọn mục tiêu dinh dưỡng.', 400);
  }

  return { heightCm, weightKg, age, gender, activityLevel, nutritionGoal };
}

export async function getPlan(userId: string): Promise<{ profile: CalorieProfile; plan: CaloriePlan | null }> {
  const profile = await caloriePlanRepository.getCalorieProfile(userId);
  if (!profile) throw new CaloriePlanError('Không tìm thấy hồ sơ khách hàng.', 404);
  return { profile, plan: calculateCaloriePlan(profile) };
}

export async function updateProfile(userId: string, input: unknown): Promise<{ profile: CalorieProfile; plan: CaloriePlan }> {
  const profile = validateProfile(input);
  const plan = calculateCaloriePlan(profile);
  if (!plan) throw new CaloriePlanError('Hồ sơ chưa đủ để tính lộ trình.', 400);
  const savedProfile = await caloriePlanRepository.saveCalorieProfile(userId, profile, plan.targetCalories);
  if (!savedProfile) throw new CaloriePlanError('Không tìm thấy hồ sơ khách hàng.', 404);
  const savedPlan = calculateCaloriePlan(savedProfile);
  if (!savedPlan) throw new CaloriePlanError('Không thể tạo lộ trình từ hồ sơ đã lưu.', 500);
  return { profile: savedProfile, plan: savedPlan };
}
