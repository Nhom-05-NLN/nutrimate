# Kế Hoạch Phân Nhánh & Phát Triển Tính Năng (M1 – M5)
**Dự án:** NutriMate – Nền tảng TMĐT thực phẩm ăn kiêng & Chatbot Dinh dưỡng AI  
**Môn học:** Niên luận Kỹ thuật Phần mềm (CT250E)  
**Tài liệu tham chiếu:** `docs/GIT_WORKFLOW.md`, `docs/CODE_REVIEW_GUIDE.md`, `AGENTS.md`

---

## 1. NGUYÊN TẮC PHÂN NHÁNH CHUNG (GIT RULES)

- **Nhánh gốc:** Tất cả các nhánh tính năng (`feat/*`) bắt buộc phải tách ra từ nhánh **`develop`** và tạo Pull Request (PR) gộp lại vào **`develop`**.
- **Không commit lên `main`:** Nhánh `main` chỉ dùng nộp bài và báo cáo nghiệm thu.
- **Quy ước đặt tên nhánh:** `feat/<ten-chuc-nang>` (chữ thường, nối bằng dấu gạch ngang `-`).
- **Quy tắc kiểm tra trước khi tạo PR:**
  ```bash
  bun run verify   # Chạy typecheck, lint và build dự án
  ```
- **Commit chuẩn Conventional:** `feat: <nội dung>`, `fix: <nội dung>`, `docs: <nội dung>`.

---

## 2. DANH MỤC PHÂN HỆ, CHỨC NĂNG & CÁC NHÁNH CẦN TẠO

```text
develop
 ├── [M1] feat/auth-login-register  ──> feat/user-profile-metrics  ──> feat/admin-customers
 ├── [M2] feat/product-catalog      ──> feat/nutrition-filter      ──> feat/admin-products
 ├── [M3] feat/cart-management      ──> feat/checkout-payment      ──> feat/user-orders  ──> feat/admin-orders
 ├── [M4] feat/chatbot-ui-widget    ──> feat/chatbot-ai-knowledge  ──> feat/admin-knowledge-base
 └── [M5] feat/nutrition-dashboard  ──> feat/admin-dashboard-kpis  ──> feat/system-integration
```

---

### 🟢 PHÂN HỆ M1: TÀI KHOẢN, XÁC THỰC & HỒ SƠ THỂ TRẠNG
> **Phụ trách:** Thành viên 1 | **Phạm vi:** Khách hàng & Quản trị viên

| STT | Chức năng chi tiết (Use Case) | Tên nhánh đề xuất (`feat/...`) | Phạm vi mã nguồn chính |
|---|---|---|---|
| **01** | **Đăng ký tài khoản (Register)**<br>- Nhập email, mật khẩu, họ tên, SĐT<br>- Kiểm tra tính hợp lệ & trùng lặp email | `feat/auth-register` | `src/views/RegisterView.vue`<br>`src/stores/authStore.ts`<br>`server/controllers/authController.ts` |
| **02** | **Đăng nhập & Đăng xuất (Login / Logout)**<br>- Xác thực tài khoản khách hàng & quản trị viên<br>- Lưu phiên làm việc & phân quyền (Role) | `feat/auth-login` | `src/views/LoginView.vue`<br>`src/components/auth/AuthModal.vue` |
| **03** | **Quản lý thông tin cá nhân (Profile)**<br>- Cập nhật thông tin liên hệ, avatar, địa chỉ | `feat/user-profile` | `src/views/ProfileView.vue` |
| **04** | **Tính toán & Theo dõi chỉ số thể trạng**<br>- Nhập chiều cao, cân nặng, độ tuổi, giới tính<br>- Tự động tính chỉ số BMI, BMR, TDEE và Calo mục tiêu | `feat/user-body-metrics` | `src/views/ProfileView.vue`<br>`src/types/index.ts` (`UserProfile`) |
| **05** | **Quản lý khách hàng phía Admin (Customer Mgmt)**<br>- Danh sách người dùng, tìm kiếm, lọc theo hạng hội viên<br>- Xem lịch sử mua sắm và thể trạng khách | `feat/admin-customers` | `src/views/admin/AdminCustomersView.vue` |

