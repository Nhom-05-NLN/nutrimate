# THIẾT KẾ CƠ SỞ DỮ LIỆU PHÂN HỆ M3: GIỎ HÀNG, ĐẶT HÀNG & THANH TOÁN (POSTGRESQL / NEON CLOUD)

> **Dự án:** NutriMate – Nền tảng TMĐT thực phẩm ăn kiêng & Chatbot Dinh dưỡng AI  
> **Học phần:** Niên luận Kỹ thuật Phần mềm (CT250E) – Nhóm 5  
> **Tài liệu tham chiếu:** `class_diagram_final.png`, `docs/FEATURE_BRANCHES_PLAN.md` (M3 – CN_17 đến CN_24)  
> **Hệ quản trị CSDL:** PostgreSQL (>= v15) trên dịch vụ điện toán đám mây **Neon** (Neon.tech Serverless Postgres)

---

## 1. TỔNG QUAN & PHẠM VI THIẾT KẾ

Trong Class Diagram (`class_diagram_final.png`), **Phân hệ M3** đóng vai trò là "trái tim giao dịch" của toàn bộ nền tảng thương mại điện tử NutriMate. Phân hệ này chịu trách nhiệm:
1. Tiếp nhận và lưu trữ tạm thời các món ăn kiêng khách hàng muốn mua (`Cart`, `CartItem`).
2. Quản lý việc đặt hàng, tính toán tổng tiền, chiết khấu và cộng dồn lượng **Calo / Đạm** khách nạp vào cơ thể (`Order`, `OrderItem`).
3. Tách biệt thực thể thanh toán (`Payment`) để hỗ trợ thanh toán mô phỏng đa kênh: **VietQR Napas động**, **COD**, **Ví MoMo**.
4. Liên kết chặt chẽ với các phân loại món ăn (`ProductVariant`), định lượng khẩu phần (`Portion`), và số lượng tồn kho thực tế (`Inventory`).

---

## 2. BẢNG ÁNH XẠ THỰC THỂ: CLASS DIAGRAM $\rightarrow$ POSTGRESQL TABLES

| Lớp trong Class Diagram | Bảng trong PostgreSQL | Khóa chính (PK) | Khóa ngoại (FK) | Mối quan hệ nghiệp vụ |
|---|---|---|---|---|
| **`User` / `Customer`** | `users` | `id` | - | Lưu tài khoản khách hàng và quản trị viên (`role`) |
| **`Address`** | `addresses` | `id` | `user_id` $\rightarrow$ `users(id)` | Sổ địa chỉ giao hàng của khách (CN_19) |
| **`HealthProfile`** | `health_profiles` | `id` | `user_id` $\rightarrow$ `users(id)` | Hồ sơ thể trạng, mục tiêu calo, BMI (CN_04) |
| **`Category`** | `categories` | `id` | - | Danh mục chế độ ăn (Low-Carb, High-Protein, Sugar-Free) |
| **`Product`** | `products` | `id` | `category_id` $\rightarrow$ `categories(id)` | Thông tin sản phẩm món ăn kiêng |
| **`NutritionFact`** | `nutrition_facts` | `id` | `product_id` $\rightarrow$ `products(id)` | Bảng Nutrition Facts (Calo, Đạm, Đường, Béo, Natri) |
| **`ProductVariant`** | `product_variants` | `id` | `product_id` $\rightarrow$ `products(id)` | Phân loại quy cách / portion (Gói 200g, Hộp 500g...) |
| **`Inventory`** | `inventories` | `id` | `variant_id` $\rightarrow$ `product_variants(id)` | Số lượng tồn kho theo từng variant |
| **`Cart` (M3)** | `carts` | `id` | `user_id` $\rightarrow$ `users(id)` | Giỏ hàng của từng khách hàng (1 User - 1 Cart) |
| **`CartItem` (M3)** | `cart_items` | `id` | `cart_id` $\rightarrow$ `carts(id)`<br>`variant_id` $\rightarrow$ `product_variants(id)` | Chi tiết từng món trong giỏ hàng (CN_17, CN_18) |
| **`Order` (M3)** | `orders` | `id` | `user_id` $\rightarrow$ `users(id)` | Đơn đặt hàng, thông tin giao hàng, tổng calo/đạm |
| **`OrderItem` (M3)** | `order_items` | `id` | `order_id` $\rightarrow$ `orders(id)`<br>`variant_id` $\rightarrow$ `product_variants(id)` | Snapshot từng món ăn trong đơn hàng |
| **`Payment` (M3)** | `payments` | `id` | `order_id` $\rightarrow$ `orders(id)` | Giao dịch thanh toán mô phỏng (VietQR, COD, MoMo) |

