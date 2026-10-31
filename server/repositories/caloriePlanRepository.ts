import { getPool, isDbConnected } from '../db/index.js';
import { ActivityLevel, CalorieProfile, NutritionGoal } from '../types/caloriePlan.js';

interface ProfileRow {
  height_cm: string | null;
  weight_kg: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  activity_level: string | null;
  nutrition_goal: NutritionGoal | null;
}

const emptyProfile: CalorieProfile = {
  heightCm: null,
  weightKg: null,
  age: null,
  gender: null,
  activityLevel: null,
  nutritionGoal: null,
};

async function usesUserProfileColumns(): Promise<boolean> {
  const result = await getPool().query<{ has_profile_columns: boolean }>(
    `SELECT COUNT(*) = 6 AS has_profile_columns
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = $1
       AND column_name = ANY($2::text[])`,
    ['users', ['height_cm', 'weight_kg', 'age', 'gender', 'activity_level', 'nutrition_goal']],
  );
  return result.rows[0]?.has_profile_columns === true;
}

function toProfile(row: ProfileRow): CalorieProfile {
  const activityLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'high'];
  return {
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    age: row.age,
    gender: row.gender,
    activityLevel: activityLevels.includes(row.activity_level as ActivityLevel)
      ? row.activity_level as ActivityLevel
      : null,
    nutritionGoal: row.nutrition_goal,
  };
}

export async function getCalorieProfile(userId: string): Promise<CalorieProfile | null> {
  if (!isDbConnected()) throw new Error('PostgreSQL hiện không khả dụng.');
  if (!(await usesUserProfileColumns())) {
    const result = await getPool().query<ProfileRow>(
      `SELECT height_cm, weight_kg, age, gender, activity_level, nutrition_goal
       FROM health_profiles WHERE customer_id = $1`,
      [userId],
    );
    const row = result.rows[0];
    return row ? toProfile(row) : emptyProfile;
  }

  const result = await getPool().query<ProfileRow>(
    `SELECT height_cm, weight_kg, age, gender, activity_level, nutrition_goal
     FROM users WHERE id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return row ? toProfile(row) : null;
}

export async function saveCalorieProfile(
  userId: string,
  profile: CalorieProfile,
  targetCalories: number,
): Promise<CalorieProfile | null> {
  if (!isDbConnected()) throw new Error('PostgreSQL hiện không khả dụng.');
  if (!(await usesUserProfileColumns())) {
    const result = await getPool().query<ProfileRow>(
      `INSERT INTO health_profiles
         (customer_id, height_cm, weight_kg, age, gender, activity_level,
          nutrition_goal, bmi, daily_calorie_target, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (customer_id) DO UPDATE SET
         height_cm = EXCLUDED.height_cm,
         weight_kg = EXCLUDED.weight_kg,
         age = EXCLUDED.age,
         gender = EXCLUDED.gender,
         activity_level = EXCLUDED.activity_level,
         nutrition_goal = EXCLUDED.nutrition_goal,
         bmi = EXCLUDED.bmi,
         daily_calorie_target = EXCLUDED.daily_calorie_target,
         updated_at = CURRENT_TIMESTAMP
       RETURNING height_cm, weight_kg, age, gender, activity_level, nutrition_goal`,
      [userId, profile.heightCm, profile.weightKg, profile.age, profile.gender,
        profile.activityLevel, profile.nutritionGoal,
        Math.round(profile.weightKg! / ((profile.heightCm! / 100) ** 2) * 10) / 10,
        targetCalories],
    );
    const row = result.rows[0];
    return row ? toProfile(row) : null;
  }

  const result = await getPool().query<ProfileRow>(
    `UPDATE users
     SET height_cm = $2, weight_kg = $3, age = $4, gender = $5,
         activity_level = $6, nutrition_goal = $7, daily_calorie_target = $8,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING height_cm, weight_kg, age, gender, activity_level, nutrition_goal`,
    [userId, profile.heightCm, profile.weightKg, profile.age, profile.gender,
      profile.activityLevel, profile.nutritionGoal, targetCalories],
  );
  const row = result.rows[0];
  return row ? toProfile(row) : null;
}