---

### 🟢 PHÂN HỆ M2: SẢN PHẨM, DANH MỤC & DINH DƯỠNG ĂN KIÊNG
> **Phụ trách:** Thành viên 2 | **Phạm vi:** Danh mục món ăn, bộ lọc chuyên biệt & quản lý kho

| STT | Chức năng chi tiết (Use Case) | Tên nhánh đề xuất (`feat/...`) | Phạm vi mã nguồn chính |
|---|---|---|---|
| **06** | **Xem danh mục món ăn kiêng (Categories)**<br>- Danh mục: Low-Carb, High-Protein, Sugar-Free, Hạt | `feat/product-categories` | `src/components/home/DietCategories.vue`<br>`server/repositories/categoryRepository.ts` |
| **07** | **Danh sách sản phẩm & Phân trang (Catalog)**<br>- Hiển thị thẻ món ăn, giá bán, ảnh, tag chế độ ăn | `feat/product-catalog` | `src/views/CatalogView.vue`<br>`src/components/catalog/ProductCard.vue` |
| **08** | **Bộ lọc dinh dưỡng chuyên sâu (Nutrition Filters)**<br>- Lọc theo Calo tối đa, Đạm tối thiểu, Không đường<br>- Tìm kiếm theo tên món và nguyên liệu | `feat/nutrition-filter-search` | `src/views/CatalogView.vue`<br>`src/stores/productStore.ts` |
| **09** | **Xem chi tiết sản phẩm (Product Detail & Macros)**<br>- Bảng thành phần dinh dưỡng chi tiết (Nutrition Facts)<br>- Chọn phân loại quy cách/trọng lượng (Portion) | `feat/product-detail-modal` | `src/views/ProductDetailView.vue`<br>`src/components/catalog/ProductDetailModal.vue` |
| **10** | **Quản lý sản phẩm phía Admin (Product Mgmt)**<br>- Thêm, sửa, xóa món ăn, cập nhật tồn kho & chỉ số macros | `feat/admin-products` | `src/views/admin/AdminProductsView.vue`<br>`server/controllers/productController.ts` |

---

### 🟢 PHÂN HỆ M3: GIỎ HÀNG, ĐẶT HÀNG & THANH TOÁN (M3 – CART, ORDER & PAYMENT)
> **Phụ trách:** Thành viên 3 | **Phạm vi:** Từ **CN_17** đến **CN_24**