---

## 3. SƠ ĐỒ QUAN HỆ THỰC THỂ (ERD DIAGRAM - M3)

```mermaid
erDiagram
    users ||--o{ addresses : "sở hữu (1:N)"
    users ||--o| health_profiles : "có hồ sơ (1:1)"
    users ||--o| carts : "sở hữu giỏ hàng (1:1)"
    users ||--o{ orders : "đặt hàng (1:N)"

    categories ||--o{ products : "chứa (1:N)"
    products ||--|| nutrition_facts : "thành phần (1:1)"
    products ||--|{ product_variants : "có quy cách (1:N)"
    product_variants ||--|| inventories : "quản lý kho (1:1)"

    carts ||--o{ cart_items : "chứa (1:N)"
    product_variants ||--o{ cart_items : "nằm trong (1:N)"
    products ||--o{ cart_items : "tham chiếu (1:N)"

    orders ||--|{ order_items : "bao gồm (1:N)"
    orders ||--o| payments : "thanh toán (1:1)"
    product_variants ||--o{ order_items : "thuộc về (1:N)"
    products ||--o{ order_items : "tham chiếu (1:N)"
```

---

## 4. CHI TIẾT ĐẶC TẢ CÁC BẢNG TRỌNG TÂM PHÂN HỆ M3

