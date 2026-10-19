import dotenv from 'dotenv';
dotenv.config();

const isCloudHost = process.env.PGHOST && !['localhost', '127.0.0.1'].includes(process.env.PGHOST);
const useSsl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production' || Boolean(isCloudHost);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

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
