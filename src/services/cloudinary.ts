export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

interface CloudinaryApiResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: {
    message?: string;
  };
}

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

function getEnvVariable(key: 'VITE_CLOUDINARY_CLOUD_NAME' | 'VITE_CLOUDINARY_UPLOAD_PRESET'): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Tải ảnh trực tiếp lên Cloudinary sử dụng Unsigned Upload Preset.
 */
export async function uploadImageToCloudinary(
  file: File,
  options?: {
    preset?: string;
    folder?: string;
  }
): Promise<CloudinaryUploadResult> {
  const cloudName = getEnvVariable('VITE_CLOUDINARY_CLOUD_NAME')?.trim();
  const preset = options?.preset || getEnvVariable('VITE_CLOUDINARY_UPLOAD_PRESET')?.trim();

  if (!cloudName) {
    throw new Error('Chưa cấu hình VITE_CLOUDINARY_CLOUD_NAME trong file .env.');
  }

  if (!preset) {
    throw new Error('Chưa cấu hình VITE_CLOUDINARY_UPLOAD_PRESET trong file .env.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Định dạng file không hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WebP hoặc GIF.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Dung lượng ảnh vượt quá giới hạn (tối đa 10MB).');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  if (options?.folder) {
    formData.append('folder', options.folder);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
    throw new Error(`Không thể kết nối đến máy chủ Cloudinary: ${detail}`);
  }

  let result: CloudinaryApiResponse;
  try {
    result = (await response.json()) as CloudinaryApiResponse;
  } catch {
    throw new Error(`Cloudinary trả về phản hồi không hợp lệ (mã lỗi ${response.status}).`);
  }

  if (!response.ok || result.error) {
    const errorMsg = result.error?.message || `Lỗi tải ảnh lên Cloudinary (HTTP ${response.status}).`;
    throw new Error(errorMsg);
  }

  if (!result.secure_url || !result.public_id) {
    throw new Error('Cloudinary không trả về URL hình ảnh hợp lệ.');
  }

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Tối ưu hóa URL Cloudinary với transformation (auto format, auto quality).
 */
export function getOptimizedCloudinaryUrl(url: string, transformations = 'f_auto,q_auto'): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }
  return url.replace('/upload/', `/upload/${transformations}/`);
}
