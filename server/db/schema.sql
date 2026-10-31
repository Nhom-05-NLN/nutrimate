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

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

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

-- ================================================================
-- 2. CỤM SẢN PHẨM & DINH DƯỠNG (Category, Product, NutritionFact, ProductVariant, Inventory, ProductReview)
-- ================================================================

CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    id INT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100),
    description TEXT,
    diet_type VARCHAR(50) DEFAULT 'all',
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    id INT,
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    code VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220),
    category VARCHAR(50) DEFAULT 'low-carb',
    category_name VARCHAR(100) DEFAULT 'Low-Carb',
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    price NUMERIC(12, 2) DEFAULT 0,
    original_price NUMERIC(12, 2),
    image_url TEXT,
    description TEXT,
    ingredients TEXT,
    usage_instruction TEXT,
    stock_quantity INT DEFAULT 50 CHECK (stock_quantity >= 0),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    badges TEXT[] DEFAULT ARRAY['Mới'],
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    status BOOLEAN DEFAULT TRUE,
    best_for TEXT,
    serving_size VARCHAR(50) DEFAULT '1 khẩu phần',
    calories NUMERIC(6, 1) DEFAULT 0,
    protein NUMERIC(6, 1) DEFAULT 0,
    carbs NUMERIC(6, 1) DEFAULT 0,
    fat NUMERIC(6, 1) DEFAULT 0,
    sugar NUMERIC(6, 1) DEFAULT 0,
    fiber NUMERIC(6, 1) DEFAULT 0,
    sodium NUMERIC(6, 1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition_facts (
    nutrition_fact_id SERIAL PRIMARY KEY,
    id INT,
    product_id INT UNIQUE NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    serving_size VARCHAR(50) DEFAULT '1 khẩu phần',
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
    id INT,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    weight NUMERIC(8, 2) DEFAULT 0,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id SERIAL PRIMARY KEY,
    id INT,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_reviews (
    review_id SERIAL PRIMARY KEY,
    id INT,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- ================================================================
-- 5. NÂNG CẤP & ĐỒNG BỘ CỘT CHO BẢNG ĐÃ TỒN TẠI (IDEMPOTENT MIGRATION)
-- ================================================================

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin'));

ALTER TABLE categories 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS diet_type VARCHAR(50) DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS slug VARCHAR(220),
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'low-carb',
    ADD COLUMN IF NOT EXISTS category_name VARCHAR(100) DEFAULT 'Low-Carb',
    ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS original_price NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS serving_size VARCHAR(50) DEFAULT '1 khẩu phần',
    ADD COLUMN IF NOT EXISTS calories NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS protein NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS carbs NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fat NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sugar NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fiber NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sodium NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT ARRAY['Mới'],
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS best_for TEXT;

ALTER TABLE nutrition_facts
    ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sodium DOUBLE PRECISION DEFAULT 0;

ALTER TABLE nutrition_facts 
    ALTER COLUMN serving_size TYPE VARCHAR(100) USING serving_size::text;

ALTER TABLE inventory
    ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES product_variants(variant_id) ON DELETE CASCADE,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE carts 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE orders
    ALTER COLUMN order_date SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE cart_items 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS order_code VARCHAR(30),
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS receiver_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS shipping_address TEXT,
    ADD COLUMN IF NOT EXISTS address_id INT REFERENCES addresses(address_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(30) DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS total_calories NUMERIC(8, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_protein NUMERIC(8, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'vietqr',
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS driver_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS driver_license_plate VARCHAR(20),
    ADD COLUMN IF NOT EXISTS storage_temperature VARCHAR(50) DEFAULT '4°C (Thùng giữ mát)',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE order_items 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS product_image TEXT,
    ADD COLUMN IF NOT EXISTS calories NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS protein NUMERIC(6, 1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES product_variants(variant_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE addresses 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE health_profiles 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS height NUMERIC(5, 1) DEFAULT 170.0,
    ADD COLUMN IF NOT EXISTS weight NUMERIC(5, 1) DEFAULT 65.0,
    ADD COLUMN IF NOT EXISTS activity_level VARCHAR(30) DEFAULT 'moderate',
    ADD COLUMN IF NOT EXISTS calories_target NUMERIC(6, 1) DEFAULT 1800,
    ADD COLUMN IF NOT EXISTS protein_target NUMERIC(6, 1) DEFAULT 110,
    ADD COLUMN IF NOT EXISTS carb_target NUMERIC(6, 1) DEFAULT 120,
    ADD COLUMN IF NOT EXISTS fat_target NUMERIC(6, 1) DEFAULT 50;

ALTER TABLE payments 
    ADD COLUMN IF NOT EXISTS id INT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_payments_order_id'
    ) THEN
        ALTER TABLE payments ADD CONSTRAINT uq_payments_order_id UNIQUE (order_id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_order_code'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT uq_orders_order_code UNIQUE (order_code);
    END IF;
END $$;

-- Đồng bộ hai chiều ID giữa Class Diagram và Backend API
UPDATE categories SET id = category_id WHERE id IS NULL;
UPDATE products SET id = product_id WHERE id IS NULL;
UPDATE orders SET id = order_id WHERE id IS NULL;
UPDATE order_items SET id = order_item_id WHERE id IS NULL;
UPDATE carts SET id = cart_id WHERE id IS NULL;
UPDATE cart_items SET id = cartitem_id WHERE id IS NULL;
UPDATE payments SET id = payment_id WHERE id IS NULL;
UPDATE addresses SET id = address_id WHERE id IS NULL;
UPDATE health_profiles SET id = health_profile_id WHERE id IS NULL;

-- ================================================================
-- 6. CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (INDEXES)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_calories ON products(calories);
CREATE INDEX IF NOT EXISTS idx_products_protein ON products(protein);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);

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

-- ================================================================
-- 7. TRIGGER TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU & RÀNG BUỘC (DATA INTEGRITY)
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
    NEW.customer_id := COALESCE(NEW.customer_id, NEW.user_id);
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
