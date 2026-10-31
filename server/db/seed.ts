import { getPool } from './index.js';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CHAT_KNOWLEDGE, INITIAL_VOUCHERS } from './seedData.js';

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
    const adminId = userMap.get('admin@nutrimate.vn') || 1;
    const customerId = userMap.get('hung.nguyen@example.com') || 2;

    // Gắn vào bảng customers và admins
    await client.query(
      `INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;`,
      [adminId]
    );
    await client.query(
      `INSERT INTO customers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;`,
      [customerId]
    );

    // 2. Seed Customer Address & HealthProfile
    console.log('[Seed] 2. Khởi tạo địa chỉ nhận hàng & chỉ số thể trạng (Address & HealthProfile)...');
    await client.query(
      `
      INSERT INTO addresses (customer_id, user_id, receiver_name, receiver_phone, address, is_default)
      VALUES
        ($1, $1, 'Nguyễn Văn Hùng', '0912345678', '123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ', TRUE)
      ON CONFLICT DO NOTHING;
      `,
      [customerId]
    );

    await client.query(
      `
      INSERT INTO health_profiles (customer_id, user_id, height_cm, weight_kg, age, gender, bmi, activity_level, nutrition_goal, daily_calorie_target)
      VALUES
        ($1, $1, 172.0, 68.5, 24, 'male', 23.2, 'moderate', 'lose-fat', 1950)
      ON CONFLICT (customer_id) DO UPDATE
      SET height_cm = EXCLUDED.height_cm,
          weight_kg = EXCLUDED.weight_kg,
          bmi = EXCLUDED.bmi,
          daily_calorie_target = EXCLUDED.daily_calorie_target;
      `,
      [customerId]
    );

    // 3. Seed Categories
    console.log('[Seed] 3. Khởi tạo danh mục ăn kiêng (Categories)...');
    const categoryMap = new Map<string, number>();

    for (const [index, cat] of INITIAL_CATEGORIES.entries()) {
      // Tìm xem category theo name đã có chưa
      const existing = await client.query<{ category_id: number }>(
        `SELECT category_id FROM categories WHERE name = $1 LIMIT 1`,
        [cat.name]
      );

      let catId: number;
      if (existing.rows.length > 0 && existing.rows[0]) {
        catId = existing.rows[0].category_id;
        await client.query(
          `
          UPDATE categories
          SET id = category_id,
              slug = $1,
              description = $2,
              diet_type = $3,
              icon = $4,
              sort_order = $5
          WHERE category_id = $6
          `,
          [cat.slug, cat.description, cat.dietType, cat.icon || null, index + 1, catId]
        );
      } else {
        const insertRes = await client.query<{ category_id: number }>(
          `
          INSERT INTO categories (name, slug, description, diet_type, icon, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING category_id;
          `,
          [cat.name, cat.slug, cat.description, cat.dietType, cat.icon || null, index + 1]
        );
        catId = insertRes.rows[0]?.category_id ?? 0;
        await client.query(`UPDATE categories SET id = category_id WHERE category_id = $1`, [catId]);
      }
      categoryMap.set(cat.dietType, catId);
    }

    // 4. Seed Products, NutritionFacts, ProductVariants & Inventories
    console.log('[Seed] 4. Khởi tạo món ăn, Nutrition Facts, Phân loại Portion & Tồn kho...');
    const productDbMap = new Map<string, number>();

    for (const prod of INITIAL_PRODUCTS) {
      const catId = categoryMap.get(prod.category) || null;
      const slug = slugify(prod.name) + '-' + prod.code.toLowerCase();

      // Kiểm tra sản phẩm theo name hoặc code
      const existProd = await client.query<{ product_id: number }>(
        `SELECT product_id FROM products WHERE name = $1 OR code = $2 LIMIT 1`,
        [prod.name, prod.code]
      );

      let dbProductId: number;

      if (existProd.rows.length > 0 && existProd.rows[0]) {
        dbProductId = existProd.rows[0].product_id;
        await client.query(
          `
          UPDATE products
          SET id = product_id,
              category_id = $1,
              code = $2,
              slug = $3,
              category = $4,
              category_name = $5,
              base_price = $6,
              price = $6,
              original_price = $7,
              stock_quantity = $8,
              serving_size = $9,
              calories = $10,
              protein = $11,
              carbs = $12,
              fat = $13,
              sugar = $14,
              fiber = $15,
              sodium = $16,
              rating = $17,
              review_count = $18,
              image_url = $19,
              description = $20,
              ingredients = $21,
              badges = $22,
              is_featured = $23,
              best_for = $24
          WHERE product_id = $25
          `,
          [
            catId,
            prod.code,
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
            dbProductId,
          ]
        );
      } else {
        const prodInsert = await client.query<{ product_id: number }>(
          `
          INSERT INTO products (
            category_id, code, name, slug, category, category_name,
            base_price, price, original_price, stock_quantity, serving_size,
            calories, protein, carbs, fat, sugar, fiber, sodium,
            rating, review_count, image_url, description, ingredients,
            badges, is_featured, best_for
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22,
            $23, $24, $25
          )
          RETURNING product_id;
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
        dbProductId = prodInsert.rows[0]?.product_id ?? 0;
        await client.query(`UPDATE products SET id = product_id WHERE product_id = $1`, [dbProductId]);
      }

      productDbMap.set(prod.code, dbProductId);

      // 4.1 Bảng NutritionFact
      await client.query(
        `
        INSERT INTO nutrition_facts (product_id, serving_size, calories, protein, carbs, fat, sugar, fiber, sodium)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (product_id) DO UPDATE
        SET calories = EXCLUDED.calories,
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
      const var1 = await client.query<{ variant_id: number }>(
        `
        INSERT INTO product_variants (product_id, variant_name, weight, price, status)
        VALUES ($1, 'Khẩu phần chuẩn (Tiêu chuẩn)', 200, $2, TRUE)
        RETURNING variant_id;
        `,
        [dbProductId, prod.price]
      );

      // 4.3 Bảng Inventory cho từng variant
      const vId = var1.rows[0]?.variant_id;
      if (vId) {
        await client.query(
          `
          INSERT INTO inventory (product_id, variant_id, quantity, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          ON CONFLICT DO NOTHING;
          `,
          [dbProductId, vId, prod.stock]
        );
      }
    }

    // 5. Seed Giỏ hàng & Mục giỏ hàng (Cart & CartItem - M3)
    console.log('[Seed] 5. Khởi tạo Giỏ hàng & Cart Items (M3)...');
    let cartId: number;
    const existCart = await client.query<{ cart_id: number }>(
      `SELECT cart_id FROM carts WHERE customer_id = $1 OR user_id = $1 LIMIT 1`,
      [customerId]
    );

    if (existCart.rows.length > 0 && existCart.rows[0]) {
      cartId = existCart.rows[0].cart_id;
    } else {
      const cRes = await client.query<{ cart_id: number }>(
        `
        INSERT INTO carts (customer_id, user_id, created_at, updated_at)
        VALUES ($1, $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING cart_id;
        `,
        [customerId]
      );
      cartId = cRes.rows[0]?.cart_id ?? 0;
      await client.query(`UPDATE carts SET id = cart_id WHERE cart_id = $1`, [cartId]);
    }

    if (productDbMap.size > 0) {
      const firstProdId = Array.from(productDbMap.values())[0];
      await client.query(
        `
        INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
        VALUES ($1, $2, 2, 49000)
        ON CONFLICT DO NOTHING;
        `,
        [cartId, firstProdId]
      );
    }

    // 6. Seed Đơn hàng, Order Items & Payments (M3)
    console.log('[Seed] 6. Khởi tạo Đơn đặt hàng, Order Items & Payments (M3)...');
    for (const order of INITIAL_ORDERS) {
      const existOrd = await client.query<{ order_id: number }>(
        `SELECT order_id FROM orders WHERE order_code = $1 LIMIT 1`,
        [order.orderCode]
      );

      let dbOrderId: number;

      if (existOrd.rows.length > 0 && existOrd.rows[0]) {
        dbOrderId = existOrd.rows[0].order_id;
        await client.query(
          `
          UPDATE orders
          SET status = $1,
              payment_status = $2,
              total_amount = $3
          WHERE order_id = $4
          `,
          [order.status, order.paymentStatus, order.totalAmount, dbOrderId]
        );
      } else {
        const oRes = await client.query<{ order_id: number }>(
          `
          INSERT INTO orders (
            order_code, customer_id, user_id, receiver_name, customer_name,
            receiver_phone, customer_phone, receiver_email, customer_email,
            shipping_address, shipping_method, shipping_fee, total_amount,
            total_calories, total_protein, status, note, notes,
            payment_method, payment_status, driver_name, driver_phone,
            driver_license_plate, storage_temperature
          )
          VALUES (
            $1, $2, $2, $3, $3,
            $4, $4, $5, $5,
            $6, 'express_2h', $7, $8,
            $9, $10, $11, $12, $12,
            $13, $14, 'Trần Minh Tài', '0933888999',
            '65B1-998.24', '4°C (Thùng giữ mát)'
          )
          RETURNING order_id;
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
        dbOrderId = oRes.rows[0]?.order_id ?? 0;
        await client.query(`UPDATE orders SET id = order_id WHERE order_id = $1`, [dbOrderId]);
      }

      for (const item of order.items) {
        const prodDbId = productDbMap.get('NM-HP01') || Array.from(productDbMap.values())[0] || null;
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

    // 8. Seed Vouchers (M3 - Promotion & Vouchers)
    console.log('[Seed] 8. Khởi tạo danh sách Voucher & Mã giảm giá (M3)...');
    for (const v of INITIAL_VOUCHERS) {
      await client.query(
        `
        INSERT INTO vouchers (
          id, code, title, description, discount_type,
          discount_value, min_order_amount, max_discount_amount,
          target_type, usage_limit, used_count, end_date, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (code) DO NOTHING;
        `,
        [
          v.id,
          v.code,
          v.title,
          v.description || null,
          v.discountType,
          v.discountValue,
          v.minOrderAmount,
          v.maxDiscountAmount || null,
          v.targetType,
          v.usageLimit,
          v.usedCount,
          v.endDate,
          v.isActive,
        ]
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

if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
