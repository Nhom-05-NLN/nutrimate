import { getPool } from './index.js';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_CHAT_KNOWLEDGE } from './seedData.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function seedDatabase(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('[Seed] Đang kiểm tra và nạp dữ liệu mẫu vào PostgreSQL...');

    await client.query('BEGIN');

    // 1. Seed Categories
    console.log('[Seed] 1. Khởi tạo danh mục ăn kiêng (Categories)...');
    const categoryMap = new Map<string, number>();

    for (const [index, cat] of INITIAL_CATEGORIES.entries()) {
      const res = await client.query<{ id: number }>(
        `
        INSERT INTO categories (name, slug, description, diet_type, icon, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            diet_type = EXCLUDED.diet_type,
            icon = EXCLUDED.icon,
            sort_order = EXCLUDED.sort_order
        RETURNING id;
        `,
        [cat.name, cat.slug, cat.description, cat.dietType, cat.icon || null, index + 1]
      );
      const insertedRow = res.rows[0];
      if (insertedRow) {
        categoryMap.set(cat.dietType, insertedRow.id);
      }
    }

    // 2. Seed Products
    console.log('[Seed] 2. Khởi tạo sản phẩm & bảng dinh dưỡng (Products)...');
    for (const prod of INITIAL_PRODUCTS) {
      const catId = categoryMap.get(prod.category) || null;
      const slug = slugify(prod.name) + '-' + prod.code.toLowerCase();

      await client.query(
        `
        INSERT INTO products (
          category_id, code, name, slug, category, category_name,
          price, original_price, stock_quantity, serving_size,
          calories, protein, carbs, fat, sugar, fiber, sodium,
          rating, review_count, image_url, description, ingredients,
          badges, is_featured, best_for
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22,
          $23, $24, $25
        )
        ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            price = EXCLUDED.price,
            calories = EXCLUDED.calories,
            protein = EXCLUDED.protein,
            carbs = EXCLUDED.carbs,
            fat = EXCLUDED.fat,
            sugar = EXCLUDED.sugar,
            fiber = EXCLUDED.fiber,
            sodium = EXCLUDED.sodium,
            image_url = EXCLUDED.image_url,
            description = EXCLUDED.description;
        `,
        [
          catId,
          prod.code,
          prod.name,
          slug,
          prod.category,
          prod.categoryName,
          prod.price,
          prod.originalPrice || null,
          prod.stock,
          prod.nutrition.servingSize,
          prod.nutrition.calories,
          prod.nutrition.protein,
          prod.nutrition.carbs,
          prod.nutrition.fat,
          prod.nutrition.sugar,
          prod.nutrition.fiber || 0,
          prod.nutrition.sodium || 0,
          prod.rating,
          prod.reviewCount,
          prod.image,
          prod.description,
          prod.ingredients,
          prod.badges,
          prod.isFeatured ?? false,
          prod.bestFor || null,
        ]
      );
    }

    // 3. Seed Chatbot Knowledge
    console.log('[Seed] 3. Khởi tạo tri thức tư vấn AI NutriBot...');
    for (const item of INITIAL_CHAT_KNOWLEDGE) {
      await client.query(
        `
        INSERT INTO chatbot_knowledge (intent_tag, keyword_patterns, answer_template, recommended_category)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
        `,
        [item.intentTag, item.keywordPatterns, item.answerTemplate, item.recommendedCategory || null]
      );
    }

    await client.query('COMMIT');
    console.log('✅ [Seed] Nạp dữ liệu vào PostgreSQL thành công mỹ mãn!');
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : 'Unknown seed error';
    console.error('❌ [Seed Error]:', msg);
    throw err;
  } finally {
    client.release();
  }
}

// Nếu chạy trực tiếp file từ CLI: bun run server/db/seed.ts
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
