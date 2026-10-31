-- ================================================================
-- NUTRIMATE DATABASE SCHEMA (PostgreSQL - Neon Cloud & Local)
-- Đề tài: Nền tảng TMĐT thực phẩm ăn kiêng & Chatbot dinh dưỡng AI
-- Môn học: Niên luận Kỹ thuật Phần mềm (CT250E) - Nhóm 5
-- Tham chiếu thiết kế: class_diagram_final.png & FEATURE_BRANCHES_PLAN.md (M3)
-- ================================================================

-- Kích hoạt tiện ích mở rộng nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. CỤM NGƯỜI DÙNG & HỒ SƠ THỂ TRẠNG (User, Customer, Admin, HealthProfile, Address)
-- ================================================================

-- Bảng Người dùng (User / Customer / Admin)
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

-- Bảng Sổ địa chỉ nhận hàng (Address - thuộc Customer)
-- Phục vụ Use Case CN_19: Checkout & Nhập thông tin nhận hàng
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Hồ sơ thể trạng & Mục tiêu Calo (HealthProfile - thuộc Customer)
CREATE TABLE IF NOT EXISTS health_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    height NUMERIC(5, 1) NOT NULL,
    weight NUMERIC(5, 1) NOT NULL,
    age INT,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    bmi NUMERIC(4, 1),
    activity_level VARCHAR(30) DEFAULT 'moderate',
    nutrition_goal VARCHAR(50) DEFAULT 'maintain',
    calories_target NUMERIC(6, 1) DEFAULT 1800,
    protein_target NUMERIC(6, 1) DEFAULT 110,
    carb_target NUMERIC(6, 1) DEFAULT 120,
    fat_target NUMERIC(6, 1) DEFAULT 50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 2. CỤM SẢN PHẨM, DANH MỤC & DINH DƯỠNG (Category, Product, NutritionFact, ProductVariant, Inventory, ProductReview)
-- ================================================================

-- Bảng Danh mục thực phẩm ăn kiêng (Category)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    diet_type VARCHAR(50) NOT NULL CHECK (diet_type IN ('all', 'low-carb', 'high-protein', 'sugar-free', 'snacks-nuts')),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Sản phẩm chính (Product)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
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
    status BOOLEAN DEFAULT TRUE,
    best_for TEXT,
    -- Giữ thêm các cột dinh dưỡng cơ bản để truy vấn nhanh và tương thích ngược với API hiện có
    calories NUMERIC(6, 1) DEFAULT 0,
    protein NUMERIC(6, 1) DEFAULT 0,
    carbs NUMERIC(6, 1) DEFAULT 0,
    fat NUMERIC(6, 1) DEFAULT 0,
    sugar NUMERIC(6, 1) DEFAULT 0,
    fiber NUMERIC(6, 1) DEFAULT 0,
    sodium NUMERIC(6, 1) DEFAULT 0,
    serving_size VARCHAR(50) DEFAULT '1 khẩu phần',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Chi tiết dinh dưỡng món ăn (NutritionFact - quan hệ 1-1 với Product)
