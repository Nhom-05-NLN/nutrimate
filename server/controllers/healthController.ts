import { Request, Response } from 'express';
import { isDbConnected } from '../db/index.js';
import path from 'path';
import fs from 'fs';

export function getHealth(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    service: 'NutriMate Core API',
    timestamp: new Date().toISOString(),
    database: {
      engine: 'PostgreSQL',
      connected: isDbConnected(),
      mode: isDbConnected() ? 'PostgreSQL Live Connected' : 'In-Memory Seed Data Fallback',
    },
    techStack: {
      frontend: 'Vue.js 3 (Composition API, Pinia, Vue Router, Tailwind CSS)',
      backend: 'Node.js (Express, TypeScript, RESTful JSON API)',
      database: 'PostgreSQL (Relational DB, Schema DDL, Indexing, Triggers)',
    },
  });
}

export function getTechStack(_req: Request, res: Response): void {
  res.json({
    architecture: 'Client-Server 3-Tier Architecture',
    layers: {
      presentation: {
        name: 'Frontend Web Application',
        framework: 'Vue.js 3 (Vite)',
        stateManagement: 'Pinia Store',
        routing: 'Vue Router 4',
        styling: 'Tailwind CSS v4',
        features: [
          'Duyệt sản phẩm theo 3 chế độ: Low-Carb, High-Protein, Sugar-Free',
          'Bộ lọc đa năng theo calo, đạm, từ khóa',
          'Bảng Nutrition Facts chi tiết (Calo, Protein, Carbs, Fat, Đường, Chất xơ)',
          'Giỏ hàng trực quan và đặt hàng mô phỏng',
          'Trợ lý ảo NutriBot tư vấn dinh dưỡng ăn kiêng',
        ],
      },
      businessLogic: {
        name: 'Backend Web API',
        runtime: 'Node.js (v22+)',
        framework: 'Express.js & TypeScript',
        routes: [
          'GET /api/health',
          'GET /api/categories',
          'GET /api/products',
          'GET /api/products/:id',
          'POST /api/products',
          'GET /api/orders',
          'POST /api/orders',
          'PATCH /api/orders/:id/status',
          'POST /api/chat/ask',
        ],
      },
      persistence: {
        name: 'Database Layer',
        engine: 'PostgreSQL',
        driver: 'pg (node-postgres Pool)',
        schemaFile: '/server/db/schema.sql',
      },
    },
  });
}

export function getSchemaSql(_req: Request, res: Response): void {
  try {
    const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(sqlContent);
      return;
    }
    res.status(404).json({ error: 'Schema file not found' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error reading schema';
    res.status(500).json({ error: message });
  }
}
