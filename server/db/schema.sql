-- ================================================================
-- NUTRIMATE DATABASE SCHEMA (PostgreSQL - Neon Cloud & Local)
-- Đề tài: Nền tảng TMĐT thực phẩm ăn kiêng & Chatbot dinh dưỡng AI
-- Môn học: Niên luận Kỹ thuật Phần mềm (CT250E) - Nhóm 5
-- Tham chiếu thiết kế: class_diagram_final.png & FEATURE_BRANCHES_PLAN.md (M3)
-- Tương thích 100% với Class Diagram & RESTful API Backend
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. CỤM NGƯỜI DÙNG & HỒ SƠ THỂ TRẠNG (User, Customer, Admin, HealthProfile, Address)
-- ================================================================

-- 1. Bảng tài khoản và thông tin thể trạng cơ bản của người dùng.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avt_url TEXT,
    diet_preferences JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(diet_preferences) = 'array'),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    height_cm NUMERIC(5, 1),
    weight_kg NUMERIC(5, 1),
    age INT,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    activity_level VARCHAR(20) DEFAULT 'moderate',
    daily_calorie_target INT DEFAULT 1800,
    daily_protein_target INT DEFAULT 110,
    daily_carb_target INT DEFAULT 120,
    daily_sugar_target INT DEFAULT 25,
    nutrition_goal VARCHAR(20) CHECK (nutrition_goal IN ('lose_weight', 'maintain_weight', 'gain_weight')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE users IS 'Lưu tài khoản, thông tin cá nhân và các mục tiêu dinh dưỡng cơ bản của người dùng.';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avt_url TEXT;
ALTER TABLE users ALTER COLUMN avt_url TYPE TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_preferences JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Bảng định danh khách hàng, liên kết một-một với tài khoản người dùng.
CREATE TABLE IF NOT EXISTS customers (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE customers IS 'Đánh dấu tài khoản người dùng có vai trò khách hàng.';

-- 3. Bảng định danh quản trị viên, liên kết một-một với tài khoản người dùng.
CREATE TABLE IF NOT EXISTS admins (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);
COMMENT ON TABLE admins IS 'Đánh dấu tài khoản người dùng có vai trò quản trị viên.';

-- 3a. Thông báo dành cho quản trị viên.
CREATE TABLE IF NOT EXISTS admin_notifications (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(40) NOT NULL CHECK (type IN ('customer_registered', 'order_placed')),
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    customer_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_type_check;
DELETE FROM admin_notifications
WHERE type = 'customer_logged_in';
ALTER TABLE admin_notifications
    ADD CONSTRAINT admin_notifications_type_check
    CHECK (type IN ('customer_registered', 'order_placed'));
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
    ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
    ON admin_notifications(created_at DESC)
    WHERE read_at IS NULL;
COMMENT ON TABLE admin_notifications IS 'Lưu thông báo hoạt động mới dành cho quản trị viên.';

CREATE TABLE IF NOT EXISTS addresses (
    address_id SERIAL PRIMARY KEY,
    id INT,
    customer_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_profiles (
    health_profile_id SERIAL PRIMARY KEY,
    id INT,
    customer_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    age INT,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(5, 1) DEFAULT 170.0,
    height NUMERIC(5, 1) DEFAULT 170.0,
    weight_kg NUMERIC(5, 1) DEFAULT 65.0,
    weight NUMERIC(5, 1) DEFAULT 65.0,
    bmi NUMERIC(4, 1) DEFAULT 22.5,
    activity_level VARCHAR(30) DEFAULT 'moderate',
    nutrition_goal VARCHAR(50) DEFAULT 'maintain',
    daily_calorie_target INT DEFAULT 1800,
    calories_target NUMERIC(6, 1) DEFAULT 1800,
    protein_target NUMERIC(6, 1) DEFAULT 110,
    carb_target NUMERIC(6, 1) DEFAULT 120,
    fat_target NUMERIC(6, 1) DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE health_profiles IS 'Lưu hồ sơ sức khỏe, chỉ số cơ thể và mục tiêu calo của khách hàng.';

-- ================================================================
-- 2. CỤM SẢN PHẨM & DINH DƯỠNG (Category, Product, NutritionFact, ProductVariant, Inventory, ProductReview)
-- ================================================================
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE
);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS status BOOLEAN NOT NULL DEFAULT TRUE;
COMMENT ON TABLE categories IS 'Lưu danh mục sản phẩm và loại chế độ ăn tương ứng.';

CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    ingredients TEXT NOT NULL DEFAULT '',
    description TEXT,
    usage_instruction TEXT,
    image_url TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition_facts (
    nutrition_fact_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE CASCADE,
    serving_size VARCHAR(100) NOT NULL DEFAULT '1 khẩu phần',
    calories DOUBLE PRECISION NOT NULL DEFAULT 0,
    protein DOUBLE PRECISION NOT NULL DEFAULT 0,
    carbs DOUBLE PRECISION NOT NULL DEFAULT 0,
    fat DOUBLE PRECISION NOT NULL DEFAULT 0,
    sugar DOUBLE PRECISION NOT NULL DEFAULT 0,
    fiber DOUBLE PRECISION DEFAULT 0,
    sodium DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
    variant_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    variant_name VARCHAR(200) NOT NULL,
    weight NUMERIC(12, 2) DEFAULT 0,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_id INT REFERENCES users(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 3. TRỌNG TÂM PHÂN HỆ M3: GIỎ HÀNG, ĐẶT HÀNG & THANH TOÁN (M3 – CART, ORDER & PAYMENT)
-- ================================================================

CREATE TABLE IF NOT EXISTS carts (
    cart_id SERIAL PRIMARY KEY,
    id INT,
    customer_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    cartitem_id SERIAL PRIMARY KEY,
    id INT,
    cart_id INT NOT NULL REFERENCES carts(cart_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id SERIAL PRIMARY KEY,
    id INT,
    order_code VARCHAR(30),
    customer_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receiver_name VARCHAR(150),
    receiver_phone VARCHAR(20),
    receiver_email VARCHAR(255),
    customer_name VARCHAR(150),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    shipping_address TEXT,
    address_id INT REFERENCES addresses(address_id) ON DELETE SET NULL,
    shipping_method VARCHAR(30) DEFAULT 'standard' CHECK (shipping_method IN ('standard', 'express_2h')),
    shipping_fee NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    voucher_code VARCHAR(50),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    total_calories NUMERIC(8, 1) DEFAULT 0 CHECK (total_calories >= 0),
    total_protein NUMERIC(8, 1) DEFAULT 0 CHECK (total_protein >= 0),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled')),
    note TEXT,
    notes TEXT,
    payment_method VARCHAR(30) DEFAULT 'vietqr' CHECK (payment_method IN ('vietqr', 'cod', 'momo', 'bank_card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    driver_license_plate VARCHAR(20),
    storage_temperature VARCHAR(50) DEFAULT '4°C (Thùng giữ mát)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id SERIAL PRIMARY KEY,
    id INT,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
    variant_id INT REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    product_name VARCHAR(200),
    variant_name VARCHAR(100),
    product_image TEXT,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    calories NUMERIC(6, 1) DEFAULT 0 CHECK (calories >= 0),
    protein NUMERIC(6, 1) DEFAULT 0 CHECK (protein >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    is_ai_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE orders IS 'Lưu thông tin đơn hàng, khách nhận hàng, thanh toán và trạng thái giao hàng.';
COMMENT ON TABLE order_items IS 'Lưu các sản phẩm, số lượng và giá trị dinh dưỡng tại thời điểm đặt hàng.';

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    id INT,
    order_id INT UNIQUE NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL CHECK (method IN ('vietqr', 'cod', 'momo', 'bank_card')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    transaction_code VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id SERIAL PRIMARY KEY,
    id VARCHAR(50),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value >= 0),
    min_order_amount NUMERIC(10, 2) DEFAULT 0 CHECK (min_order_amount >= 0),
    max_discount_amount NUMERIC(10, 2),
    target_type VARCHAR(30) DEFAULT 'all' CHECK (target_type IN ('all', 'first_order')),
    usage_limit INT DEFAULT 100 CHECK (usage_limit >= 0),
    used_count INT DEFAULT 0 CHECK (used_count >= 0),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE products IS 'Lưu thông tin sản phẩm, giá bán, tồn kho và thành phần dinh dưỡng.';

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active);

-- ================================================================
-- 4. CỤM AI, NHẬT KÝ & TRI THỨC (M4 & M5)
-- ================================================================

CREATE TABLE IF NOT EXISTS chatbot_knowledge (
    id SERIAL PRIMARY KEY,
    intent_tag VARCHAR(50) NOT NULL,
    keyword_patterns TEXT[] NOT NULL,
    answer_template TEXT NOT NULL,
    recommended_category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE chatbot_knowledge IS 'Cơ sở tri thức trả lời tự động cho NutriBot.';

-- 6. Nhật ký dinh dưỡng chuẩn hóa trong nutrition_diary và diary_entries.
CREATE TABLE IF NOT EXISTS nutrition_diary (
    diary_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories DOUBLE PRECISION DEFAULT 0,
    total_protein DOUBLE PRECISION DEFAULT 0,
    total_carbs DOUBLE PRECISION DEFAULT 0,
    total_fat DOUBLE PRECISION DEFAULT 0,
    total_sugar DOUBLE PRECISION DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_diary_customer_date ON nutrition_diary(customer_id, date);

CREATE TABLE IF NOT EXISTS diary_entries (
    entry_id SERIAL PRIMARY KEY,
    diary_id INT NOT NULL REFERENCES nutrition_diary(diary_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
    food_name VARCHAR(200),
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
    calories DOUBLE PRECISION NOT NULL,
    protein DOUBLE PRECISION NOT NULL DEFAULT 0,
    carbs DOUBLE PRECISION NOT NULL DEFAULT 0,
    fat DOUBLE PRECISION NOT NULL DEFAULT 0,
    sugar DOUBLE PRECISION NOT NULL DEFAULT 0
);
COMMENT ON TABLE nutrition_logs IS 'Ghi nhận thực phẩm và lượng dinh dưỡng người dùng tiêu thụ theo ngày.';
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS food_name VARCHAR(200);

-- 10. Bảng nhật ký lượng nước uống.
CREATE TABLE IF NOT EXISTS water_logs (
    water_log_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES users(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    amount_ml INT NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE water_logs IS 'Ghi nhận lượng nước người dùng đã uống theo ngày.';

-- 11. Bảng cơ sở tri thức của chatbot NutriBot.
CREATE TABLE IF NOT EXISTS knowledge_base (
    knowledge_id SERIAL PRIMARY KEY,
    question TEXT,
    answer TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE knowledge_base IS 'Lưu câu hỏi, câu trả lời và chủ đề kiến thức dinh dưỡng cho chatbot.';

-- 9. Dự đoán dinh dưỡng từ ảnh (NutritionImage)
CREATE TABLE IF NOT EXISTS nutrition_images (
    image_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL UNIQUE,
    ocr_text TEXT,
    upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'unrecognized', 'failed')),
    predicted_calories DOUBLE PRECISION,
    predicted_protein DOUBLE PRECISION,
    predicted_carbs DOUBLE PRECISION,
    predicted_fat DOUBLE PRECISION,
    predicted_sugar DOUBLE PRECISION,
    content_sha256 CHAR(64)
);
ALTER TABLE nutrition_images ADD COLUMN IF NOT EXISTS content_sha256 CHAR(64);
COMMENT ON TABLE nutrition_images IS 'Lưu ảnh thực phẩm đã tải lên, trạng thái xử lý OCR và kết quả dinh dưỡng dự đoán.';
CREATE INDEX IF NOT EXISTS idx_nutrition_images_customer_date ON nutrition_images(customer_id, upload_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_images_customer_content_sha256
    ON nutrition_images(customer_id, content_sha256)
    WHERE content_sha256 IS NOT NULL;

-- ================================================================
-- 5. CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (INDEXES)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_calories ON nutrition_facts(calories);
CREATE INDEX IF NOT EXISTS idx_products_protein ON nutrition_facts(protein);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_diary_customer_date_lookup ON nutrition_diary(customer_id, date);

-- ================================================================
-- 6. TRIGGER TỰ ĐỒNG BỘ DỮ LIỆU & RÀNG BUỘC (DATA INTEGRITY)
-- ================================================================

CREATE OR REPLACE FUNCTION fn_sync_order_customer_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := COALESCE(NEW.id, NEW.order_id);
    NEW.receiver_name := COALESCE(NEW.receiver_name, NEW.customer_name, 'Khách hàng');
    NEW.customer_name := COALESCE(NEW.customer_name, NEW.receiver_name);
    NEW.receiver_phone := COALESCE(NEW.receiver_phone, NEW.customer_phone, '');
    NEW.customer_phone := COALESCE(NEW.customer_phone, NEW.receiver_phone);
    NEW.receiver_email := COALESCE(NEW.receiver_email, NEW.customer_email, '');
    NEW.customer_email := COALESCE(NEW.customer_email, NEW.receiver_email);
    NEW.note := COALESCE(NEW.note, NEW.notes);
    NEW.notes := COALESCE(NEW.notes, NEW.note);
    NEW.user_id := COALESCE(NEW.user_id, NEW.customer_id);
    IF NEW.customer_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM customers WHERE user_id = NEW.customer_id) THEN
        NEW.customer_id := NULL;
    END IF;
    IF NEW.customer_id IS NULL
       AND NEW.user_id IS NOT NULL
       AND EXISTS (SELECT 1 FROM customers WHERE user_id = NEW.user_id) THEN
        NEW.customer_id := NEW.user_id;
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, NEW.order_date, CURRENT_TIMESTAMP);
    NEW.order_date := COALESCE(NEW.order_date, NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_customer_fields ON orders;
CREATE TRIGGER trg_sync_order_customer_fields
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_sync_order_customer_fields();

CREATE OR REPLACE FUNCTION fn_sync_order_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payments (order_id, method, amount, status, paid_at, transaction_code)
        VALUES (
            NEW.order_id,
            COALESCE(NEW.payment_method, 'vietqr'),
            NEW.total_amount,
            COALESCE(NEW.payment_status, 'pending'),
            CASE WHEN NEW.payment_status = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END,
            'TXN-' || UPPER(SUBSTRING(MD5(COALESCE(NEW.order_code, NEW.order_id::text) || CURRENT_TIMESTAMP::text) FROM 1 FOR 8))
        )
        ON CONFLICT (order_id) DO UPDATE
        SET method = EXCLUDED.method,
            amount = EXCLUDED.amount,
            status = EXCLUDED.status,
            paid_at = CASE WHEN EXCLUDED.status = 'paid' THEN CURRENT_TIMESTAMP ELSE payments.paid_at END,
            updated_at = CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE payments
        SET method = COALESCE(NEW.payment_method, method),
            amount = NEW.total_amount,
            status = COALESCE(NEW.payment_status, status),
            paid_at = CASE WHEN NEW.payment_status = 'paid' AND payments.paid_at IS NULL THEN CURRENT_TIMESTAMP ELSE payments.paid_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_payment ON orders;
CREATE TRIGGER trg_sync_order_payment
AFTER INSERT OR UPDATE OF payment_method, payment_status, total_amount ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_sync_order_payment();
