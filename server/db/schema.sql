-- ================================================================
-- NUTRIMATE DATABASE SCHEMA (PostgreSQL)
-- Đề tài: Nền tảng TMĐT thực phẩm ăn kiêng & Chatbot dinh dưỡng AI
-- Công nghệ: Frontend: Vue 3 | Backend: Node.js (Express) | Database: PostgreSQL
-- ================================================================

-- 1. Bảng tài khoản và thông tin thể trạng cơ bản của người dùng.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
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
    type VARCHAR(40) NOT NULL CHECK (type IN ('customer_registered', 'customer_logged_in')),
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    customer_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
    ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
    ON admin_notifications(created_at DESC)
    WHERE read_at IS NULL;
COMMENT ON TABLE admin_notifications IS 'Lưu thông báo hoạt động mới dành cho quản trị viên.';

-- 4. Bảng hồ sơ sức khỏe và mục tiêu dinh dưỡng của khách hàng.
CREATE TABLE IF NOT EXISTS health_profiles (
    health_profile_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age INT,
    gender VARCHAR(20),
    height_cm NUMERIC,
    weight_kg NUMERIC,
    bmi NUMERIC,
    nutrition_goal VARCHAR(50),
    daily_calorie_target INT,
    protein_target NUMERIC DEFAULT 110,
    carb_target NUMERIC DEFAULT 120,
    fat_target NUMERIC DEFAULT 50,
    activity_level VARCHAR(30) DEFAULT 'moderate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE health_profiles IS 'Lưu hồ sơ sức khỏe, chỉ số cơ thể và mục tiêu calo của khách hàng.';

-- 5. Bảng danh mục thực phẩm ăn kiêng.
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
COMMENT ON TABLE categories IS 'Lưu danh mục sản phẩm và loại chế độ ăn tương ứng.';

-- 6. Bảng sản phẩm và thông tin dinh dưỡng.
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
    serving_size VARCHAR(50) NOT NULL,
    calories DOUBLE PRECISION NOT NULL,
    protein DOUBLE PRECISION NOT NULL,
    carbs DOUBLE PRECISION NOT NULL,
    fat DOUBLE PRECISION NOT NULL,
    sugar DOUBLE PRECISION NOT NULL,
    fiber DOUBLE PRECISION DEFAULT 0,
    sodium DOUBLE PRECISION DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng đơn đặt hàng.
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(30) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'vietqr' CHECK (payment_method IN ('vietqr', 'cod', 'momo')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
    total_amount NUMERIC(12, 2) NOT NULL,
    total_calories NUMERIC(8, 1) DEFAULT 0,
    total_protein NUMERIC(8, 1) DEFAULT 0,
    shipping_fee NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE orders IS 'Lưu thông tin đơn hàng, khách nhận hàng, thanh toán và trạng thái giao hàng.';

-- 8. Bảng chi tiết sản phẩm trong từng đơn hàng.
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image TEXT,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    calories NUMERIC(6, 1) NOT NULL,
    protein NUMERIC(6, 1) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    is_ai_recommended BOOLEAN NOT NULL DEFAULT FALSE
);
COMMENT ON TABLE order_items IS 'Lưu các sản phẩm, số lượng và giá trị dinh dưỡng tại thời điểm đặt hàng.';

-- 9. Bảng nhật ký dinh dưỡng hàng ngày.
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
COMMENT ON TABLE nutrition_diary IS 'Ghi nhận thực phẩm và lượng dinh dưỡng người dùng tiêu thụ theo ngày.';
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

-- 12. Bảng ảnh thực phẩm và kết quả dự đoán dinh dưỡng.
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
    predicted_sugar DOUBLE PRECISION
);
COMMENT ON TABLE nutrition_images IS 'Lưu ảnh thực phẩm đã tải lên, trạng thái xử lý OCR và kết quả dinh dưỡng dự đoán.';
CREATE INDEX IF NOT EXISTS idx_nutrition_images_customer_date ON nutrition_images(customer_id, upload_date DESC);

-- Tối ưu hóa hiệu năng truy vấn (Indexes)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_calories ON nutrition_facts(calories);
CREATE INDEX IF NOT EXISTS idx_products_protein ON nutrition_facts(protein);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_diary_customer_date_lookup ON nutrition_diary(customer_id, date);
