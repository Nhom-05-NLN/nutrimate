-- ================================================================
-- NUTRIMATE DATABASE SCHEMA (PostgreSQL)
-- Đề tài: Nền tảng TMĐT thực phẩm ăn kiêng & Chatbot dinh dưỡng AI
-- Công nghệ: Frontend: Vue 3 | Backend: Node.js (Express) | Database: PostgreSQL
-- ================================================================

-- 1. Bảng Người dùng & Chỉ số thể trạng (Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Danh mục thực phẩm ăn kiêng (Categories)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    diet_type VARCHAR(50) NOT NULL CHECK (diet_type IN ('low-carb', 'high-protein', 'sugar-free', 'all')),
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Sản phẩm & Chi tiết Dinh dưỡng (Products & Nutrition Facts)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2),
    stock_quantity INT DEFAULT 50,
    serving_size VARCHAR(50) DEFAULT '1 khẩu phần',
    calories NUMERIC(6, 1) NOT NULL,
    protein NUMERIC(6, 1) NOT NULL,
    carbs NUMERIC(6, 1) NOT NULL,
    fat NUMERIC(6, 1) NOT NULL,
    sugar NUMERIC(6, 1) DEFAULT 0,
    fiber NUMERIC(6, 1) DEFAULT 0,
    sodium NUMERIC(6, 1) DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    badges TEXT[] DEFAULT ARRAY['Mới'],
    ingredients TEXT[] DEFAULT ARRAY[]::TEXT[],
    description TEXT,
    best_for TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Đơn đặt hàng (Orders)
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

-- 5. Bảng Chi tiết đơn hàng (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image TEXT,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    calories NUMERIC(6, 1) NOT NULL,
    protein NUMERIC(6, 1) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 6. Bảng Nhật ký dinh dưỡng hàng ngày (Daily Nutrition Logs)
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name VARCHAR(200) NOT NULL,
    calories NUMERIC(6, 1) NOT NULL,
    protein NUMERIC(6, 1) DEFAULT 0,
    carbs NUMERIC(6, 1) DEFAULT 0,
    fat NUMERIC(6, 1) DEFAULT 0,
    sugar NUMERIC(6, 1) DEFAULT 0,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng Theo dõi lượng nước uống (Water Intake Logs)
CREATE TABLE IF NOT EXISTS water_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    amount_ml INT NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Cơ sở tri thức Chatbot NutriBot (Chatbot Knowledge Base)
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
    id SERIAL PRIMARY KEY,
    intent_tag VARCHAR(50) NOT NULL,
    keyword_patterns TEXT[] NOT NULL,
    answer_template TEXT NOT NULL,
    recommended_category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tối ưu hóa hiệu năng truy vấn (Indexes)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_calories ON products(calories);
CREATE INDEX IF NOT EXISTS idx_products_protein ON products(protein);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, log_date);