CREATE TABLE IF NOT EXISTS nutrition_facts (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    serving_size VARCHAR(50) DEFAULT '1 khẩu phần',
    calories NUMERIC(6, 1) NOT NULL DEFAULT 0,
    protein NUMERIC(6, 1) NOT NULL DEFAULT 0,
    carbs NUMERIC(6, 1) NOT NULL DEFAULT 0,
    fat NUMERIC(6, 1) NOT NULL DEFAULT 0,
    sugar NUMERIC(6, 1) DEFAULT 0,
    fiber NUMERIC(6, 1) DEFAULT 0,
    sodium NUMERIC(6, 1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Phân loại quy cách món ăn / Portion (ProductVariant)
-- Phục vụ Use Case CN_17: Chọn portion/trọng lượng quy cách (Hộp 300g, 500g, Gói 200g...)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    weight NUMERIC(8, 2) DEFAULT 0,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Quản lý tồn kho theo phân loại (Inventory - quan hệ 1-1 với ProductVariant)
CREATE TABLE IF NOT EXISTS inventories (
    id SERIAL PRIMARY KEY,
    variant_id INT UNIQUE NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đánh giá & Bình luận sản phẩm (ProductReview)
CREATE TABLE IF NOT EXISTS product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 3. TRỌNG TÂM PHÂN HỆ M3: GIỎ HÀNG, ĐẶT HÀNG & THANH TOÁN (M3 – CART, ORDER & PAYMENT)
-- Tham chiếu: Use Cases CN_17 -> CN_24
-- ================================================================

-- 3.1 Bảng Giỏ hàng (Cart)
-- Phục vụ Use Case CN_18: Drawer trượt, trang giỏ hàng riêng, đồng bộ khách hàng
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Bảng Mục trong giỏ hàng (CartItem)
-- Phục vụ Use Case CN_17: Quick-add, cộng dồn Kcal/Đạm động
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_product_variant UNIQUE (cart_id, product_id, variant_id)
);

-- 3.3 Bảng Đơn đặt hàng (Order)
-- Phục vụ Use Cases:
-- CN_19: Thông tin nhận hàng, chọn Tiêu chuẩn vs Siêu tốc 2H
-- CN_20: Mã đơn #NM-xxxxxx, áp Voucher, tổng calo/đạm
-- CN_22: Lịch sử đơn hàng, Mua lại (Re-order)
-- CN_23: Tracking tiến trình 4 bước, tài xế, nhiệt độ 4°C
-- CN_24: Quản trị đơn hàng Admin (4 Card KPIs, lọc và cập nhật trạng thái)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(30) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    receiver_name VARCHAR(150),
    receiver_phone VARCHAR(20),
    receiver_email VARCHAR(255),
    customer_name VARCHAR(150),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    shipping_method VARCHAR(30) DEFAULT 'standard' CHECK (shipping_method IN ('standard', 'express_2h')),
    shipping_fee NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    voucher_code VARCHAR(50),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    total_calories NUMERIC(8, 1) DEFAULT 0 CHECK (total_calories >= 0),
    total_protein NUMERIC(8, 1) DEFAULT 0 CHECK (total_protein >= 0),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled')),
    note TEXT,
    notes TEXT,
    -- Trường lưu phương thức & trạng thái thanh toán để truy vấn nhanh (đồng bộ với bảng payments)
    payment_method VARCHAR(30) DEFAULT 'vietqr' CHECK (payment_method IN ('vietqr', 'cod', 'momo', 'bank_card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    -- Thông tin vận chuyển đặc thù thực phẩm ăn kiêng giữ lạnh (CN_23)
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    driver_license_plate VARCHAR(20),
    storage_temperature VARCHAR(50) DEFAULT '4°C (Thùng giữ mát)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo các cột alias hoặc view tương thích nếu cần cho các query cũ (customer_name, customer_phone, etc.)
-- PostgreSQL 12+ hỗ trợ GENERATED ALWAYS AS
-- Bảng orders đã bao gồm các cột chuẩn theo Class Diagram.

-- 3.4 Bảng Chi tiết đơn hàng (OrderItem)
-- Lưu bản chụp (Snapshot) thông tin sản phẩm và giá/calo tại thời điểm chốt đơn
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    variant_name VARCHAR(100),
    product_image TEXT,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    calories NUMERIC(6, 1) DEFAULT 0 CHECK (calories >= 0),
    protein NUMERIC(6, 1) DEFAULT 0 CHECK (protein >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 Bảng Thanh toán (Payment - Tách riêng chuẩn Class Diagram)
-- Phục vụ Use Case CN_21: Quét mã VietQR Napas động, COD, MoMo, kiểm tra đối soát giao dịch
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL CHECK (method IN ('vietqr', 'cod', 'momo', 'bank_card')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    transaction_code VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 4. CỤM TRỢ LÝ AI, NHẬT KÝ & TIỆN ÍCH (M4 & M5)
-- ================================================================

-- Bảng Phiên hội thoại Chatbot (ChatSession)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Bảng Tin nhắn Chatbot (ChatMessage)
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Cơ sở tri thức Chatbot (KnowledgeBase / ChatbotKnowledge)
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
    id SERIAL PRIMARY KEY,
    intent_tag VARCHAR(50) NOT NULL,
    keyword_patterns TEXT[] NOT NULL,
    answer_template TEXT NOT NULL,
    recommended_category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đề xuất thực đơn từ AI (MealPlanSuggestion)
CREATE TABLE IF NOT EXISTS meal_plan_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    target_calories NUMERIC(6, 1) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Ảnh nhãn dinh dưỡng quét qua OCR (NutritionImage)
CREATE TABLE IF NOT EXISTS nutrition_images (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    ocr_text TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'processed',
    predicted_calories NUMERIC(6, 1),
    predicted_protein NUMERIC(6, 1),
    predicted_carbs NUMERIC(6, 1),
    predicted_fat NUMERIC(6, 1),
    predicted_sugar NUMERIC(6, 1)
);

-- Bảng Nhật ký dinh dưỡng theo ngày (NutritionDiary)
CREATE TABLE IF NOT EXISTS nutrition_diaries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories NUMERIC(6, 1) DEFAULT 0,
    total_protein NUMERIC(6, 1) DEFAULT 0,
    total_carbs NUMERIC(6, 1) DEFAULT 0,
    total_fat NUMERIC(6, 1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_diary_date UNIQUE (user_id, log_date)
);

-- Bảng Chi tiết từng bữa ăn trong nhật ký (DiaryEntry)
CREATE TABLE IF NOT EXISTS diary_entries (
    id SERIAL PRIMARY KEY,
    diary_id INT NOT NULL REFERENCES nutrition_diaries(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name VARCHAR(200) NOT NULL,
    quantity INT DEFAULT 1,
    calories NUMERIC(6, 1) NOT NULL DEFAULT 0,
    protein NUMERIC(6, 1) DEFAULT 0,
    carbs NUMERIC(6, 1) DEFAULT 0,
    fat NUMERIC(6, 1) DEFAULT 0,
    sugar NUMERIC(6, 1) DEFAULT 0,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Theo dõi lượng nước uống (WaterLog)
CREATE TABLE IF NOT EXISTS water_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    amount_ml INT NOT NULL CHECK (amount_ml > 0),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 5. CHỈ MỤC TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (INDEXES)
-- ================================================================

-- Chỉ mục cho Sản phẩm & Lọc Dinh dưỡng
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_calories ON products(calories);
CREATE INDEX IF NOT EXISTS idx_products_protein ON products(protein);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;

-- Chỉ mục Phân hệ M3: Giỏ hàng, Đơn hàng & Thanh toán
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Chỉ mục Tiện ích & Nhật ký
CREATE INDEX IF NOT EXISTS idx_nutrition_diaries_user_date ON nutrition_diaries(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_diary ON diary_entries(diary_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, log_date);

-- ================================================================
-- 6. TRIGGER TỰ ĐỘNG ĐỒNG BỘ DỮ LIỆU & RÀNG BUỘC (DATA INTEGRITY)
-- ================================================================

-- Hàm tự động đồng bộ giữa trường Class Diagram (receiver_*) và Legacy API (customer_*)
CREATE OR REPLACE FUNCTION fn_sync_order_customer_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.receiver_name := COALESCE(NEW.receiver_name, NEW.customer_name, 'Khách hàng');
    NEW.customer_name := COALESCE(NEW.customer_name, NEW.receiver_name);
    NEW.receiver_phone := COALESCE(NEW.receiver_phone, NEW.customer_phone, '');
    NEW.customer_phone := COALESCE(NEW.customer_phone, NEW.receiver_phone);
    NEW.receiver_email := COALESCE(NEW.receiver_email, NEW.customer_email, '');
    NEW.customer_email := COALESCE(NEW.customer_email, NEW.receiver_email);
    NEW.note := COALESCE(NEW.note, NEW.notes);
    NEW.notes := COALESCE(NEW.notes, NEW.note);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_customer_fields ON orders;
CREATE TRIGGER trg_sync_order_customer_fields
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_sync_order_customer_fields();

-- Hàm tự động tạo hoặc đồng bộ bản ghi bảng payments khi orders có thay đổi
CREATE OR REPLACE FUNCTION fn_sync_order_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO payments (order_id, method, amount, status, paid_at, transaction_code)
        VALUES (
            NEW.id,
            NEW.payment_method,
            NEW.total_amount,
            NEW.payment_status,
            CASE WHEN NEW.payment_status = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END,
            'TXN-' || UPPER(SUBSTRING(MD5(NEW.order_code || CURRENT_TIMESTAMP::text) FROM 1 FOR 8))
        )
        ON CONFLICT (order_id) DO UPDATE
        SET method = EXCLUDED.method,
            amount = EXCLUDED.amount,
            status = EXCLUDED.status,
            paid_at = CASE WHEN EXCLUDED.status = 'paid' THEN CURRENT_TIMESTAMP ELSE payments.paid_at END,
            updated_at = CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE payments
        SET method = NEW.payment_method,
            amount = NEW.total_amount,
            status = NEW.payment_status,
            paid_at = CASE WHEN NEW.payment_status = 'paid' AND payments.paid_at IS NULL THEN CURRENT_TIMESTAMP ELSE payments.paid_at END,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_order_payment ON orders;
CREATE TRIGGER trg_sync_order_payment
AFTER INSERT OR UPDATE OF payment_method, payment_status, total_amount ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_sync_order_payment();