| Mã Use Case | Tên Chức Năng | Tên nhánh đề xuất (`feat/...`) | Phạm vi mã nguồn chính |
|---|---|---|---|
| **CN_17** | **Thêm vào giỏ hàng (Add to Cart)**<br>- Quick-add từ catalog hoặc chọn portion từ chi tiết<br>- Cộng dồn Kcal/Đạm động vào giỏ hàng | `feat/cart-management` | `src/stores/cartStore.ts`<br>`src/components/catalog/ProductCard.vue` |
| **CN_18** | **Quản lý giỏ hàng (Cart Management)**<br>- Drawer trượt & trang giỏ hàng riêng<br>- Tăng/giảm số lượng, xóa món, chọn món để checkout<br>- Tự động lưu giỏ hàng vào LocalStorage | `feat/cart-management` | `src/views/CartView.vue`<br>`src/components/cart/CartDrawer.vue`<br>`src/components/cart/CartItemRow.vue` |
| **CN_19** | **Checkout & Nhập thông tin nhận hàng**<br>- Form họ tên, SĐT, địa chỉ nhận hàng<br>- Chọn hình thức giao: Tiêu chuẩn vs Siêu tốc 2H (giữ lạnh) | `feat/checkout-order-payment` | `src/views/CheckoutView.vue`<br>`src/components/checkout/ShippingAddressForm.vue` |
| **CN_20** | **Đặt hàng (Place Order)**<br>- Xác nhận giỏ hàng, áp mã giảm giá (Voucher)<br>- Gọi API tạo đơn, sinh mã `#NM-xxxxxx`, dọn giỏ hàng | `feat/checkout-order-payment` | `src/services/api.ts` (`postOrder`)<br>`server/controllers/orderController.ts` |
| **CN_21** | **Thanh toán mô phỏng (Payment Simulation)**<br>- Quét mã VietQR Napas động (đúng số tiền & nội dung CK)<br>- Nút xác nhận thanh toán chuyển trạng thái `paid`<br>- Hỗ trợ COD và ví MoMo | `feat/checkout-order-payment` | `src/components/checkout/VietQrModal.vue`<br>`server/routes/orderRoutes.ts` |
| **CN_22** | **Xem đơn hàng (Order History & Detail)**<br>- Danh sách đơn của tôi, tab lọc (Tất cả, Đang giao, Đã nhận)<br>- Tìm kiếm theo mã đơn, nút "Mua lại" (Re-order) | `feat/user-order-tracking` | `src/views/OrdersView.vue`<br>`src/components/orders/OrderCard.vue` |
| **CN_23** | **Theo dõi trạng thái đơn hàng (Tracking)**<br>- Stepper 4 bước tiến trình giao hàng<br>- Thông tin tài xế & nhiệt độ thùng bảo quản 4°C<br>- Tích hợp nút hỏi NutriBot tra cứu đơn | `feat/user-order-tracking` | `src/components/orders/OrderTrackingTimeline.vue`<br>`src/components/orders/OrderDetailModal.vue` |
| **CN_24** | **Quản lý đơn hàng phía Admin (Admin Orders)**<br>- 4 Card KPIs thời gian thực (Cảnh báo đơn 2H cần giao gấp)<br>- Bảng danh sách đơn, lọc theo trạng thái<br>- Cập nhật trạng thái đơn (Duyệt, Đóng gói, Đang giao, Hủy) | `feat/admin-orders` | `src/views/admin/AdminOrdersView.vue`<br>`src/components/admin/orders/AdminOrderTable.vue`<br>`server/controllers/orderController.ts` |

---

### 🟢 PHÂN HỆ M4: TRỢ LÝ CHATBOT AI TƯ VẤN DINH DƯỠNG (NUTRIBOT AI)
> **Phụ trách:** Thành viên 4 | **Phạm vi:** Trợ lý ảo AI & Cơ sở tri thức dinh dưỡng

| STT | Chức năng chi tiết (Use Case) | Tên nhánh đề xuất (`feat/...`) | Phạm vi mã nguồn chính |
|---|---|---|---|
| **25** | **Giao diện Chatbot NutriBot (Chat Widget)**<br>- Bong bóng chat góc màn hình, mở hộp thoại tin nhắn<br>- Câu hỏi gợi ý nhanh (Prompt chips: Calo, Keto, Gym) | `feat/chatbot-ui` | `src/components/chatbot/NutriBotWidget.vue`<br>`src/stores/chatStore.ts` |
| **26** | **Tư vấn dinh dưỡng thông minh qua AI**<br>- Phân tích câu hỏi của khách hàng, giải thích chế độ ăn<br>- Gợi ý trực tiếp các sản phẩm phù hợp vào bong bóng chat | `feat/chatbot-ai-service` | `server/services/chatService.ts`<br>`server/controllers/chatController.ts` |
| **27** | **Tra cứu thực đơn & Hỗ trợ đơn hàng qua Chatbot**<br>- Tra cứu nhanh calo của món ăn, kiểm tra tiến độ đơn hàng | `feat/chatbot-ai-service` | `src/services/api.ts` (`postChatMessage`) |
| **28** | **Quản lý cơ sở tri thức Chatbot (Admin Knowledge)**<br>- Quản lý tài liệu/FAQ dinh dưỡng, từ khóa intent và câu trả lời mẫu | `feat/admin-chatbot-faq` | `src/views/admin/AdminKnowledgeBaseView.vue`<br>`server/db/schema.sql` (`chatbot_knowledge`) |

