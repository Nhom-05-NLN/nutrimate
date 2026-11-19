# Mã danh mục CAT-xxx

- Thêm `categories.code`, bắt buộc và duy nhất, dùng dạng `CAT-001` đến `CAT-999`.
- Đồng bộ danh mục cũ theo thứ tự `category_id`. Không đổi ID hoặc liên kết sản phẩm.
- `category_code_allocations` giữ mã khi mở form và lưu lịch sử mã đã dùng.
- Hủy form giải phóng mã tạm. Khi lưu, mã giữ chỗ được xác minh và chuyển thành mã đã dùng trong cùng transaction với danh mục.
- Xóa danh mục không xóa lịch sử cấp mã, do đó không tái sử dụng mã đã lưu.
- Giữ chỗ chưa sử dụng tự hết hiệu lực sau 24 giờ nếu trình duyệt không giải phóng được mã.
- Chạy lại migration không đánh số lại khi toàn bộ mã đã đúng định dạng.
