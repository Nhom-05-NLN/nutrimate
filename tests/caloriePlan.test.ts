import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateCaloriePlan } from '../server/services/caloriePlanService.js';
import { CalorieProfile } from '../server/types/caloriePlan.js';

const baseProfile: CalorieProfile = {
  heightCm: 160,
  weightKg: 45,
  age: 20,
  gender: 'female',
  activityLevel: 'light',
  nutritionGoal: 'maintain_weight',
};

test('calorie plan applies the correct adjustment for each goal', () => {
  const maintain = calculateCaloriePlan(baseProfile);
  const lose = calculateCaloriePlan({ ...baseProfile, nutritionGoal: 'lose_weight' });
  const gain = calculateCaloriePlan({ ...baseProfile, nutritionGoal: 'gain_weight' });

  assert.ok(maintain);
  assert.ok(lose);
  assert.ok(gain);
  assert.equal(maintain.bmrKcal, 1189);
  assert.equal(maintain.tdeeKcal, 1635);
  assert.equal(maintain.targetCalories, 1635);
  assert.equal(maintain.adjustmentKcal, 0);
  assert.equal(lose.targetCalories, 1335);
  assert.equal(lose.adjustmentKcal, -300);
  assert.equal(gain.targetCalories, 1935);
  assert.equal(gain.adjustmentKcal, 300);
  assert.equal(maintain.minimumTargetApplied, false);
  assert.equal(lose.minimumTargetApplied, false);
  assert.equal(gain.minimumTargetApplied, false);
});

test('calorie plan reports the actual adjustment when the minimum target applies', () => {
  const plan = calculateCaloriePlan({
    ...baseProfile,
    heightCm: 100,
    weightKg: 20,
    age: 120,
    activityLevel: 'sedentary',
    nutritionGoal: 'lose_weight',
  });

  assert.ok(plan);
  assert.equal(plan.targetCalories, 1200);
  assert.equal(plan.minimumTargetApplied, true);
  assert.equal(plan.adjustmentKcal, plan.targetCalories - plan.tdeeKcal);
  assert.notEqual(plan.adjustmentKcal, -300);
});

test('calorie plan is unavailable until required profile fields are complete', () => {
  assert.equal(
    calculateCaloriePlan({ ...baseProfile, nutritionGoal: null }),
    null,
  );
  assert.equal(
    calculateCaloriePlan({ ...baseProfile, nutritionGoal: undefined as unknown as typeof baseProfile.nutritionGoal }),
    null,
  );
  assert.equal(
    calculateCaloriePlan({ ...baseProfile, heightCm: Number.NaN }),
    null,
  );
  assert.equal(
    calculateCaloriePlan({ ...baseProfile, activityLevel: 'invalid' as never }),
    null,
  );
});
