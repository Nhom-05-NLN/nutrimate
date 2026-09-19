# Quy Trình Git & Phân Nhánh Dự Án NutriMate (Nhóm 5)

Tài liệu hướng dẫn chuẩn phân nhánh và thao tác Git cho 4 thành viên trong nhóm.

---

## 1. Mô Hình Phân Nhánh (Branching Model)
- **`main`**: Nhánh ổn định tuyệt đối, dùng để báo cáo và nộp bài. Tuyệt đối không commit trực tiếp.
- **`develop`**: Nhánh tích hợp chung. Mọi tính năng sau khi hoàn thành sẽ tạo Pull Request (PR) vào đây.
- **`feat/<tên-chức-năng>`**: Nhánh tính năng ngắn hạn (sống 1-3 ngày), tách từ `develop` và merge lại vào `develop`.

---

## 2. Phân Công 4 Thành Viên Theo Chức Năng Đề Tài
Dựa theo Đề cương Niên luận KTPM, nhóm chia theo 4 phân hệ (Full-stack):

| Thành viên | Phân hệ phụ trách | Tên nhánh đề xuất (`feat/...`) |
|---|---|---|
| **Thành viên 1** | Quản lý Tài khoản & Khách hàng | `feat/auth-login`, `feat/user-profile`, `feat/admin-users` |
| **Thành viên 2** | Sản phẩm, Danh mục & Dinh dưỡng | `feat/product-catalog`, `feat/nutrition-filter`, `feat/admin-products` |
| **Thành viên 3** | Giỏ hàng, Đặt hàng & Quản lý đơn | `feat/cart`, `feat/checkout-payment`, `feat/order-history`, `feat/admin-orders` |
| **Thành viên 4** | Chatbot AI Tư vấn Dinh dưỡng | `feat/chatbot-ui`, `feat/chatbot-gemini-api`, `feat/admin-chatbot-faq` |

---

## 3. Quy Ước Đặt Tên & Commit
- **Tên nhánh:** `feat/<ten-chuc-nang>` (chức năng mới), `fix/<ten-loi>` (sửa lỗi). Viết chữ thường, nối bằng `-`.
- **Commit message (Chuẩn Conventional):**
  - `feat: <mô tả ngắn>` (Ví dụ: `feat: lam xong man hinh gio hang`)
  - `fix: <mô tả ngắn>` (Ví dụ: `fix: loi khong tinh dung calo tong`)
  - `docs: <mô tả ngắn>` (Ví dụ: `docs: cap nhat tai lieu api`)

---

## 4. Các Câu Lệnh Git Hàng Ngày (Cheatsheet)

### Khi bắt đầu làm 1 chức năng mới:
```bash
git checkout develop            # 1. Chuyển sang nhánh develop
git pull origin develop         # 2. Cập nhật code mới nhất từ nhóm về
git checkout -b feat/ten-task   # 3. Tạo và chuyển sang nhánh chức năng mới
```

### Trong quá trình làm & lưu mã nguồn:
```bash
git status                      # Kiểm tra các file thay đổi
git add .                       # Đưa thay đổi vào khu vực chờ commit
git commit -m "feat: mo ta"     # Tạo commit lưu lại
git push -u origin feat/ten-task # Đẩy nhánh lên GitHub
```

### Hoàn thành chức năng & Gộp code (Pull Request):
1. Trước khi tạo PR, đồng bộ code mới nhất của nhóm vào nhánh của mình:
   ```bash
   git pull origin develop      # Nếu có conflict -> mở VS Code sửa rồi commit
   git push origin feat/ten-task
   ```
2. Lên GitHub tạo **Pull Request**: chọn `base: develop` <- `compare: feat/ten-task`.
3. Báo nhóm trưởng / bạn khác kiểm tra và bấm **Merge**.
