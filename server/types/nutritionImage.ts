export type NutritionImageStatus = 'processing' | 'completed' | 'unrecognized' | 'failed';

export interface NutritionImagePrediction {
  imageId: number;
  imageUrl: string;
  ocrText: string;
  uploadDate: string;
  status: Exclude<NutritionImageStatus, 'processing' | 'failed'>;
  predictedCalories: number | null;
  predictedProtein: number | null;
  predictedCarbs: number | null;
  predictedFat: number | null;
  predictedSugar: number | null;
}

export interface NutritionImageRow {
  image_id: number;
  customer_id: number;
  image_url: string;
  ocr_text: string | null;
  upload_date: Date | string;
  status: NutritionImageStatus;
  predicted_calories: number | null;
  predicted_protein: number | null;
  predicted_carbs: number | null;
  predicted_fat: number | null;
  predicted_sugar: number | null;
}
