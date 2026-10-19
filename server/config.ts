import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  chat: {
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || '',
    timeoutMs: 30000,
    maxContextMessages: 20,
    maxContextChars: 16000,
    jwtSecret: process.env.JWT_SECRET || '',
  },

  // Database settings
  db: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'nutrimate_db',
    connectionTimeoutMillis: 2000,
    max: 10,
  },
};
