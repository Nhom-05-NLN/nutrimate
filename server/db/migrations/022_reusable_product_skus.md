# SKU bốn chữ số và giữ mã tạm

SKU có dạng `NM-PRD-0001` đến `NM-PRD-9999`. Backend chọn mã nhỏ nhất chưa có trong sản phẩm hoặc danh sách giữ chỗ.

`product_sku_reservations` giữ mã cho mỗi form đang mở. Khi hủy form, mã được giải phóng. Khi lưu thành công, mã trở thành SKU của sản phẩm và giữ chỗ được xóa trong cùng transaction. Nếu trình duyệt mất kết nối, giữ chỗ tự hết hiệu lực sau 24 giờ.

Migration đồng bộ các mã cũ theo thứ tự `product_id`, giữ nguyên ID, giá, tồn kho, hình ảnh và các dữ liệu khác. Chạy lại khi mọi mã đã đúng định dạng sẽ không đánh số lại. Giới hạn của định dạng là 9.999 mã.
