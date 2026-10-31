import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config();

const isCloudHost = process.env.PGHOST && !['localhost', '127.0.0.1'].includes(process.env.PGHOST);
const useSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production' || Boolean(isCloudHost);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || '',

  chat: {
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || '',
    timeoutMs: 30000,
    maxContextMessages: 20,
    maxContextChars: 16000,
    jwtSecret: process.env.JWT_SECRET || '',
  },

  nutritionImage: {
    maxUploadBytes: 5 * 1024 * 1024,
    timeoutMs: 45000,
    storageDir: path.resolve(process.cwd(), process.env.NUTRITION_IMAGE_STORAGE_DIR || 'uploads/nutrition-images'),
  },

  // Database settings
  db: {
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'nutrimate_db',
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
    max: 10,
  },
};
