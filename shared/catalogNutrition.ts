export const nutrientKeys = ['calories','protein','carbs','sugar','fat','fiber','sodium'] as const;
export type NutrientKey = typeof nutrientKeys[number];
export type NutritionBounds = Partial<Record<NutrientKey, { min?: number; max?: number }>>;
export interface SliderBounds { min: number; max: number; step: number; available: boolean }
export type NutritionSliderBounds = Record<NutrientKey, SliderBounds>;

export function roundSliderBounds(min: number | null, max: number | null): SliderBounds {
  if (min === null || max === null || !Number.isFinite(min) || !Number.isFinite(max)) {
    return {min:0,max:0,step:1,available:false};
  }
  const span = Math.max(max - min, max / 10, 0.01);
  const target = span / 10;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const factor = [1,2,5,10].find(value => value * magnitude >= target)!;
  const rounding = factor * magnitude;
  const lower = Math.max(0,Number((Math.floor(min / rounding) * rounding).toPrecision(12)));
  const upper = Number((Math.ceil(max / rounding) * rounding).toPrecision(12));
  return {min:Math.min(lower,min),max:Math.max(upper,max),step:Number((rounding / 10).toPrecision(12)),available:true};
}

export function parseNutritionBounds(value: unknown): NutritionBounds {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid nutrition filters');
  const result: NutritionBounds = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!nutrientKeys.includes(key as NutrientKey) || !raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid nutrient');
    const { min, max } = raw as { min?: unknown; max?: unknown };
    if ((min === undefined && max === undefined) || [min,max].some(n => n !== undefined && (typeof n !== 'number' || !Number.isFinite(n) || n < 0))) throw new Error('Invalid bounds');
    if (min !== undefined && max !== undefined && (min as number) > (max as number)) throw new Error('Invalid bounds');
    result[key as NutrientKey] = { ...(min !== undefined ? {min:min as number} : {}), ...(max !== undefined ? {max:max as number} : {}) };
  }
  return result;
}
