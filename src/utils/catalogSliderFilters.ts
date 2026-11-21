import type { NutrientKey, NutritionBounds } from '../../shared/catalogNutrition';

export interface NutrientSlider { enabled: boolean; direction: 'min' | 'max'; value: number }
export interface AdvancedFilters {
  priceRange: number;
  nutrition: Record<NutrientKey, NutrientSlider>;
  minRating: number | null;
  onlyInStock: boolean;
}
export const nutritionSliders: { key:NutrientKey; label:string; unit:string; direction:'min'|'max' }[] = [
  {key:'calories',label:'Năng lượng / Calo',unit:'kcal',direction:'max'},
  {key:'protein',label:'Chất đạm',unit:'g',direction:'min'},
  {key:'carbs',label:'Tinh bột / Carbs',unit:'g',direction:'max'},
  {key:'sugar',label:'Đường',unit:'g',direction:'max'},
  {key:'fat',label:'Chất béo',unit:'g',direction:'max'},
  {key:'fiber',label:'Chất xơ',unit:'g',direction:'min'},
  {key:'sodium',label:'Natri',unit:'mg',direction:'max'},
];
export function defaultAdvancedFilters(): AdvancedFilters {
  return {priceRange:500000,minRating:null,onlyInStock:false,
    nutrition:Object.fromEntries(nutritionSliders.map(field => [field.key,{enabled:false,direction:field.direction,value:0}])) as AdvancedFilters['nutrition']};
}
export function nutritionBounds(filters: AdvancedFilters): NutritionBounds {
  return Object.fromEntries(Object.entries(filters.nutrition).filter(([,range]) => range.enabled)
    .map(([key,range]) => [key,{[range.direction]:range.value}]));
}