---

### 🟢 PHÂN HỆ M5: BẢNG ĐIỀU KHIỂN DINH DƯỠNG & THỐNG KÊ TOÀN DIỆN
> **Phụ trách:** Trưởng nhóm / Hợp tác nhóm | **Phạm vi:** Dashboards & Tích hợp hoàn thiện

| STT | Chức năng chi tiết (Use Case) | Tên nhánh đề xuất (`feat/...`) | Phạm vi mã nguồn chính |
|---|---|---|---|
| **29** | **Bảng điều khiển Dinh dưỡng cá nhân (User Dashboard)**<br>- Biểu đồ theo dõi Calo nạp vào vs Calo mục tiêu<br>- Tỷ lệ phân bổ Macros (Đạm / Đường / Béo), theo dõi nước uống (8 ly) | `feat/user-nutrition-dashboard` | `src/views/NutritionDashboardView.vue` |
| **30** | **Nhật ký ăn uống hàng ngày (Daily Food Log)**<br>- Ghi chép bữa sáng, trưa, tối, xế; tự động cộng dồn dinh dưỡng | `feat/user-nutrition-dashboard` | `server/db/schema.sql` (`nutrition_logs`) |
| **31** | **Bảng điều khiển tổng quan Quản trị (Admin Dashboard)**<br>- Biểu đồ doanh thu tháng, tăng trưởng đơn hàng, cảnh báo tồn kho | `feat/admin-dashboard-kpi` | `src/views/admin/AdminDashboardView.vue` |
| **32** | **Kiểm thử tích hợp & Tối ưu hiệu năng toàn hệ thống**<br>- Kiểm thử luồng E2E xuyên suốt M1 -> M5, responsive chuẩn mobile | `feat/system-integration-audit` | Toàn bộ dự án (`bun run verify`) |

---

## 3. QUY TRÌNH PHỐI HỢP PHÁT TRIỂN HÀNG NGÀY (CHEATSHEET)

Mỗi thành viên khi bắt đầu làm một tính năng hãy thực hiện theo đúng 4 bước sau:

### Bước 1: Lấy code mới nhất & tạo nhánh tính năng
```bash
git checkout develop            # Chuyển về develop
git pull origin develop         # Kéo code mới nhất từ nhóm về
git checkout -b feat/<ten-nhanh> # Tạo nhánh theo đúng bảng danh mục trên
```

### Bước 2: Viết mã nguồn & Commit
- Code theo đúng quy tắc module hóa, chia nhỏ component, không dùng `any`.
- Lưu tiến độ bằng các commit ngắn, rõ nghĩa:
  ```bash
  git add .
  git commit -m "feat(cart): tach cart item row thanh component rieng"
  ```

### Bước 3: Đồng bộ & Kiểm tra trước khi tạo PR
```bash
git pull origin develop         # Đồng bộ code mới nhất (xử lý conflict nếu có)
bun run verify (npm run verify)                 # BẮT BUỘC: Kiểm tra typecheck + build không lỗi
git push -u origin feat/<ten-nhanh> # Đẩy nhánh lên GitHub
```

### Bước 4: Tạo Pull Request (PR) & Review
1. Vào GitHub tạo PR: `base: develop` $\leftarrow$ `compare: feat/<ten-nhanh>`.
2. Gửi link PR cho thành viên trong nhóm review code.
3. Người review kiểm tra theo `docs/CODE_REVIEW_GUIDE.md`, nếu đạt thì bấm **Approve** và **Squash and merge**.
4. Xóa nhánh tính năng trên GitHub sau khi đã merge thành công.
