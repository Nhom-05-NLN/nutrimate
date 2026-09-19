import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { config } from './config.js';
import { testDbConnection } from './db/index.js';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function bootstrap() {
  const app = express();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());

  // Test PostgreSQL connection
  await testDbConnection();

  // Mount API routes under /api
  app.use('/api', apiRouter);

  // Frontend Integration (Vite middleware in dev, Static serve in prod)
  if (config.isProduction) {
    const distPath = path.join(rootDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode: attach Vite HMR middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: rootDir,
    });
    app.use(vite.middlewares);
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` NutriMate Server is running!`);
    console.log(` URL: http://localhost:${config.port}`);
    console.log(` Mode: ${config.nodeEnv}`);
    console.log(` REST API: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);
  });
}

bootstrap().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : 'Unknown bootstrap error';
  console.error('[Fatal Error starting server]:', msg);
  process.exit(1);
});