### 4.1. Bảng `carts` (Giỏ Hàng Khách Hàng)
- **Mục đích:** Lưu trữ giỏ hàng hiện hành của khách hàng (hoặc phiên làm việc vãng lai) phục vụ chức năng **CN_18**.
- **DDL:**
```sql
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2. Bảng `cart_items` (Mục Trong Giỏ Hàng)
- **Mục đích:** Lưu số lượng món, quy cách portion chọn mua và đơn giá tức thời phục vụ **CN_17** (Quick-add và tính cộng dồn Kcal/Đạm).
- **Ràng buộc:** `UNIQUE (cart_id, product_id, variant_id)` ngăn trùng lặp món trong cùng 1 giỏ hàng (thay vì chèn mới sẽ cộng dồn `quantity`).
- **DDL:**
```sql
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
```

### 4.3. Bảng `orders` (Đơn Đặt Hàng)
- **Mục đích:** Quản lý toàn bộ tiến trình đơn hàng từ lúc đặt (**CN_20**), chọn phương thức vận chuyển tiêu chuẩn hoặc Siêu tốc 2H giữ mát 4°C (**CN_19**), xem lịch sử và tra cứu (**CN_22**, **CN_23**), đến xử lý đơn hàng trên giao diện Quản trị (**CN_24**).
- **DDL:**
```sql
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(30) UNIQUE NOT NULL, -- Định dạng chuẩn #NM-xxxxxx
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
    payment_method VARCHAR(30) DEFAULT 'vietqr' CHECK (payment_method IN ('vietqr', 'cod', 'momo', 'bank_card')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    driver_license_plate VARCHAR(20),
    storage_temperature VARCHAR(50) DEFAULT '4°C (Thùng giữ mát)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4. Bảng `order_items` (Chi Tiết Đơn Hàng)
- **Mục đích:** Lưu ảnh chụp (snapshot) dữ liệu sản phẩm tại thời điểm giao dịch thành công. Tránh trường hợp sau này sản phẩm đổi giá hoặc đổi tên làm sai lệch lịch sử giao dịch.
- **DDL:**
```sql
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
```

### 4.5. Bảng `payments` (Thanh Toán Đơn Hàng)
- **Mục đích:** Quản lý giao dịch thanh toán mô phỏng theo chuẩn Class Diagram phục vụ **CN_21** (VietQR Napas, COD, MoMo).
- **Ràng buộc:** `order_id INT UNIQUE` đảm bảo mỗi đơn hàng liên kết với 1 phiên thanh toán chính thức (quan hệ $1:1$ hoặc $0..1$).
- **DDL:**
```sql
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
```

### 4.6. Trigger Tự Động Đồng Bộ (`fn_sync_order_payment`)
Hệ thống tích hợp trigger tự động trong PostgreSQL: mỗi khi một đơn hàng mới được tạo hoặc cập nhật trạng thái thanh toán ở bảng `orders`, PostgreSQL sẽ tự động sinh hoặc cập nhật bản ghi tương ứng trong bảng `payments`, bảo đảm tính nhất quán dữ liệu $100\%$.

---

## 5. HƯỚNG DẪN CẤU HÌNH & ĐẨY CSDL LÊN NEON (POSTGRESQL CLOUD)

### Bước 1: Khởi tạo Project trên Neon.tech
1. Truy cập [https://neon.tech](https://neon.tech) và đăng nhập bằng tài khoản GitHub hoặc Google.
2. Nhấn **Create Project**.
3. Điền thông tin dự án:
   - **Project Name:** `nutrimate-db`
   - **Postgres version:** `15` hoặc `16` (mặc định)
   - **Region:** Chọn `Asia Pacific (Singapore) - ap-southeast-1` để có tốc độ truy vấn nhanh nhất tại Việt Nam.
4. Nhấn **Create Project**.

### Bước 2: Lấy Connection String từ Neon Dashboard
1. Trên giao diện Neon Dashboard, tại mục **Connection Details**, chọn tab **Pooled connection** (hoặc Direct connection).
2. Định dạng chuỗi kết nối sẽ có dạng:
   ```text
   postgresql://neondb_owner:npg_xxxxxxxxxxxx@ep-cool-snowflake-a1b2c3d4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Nhấp nút **Copy**.

### Bước 3: Cấu hình biến môi trường `.env` trong dự án NutriMate
Mở file `.env` tại thư mục gốc dự án (sao chép từ `.env.example` nếu chưa có) và dán Connection String:

```env
# ========================================================
# Cấu hình kết nối Neon PostgreSQL Cloud
# ========================================================
PORT=3000
NODE_ENV=development

# Cách 1: Dán 1 dòng DATABASE_URL duy nhất (Khuyên dùng)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-snowflake-a1b2c3d4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Cách 2: Tách thành các biến riêng biệt
# PGHOST=ep-cool-snowflake-a1b2c3d4-pooler.ap-southeast-1.aws.neon.tech
# PGPORT=5432
# PGUSER=neondb_owner
# PGPASSWORD=YOUR_PASSWORD
# PGDATABASE=neondb
# PGSSLMODE=require
```

### Bước 4: Chạy lệnh tự động tạo bảng (Migration) & nạp dữ liệu (Seed)

Dự án đã tích hợp sẵn 3 câu lệnh thuận tiện trong `package.json`:

```bash
# Lệnh 1: Khởi tạo toàn bộ bảng, chỉ mục và trigger lên Neon
bun run db:migrate   # hoặc: npm run db:migrate

# Lệnh 2: Nạp dữ liệu mẫu M1 -> M5 (Users, Products, Cart, Orders, Knowledge)
bun run db:seed      # hoặc: npm run db:seed

# Hoặc chạy 1 lệnh duy nhất làm cả 2 bước:
bun run db:setup     # hoặc: npm run db:setup
```

### Bước 5: Kiểm tra kết quả
1. Quay lại Neon Dashboard $\rightarrow$ Chọn tab **SQL Editor**.
2. Chạy thử câu truy vấn kiểm tra đơn hàng và thanh toán:
   ```sql
   SELECT 
       o.order_code,
       o.receiver_name,
       o.total_amount,
       o.total_calories,
       o.total_protein,
       p.method AS payment_method,
       p.status AS payment_status,
       p.transaction_code
   FROM orders o
   LEFT JOIN payments p ON p.order_id = o.id;
   ```
3. Bạn sẽ thấy danh sách đơn hàng mẫu hiển thị đầy đủ, chính xác theo đúng mô hình Class Diagram đã thiết kế.
