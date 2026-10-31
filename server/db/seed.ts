import { getPool } from './index.js';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CHAT_KNOWLEDGE } from './seedData.js';

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
    console.log('[Seed] Đang kiểm tra và nạp dữ liệu mẫu vào PostgreSQL (Neon / Local)...');

    await client.query('BEGIN');

    // 1. Seed Users (User, Customer, Admin)
    console.log('[Seed] 1. Khởi tạo tài khoản Quản trị viên & Khách hàng (Users)...');
    const userRes = await client.query<{ id: number; email: string }>(
      `
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES
        ('admin@nutrimate.vn', '$2b$10$w8T0M9fH1JgZ8U7/K9mUeuC8jB2tC6sA0FqT.EwR9zN1', 'Quản Trị Viên NutriMate', '0901234567', 'admin'),
        ('hung.nguyen@example.com', '$2b$10$w8T0M9fH1JgZ8U7/K9mUeuC8jB2tC6sA0FqT.EwR9zN1', 'Nguyễn Văn Hùng', '0912345678', 'customer'),
        ('hien.tran@example.com', '$2b$10$w8T0M9fH1JgZ8U7/K9mUeuC8jB2tC6sA0FqT.EwR9zN1', 'Trần Thúy Hiền', '0987654321', 'customer')
      ON CONFLICT (email) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role
      RETURNING id, email;
      `
    );

    const userMap = new Map<string, number>();
    for (const u of userRes.rows) {
      userMap.set(u.email, u.id);
    }
    const customerId = userMap.get('hung.nguyen@example.com') || 2;

    // 2. Seed Customer Address & HealthProfile
    console.log('[Seed] 2. Khởi tạo địa chỉ nhận hàng & chỉ số thể trạng (Address & HealthProfile)...');
    await client.query(
      `
      INSERT INTO addresses (user_id, receiver_name, receiver_phone, address, is_default)
      VALUES
        ($1, 'Nguyễn Văn Hùng', '0912345678', '123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ', TRUE)
      ON CONFLICT DO NOTHING;
      `,
      [customerId]
    );

    await client.query(
      `
      INSERT INTO health_profiles (user_id, height, weight, age, gender, bmi, activity_level, nutrition_goal, calories_target, protein_target, carb_target, fat_target)
      VALUES
        ($1, 172.0, 68.5, 24, 'male', 23.2, 'moderate', 'lose-fat', 1950, 130, 140, 50)
      ON CONFLICT (user_id) DO UPDATE
      SET height = EXCLUDED.height,
          weight = EXCLUDED.weight,
          bmi = EXCLUDED.bmi,
          calories_target = EXCLUDED.calories_target;
      `,
      [customerId]
    );

    // 3. Seed Categories
    console.log('[Seed] 3. Khởi tạo danh mục ăn kiêng (Categories)...');
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

    // 4. Seed Products, NutritionFacts, ProductVariants & Inventories
    console.log('[Seed] 4. Khởi tạo món ăn, Nutrition Facts, Phân loại Portion & Tồn kho...');
    const productDbMap = new Map<string, number>();

    for (const prod of INITIAL_PRODUCTS) {
      const catId = categoryMap.get(prod.category) || null;
      const slug = slugify(prod.name) + '-' + prod.code.toLowerCase();

      const prodRes = await client.query<{ id: number }>(
        `
        INSERT INTO products (
          category_id, code, name, slug, category, category_name,
          base_price, original_price, stock_quantity, serving_size,
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
            base_price = EXCLUDED.base_price,
            calories = EXCLUDED.calories,
            protein = EXCLUDED.protein,
            carbs = EXCLUDED.carbs,
            fat = EXCLUDED.fat,
            sugar = EXCLUDED.sugar,
            fiber = EXCLUDED.fiber,
            sodium = EXCLUDED.sodium,
            image_url = EXCLUDED.image_url,
            description = EXCLUDED.description
        RETURNING id;
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
          prod.ingredients.join(', '),
          prod.badges,
          prod.isFeatured ?? false,
          prod.bestFor || null,
        ]
      );

      const dbProductId = prodRes.rows[0]?.id;
      if (dbProductId) {
        productDbMap.set(prod.code, dbProductId);

        // 4.1 Bảng NutritionFact
        await client.query(
          `
          INSERT INTO nutrition_facts (product_id, serving_size, calories, protein, carbs, fat, sugar, fiber, sodium)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (product_id) DO UPDATE
          SET serving_size = EXCLUDED.serving_size,
              calories = EXCLUDED.calories,
              protein = EXCLUDED.protein,
              carbs = EXCLUDED.carbs,
              fat = EXCLUDED.fat,
              sugar = EXCLUDED.sugar,
              fiber = EXCLUDED.fiber,
              sodium = EXCLUDED.sodium;
          `,
          [
            dbProductId,
            prod.nutrition.servingSize,
            prod.nutrition.calories,
            prod.nutrition.protein,
            prod.nutrition.carbs,
            prod.nutrition.fat,
            prod.nutrition.sugar,
            prod.nutrition.fiber || 0,
            prod.nutrition.sodium || 0,
          ]
        );

        // 4.2 Bảng ProductVariant (Portions)
        const variantRes = await client.query<{ id: number }>(
          `
          INSERT INTO product_variants (product_id, variant_name, weight, price, status)
          VALUES
            ($1, 'Khẩu phần chuẩn (Tiêu chuẩn)', 200, $2, TRUE),
            ($1, 'Gói tiết kiệm (Combo x2)', 400, $2 * 1.85, TRUE)
          ON CONFLICT DO NOTHING
          RETURNING id;
          `,
          [dbProductId, prod.price]
        );

        // 4.3 Bảng Inventory cho từng variant
        for (const vRow of variantRes.rows) {
          await client.query(
            `
            INSERT INTO inventories (variant_id, quantity)
            VALUES ($1, $2)
            ON CONFLICT (variant_id) DO UPDATE
            SET quantity = EXCLUDED.quantity;
            `,
            [vRow.id, Math.floor(prod.stock / 2) || 25]
          );
        }
      }
    }

    // 5. Seed Giỏ hàng & Mục giỏ hàng (Cart & CartItem - M3)
    console.log('[Seed] 5. Khởi tạo Giỏ hàng & Cart Items (M3)...');
    const cartRes = await client.query<{ id: number }>(
      `
      INSERT INTO carts (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP
      RETURNING id;
      `,
      [customerId]
    );

    const cartId = cartRes.rows[0]?.id;
    if (cartId && productDbMap.size > 0) {
      const firstProdId = Array.from(productDbMap.values())[0];
      if (firstProdId) {
        await client.query(
          `
          INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
          VALUES ($1, $2, 2, 49000)
          ON CONFLICT (cart_id, product_id, variant_id) DO UPDATE
          SET quantity = EXCLUDED.quantity;
          `,
          [cartId, firstProdId]
        );
      }
    }

    // 6. Seed Đơn hàng, Order Items & Payments (M3)
    console.log('[Seed] 6. Khởi tạo Đơn đặt hàng, Order Items & Payments (M3)...');
    for (const order of INITIAL_ORDERS) {
      const orderRes = await client.query<{ id: number }>(
        `
        INSERT INTO orders (
          order_code, user_id, receiver_name, customer_name,
          receiver_phone, customer_phone, receiver_email, customer_email,
          shipping_address, shipping_method, shipping_fee, total_amount,
          total_calories, total_protein, status, note, notes,
          payment_method, payment_status, driver_name, driver_phone,
          driver_license_plate, storage_temperature
        )
        VALUES (
          $1, $2, $3, $3,
          $4, $4, $5, $5,
          $6, 'express_2h', $7, $8,
          $9, $10, $11, $12, $12,
          $13, $14, 'Trần Minh Tài', '0933888999',
          '65B1-998.24', '4°C (Thùng giữ mát)'
        )
        ON CONFLICT (order_code) DO UPDATE
        SET status = EXCLUDED.status,
            payment_status = EXCLUDED.payment_status,
            total_amount = EXCLUDED.total_amount
        RETURNING id;
        `,
        [
          order.orderCode,
          customerId,
          order.customer.name,
          order.customer.phone,
          order.customer.email,
          order.customer.address,
          order.shippingFee,
          order.totalAmount,
          order.totalCalories,
          order.totalProtein,
          order.status,
          order.notes || null,
          order.paymentMethod,
          order.paymentStatus,
        ]
      );

      const dbOrderId = orderRes.rows[0]?.id;
      if (dbOrderId) {
        for (const item of order.items) {
          const prodDbId = productDbMap.get('NM-HP01') || null;
          const subtotal = item.price * item.quantity;

          await client.query(
            `
            INSERT INTO order_items (
              order_id, product_id, product_name, product_image,
              unit_price, quantity, calories, protein, subtotal
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING;
            `,
            [
              dbOrderId,
              prodDbId,
              item.productName,
              item.productImage,
              item.price,
              item.quantity,
              item.calories,
              item.protein,
              subtotal,
            ]
          );
        }
      }
    }

    // 7. Seed Chatbot Knowledge
    console.log('[Seed] 7. Khởi tạo cơ sở tri thức tư vấn AI NutriBot (M4)...');
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
    console.log('🎉 [Seed Success] Toàn bộ dữ liệu mẫu M1 -> M5 đã được nạp thành công mỹ mãn!');
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : 'Unknown seed error';
    console.error('❌ [Seed Error]:', msg);
    throw err;
  } finally {
    client.release();
  }
}

// Nếu chạy trực tiếp file từ CLI: bun run server/db/seed.ts hoặc tsx server/db/seed.ts
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
