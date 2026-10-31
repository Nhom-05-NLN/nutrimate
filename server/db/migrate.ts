import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigration(): Promise<void> {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  console.log(`[Migration] Đang đọc file DDL: ${schemaPath}...`);

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Không tìm thấy file schema tại ${schemaPath}`);
  }

  const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('[Migration] Đang thực thi cấu trúc CSDL lên PostgreSQL / Neon Cloud...');
    await client.query('BEGIN');

    // Tách các khối lệnh SQL
    // Các function body có $$...$$ cần được giữ nguyên vẹn
    const statements: string[] = [];
    let current = '';
    let inDollarQuote = false;

    for (const line of sqlContent.split('\n')) {
      const trimmed = line.trim();
      if (!inDollarQuote && trimmed.startsWith('--')) {
        continue;
      }
      if (line.includes('$$')) {
        inDollarQuote = !inDollarQuote;
      }
      current += line + '\n';
      if (!inDollarQuote && trimmed.endsWith(';')) {
        const stmt = current.trim();
        if (stmt) {
          statements.push(stmt);
        }
        current = '';
      }
    }
    if (current.trim()) {
      statements.push(current.trim());
    }

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      try {
        await client.query(stmt);
      } catch (err) {
        console.error(`❌ [Lỗi tại câu lệnh ${i + 1}]:\n${stmt}\n`);
        throw err;
      }
    }

    await client.query('COMMIT');

    console.log('✅ [Migration Success] Khởi tạo toàn bộ CSDL NutriMate thành công!');
    console.log('📋 Danh sách bảng đã sẵn sàng:');
    console.log('   - users, customers, admins, addresses, health_profiles');
    console.log('   - categories, products, nutrition_facts, product_variants, inventory, product_reviews');
    console.log('   - carts, cart_items (M3 - Cart Management)');
    console.log('   - orders, order_items, payments (M3 - Orders & Payment)');
    console.log('   - chatbot_knowledge (M4)');
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : 'Unknown migration error';
    console.error('❌ [Migration Error]:', msg);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.includes('migrate.ts') || process.argv[1]?.includes('migrate')) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
