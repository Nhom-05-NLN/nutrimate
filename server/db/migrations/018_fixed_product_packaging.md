# Quy cách bán cố định

Đã thay mô hình biến thể bằng quy cách cố định trên từng sản phẩm:

- `products.unit`: đơn vị bán, tối đa 50 ký tự, ví dụ `hũ`, `túi`, `chai`.
- `products.package_size`: quy cách đóng gói, tối đa 100 ký tự, ví dụ `250 g`, `330 ml`, `6 thanh`.
- Hai trường để trống mặc định; không tự suy đoán từ tên hoặc biến thể cũ.
- Giá và số lượng tồn kho tiếp tục lấy từ `products.price` và `products.stock_quantity`.
- Xóa bảng `product_variants` và các cột biến thể trong giỏ hàng, tồn kho, chi tiết đơn hàng. Giữ lại các dòng dữ liệu của những bảng này.

Migration SQL thực hiện trong transaction và có thể chạy lại. Nếu còn khóa ngoại ngoài các bảng đã xử lý, lệnh xóa bảng sẽ thất bại để tránh xóa liên đới ngoài phạm vi.

Không thay đổi số liệu hoặc cơ sở tính của `nutrition_facts` trong migration này. Việc đổi số liệu dinh dưỡng từ mỗi 100 g sang cả bao bì cần dữ liệu nhãn chính xác và được xử lý riêng.
