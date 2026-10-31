# NutriMate - Nền Tảng TMĐT Thực Phẩm Ăn Kiêng & Chatbot Dinh Dưỡng AI

> **Học phần:** Niên luận Kỹ thuật phần mềm (CT250E) - Nhóm 5  
> **Đề tài:** Xây dựng website bán thực phẩm ăn kiêng tích hợp Chatbot tư vấn dinh dưỡng

---

## 📌 Giới Thiệu
**NutriMate** là nền tảng thương mại điện tử chuyên biệt cung cấp thực phẩm ăn kiêng lành mạnh, tích hợp trợ lý ảo AI (NutriBot) hỗ trợ tư vấn chế độ ăn, phân tích dinh dưỡng và gợi ý sản phẩm theo chỉ số cơ thể của từng cá nhân.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)
- **Frontend (FE):** [Vue.js 3](https://vuejs.org/) (Composition API), Vite, Tailwind CSS, Pinia, Vue Router.
- **Backend (BE):** [Node.js](https://nodejs.org/) & Express (TypeScript / ES Modules).
- **Database (DB):** [PostgreSQL](https://www.postgresql.org/) (Quản lý người dùng, thực phẩm, đơn hàng, log dinh dưỡng).

---

## 🌟 Tính Năng Chính

### 1. Khách Hàng (Customer)
- **Danh mục & Lọc chuyên sâu:** Phân loại theo 3 nhóm ăn kiêng chính: *Low-Carb* (ít tinh bột), *High-Protein* (giàu đạm), *Sugar-Free* (ít/không đường); lọc theo calo, protein, chất béo.
- **Chi tiết dinh dưỡng (Nutrition Facts):** Minh bạch từng thành phần Calo, Protein, Carbs, Fat, Sugar.
- **Giỏ hàng & Đặt hàng:** Thanh toán mô phỏng (COD, VietQR, MoMo), theo dõi trạng thái đơn hàng.
- **Chatbot AI (NutriBot):** Truy vấn trực tiếp CSDL sản phẩm để trả lời câu hỏi và gợi ý thực đơn phù hợp.
- **Tiện ích mở rộng:** Nhập chỉ số chiều cao/cân nặng để tính toán lộ trình calo cá nhân hóa; Quét nhãn dinh dưỡng qua camera; Nhật ký nạp dinh dưỡng và nước uống hàng ngày.

### 2. Quản Trị Viên (Admin)
- **Quản lý sản phẩm & danh mục:** Thêm, sửa, xóa, quản lý tồn kho và cập nhật chỉ số dinh dưỡng.
- **Quản lý đơn hàng:** Theo dõi và chuyển đổi trạng thái (Chờ xác nhận, Đang giao, Đã giao, Đã hủy).
- **Quản lý khách hàng & dữ liệu tri thức AI:** Cập nhật thông tin FAQ/dinh dưỡng để tối ưu phản hồi của bot.

---

## 🏛️ Kiến Trúc Hệ Thống (3-Tier)
```
[ Frontend: Vue.js 3 ] ──(RESTful API / JSON)──> [ Backend: Node.js / Express ] ──(pg Client)──> [ Database: PostgreSQL ]
                                                                │
                                                                └──(API)──> [ AI Engine ]
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Tiên Quyết
- Node.js (>= v18) & npm / bun
- PostgreSQL (>= v14)

### Các Bước Triển Khai
```bash
# 1. Clone mã nguồn
git clone https://github.com/Nhom-05-NLN/nutrimate.git
cd nutrimate

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Cấu hình biến môi trường
cp .env.example .env

# 4. Tạo JWT_SECRET riêng (ít nhất 32 ký tự ngẫu nhiên) trong file .env
#    Ví dụ tạo giá trị bằng Node.js: node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"

# 5. Tạo database PostgreSQL nutrimate_db và chạy server/db/schema.sql

# 6. Khởi chạy dự án ở chế độ phát triển
npm run dev
```

Đăng ký và đăng nhập tạo phiên bằng JWT trong cookie `HttpOnly`; frontend không đọc/lưu token. `/api/auth/me` xác minh phiên hiện tại, còn `/api/auth/logout` xóa cookie phiên. Cookie ghi nhớ có hạn 7 ngày; phiên không ghi nhớ hết hạn sau 12 giờ và cookie bị xóa khi đóng trình duyệt. Các API đọc đơn hàng, cập nhật trạng thái đơn và tạo sản phẩm yêu cầu tài khoản quản trị.

### Cấp Quyền Quản Trị
Quyền quản trị được xác định bằng bản ghi trong bảng `admins`, liên kết với tài khoản ở bảng `users` qua `user_id`. Sau khi chạy schema trong `server/db/schema.sql`, cấp quyền cho tài khoản đã đăng ký bằng email:

```sql
INSERT INTO admins (user_id)
SELECT id FROM users WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

Chỉ tài khoản có bản ghi tương ứng trong `admins` mới được mở trang quản trị. Cột `users.role` không được dùng để cấp quyền này.

---

## 👥 Quản Lý Dự Án & Mã Nguồn
- Quản lý mã nguồn theo Git Flow trên GitHub: [NutriMate Repo](https://github.com/Nhom-05-NLN/nutrimate.git).
- Phân chia công việc theo từng nhánh tính năng (`feature/*`).
