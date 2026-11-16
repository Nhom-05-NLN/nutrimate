# Thư viện ảnh sản phẩm

`product_images` lưu các ảnh thật của mỗi sản phẩm:

- `image_id`: khóa chính.
- `product_id`: khóa ngoại đến `products`, tự xóa các dòng ảnh khi sản phẩm bị xóa.
- `image_url`: đường dẫn ảnh.
- `sort_order`: thứ tự hiển thị, bắt đầu từ 0.

Migration giữ lại ảnh chính hiện tại bằng cách đưa vào vị trí đầu tiên. Không thêm ảnh mẫu.

Admin tải tối đa 20 ảnh mỗi sản phẩm qua Cloudinary, đổi thứ tự bằng mũi tên và xóa ảnh khỏi danh sách. Bấm Lưu để áp dụng vào CSDL. Ảnh đầu tiên được đồng bộ với `products.image_url` để các thẻ sản phẩm và giỏ hàng tiếp tục dùng ảnh chính. Thay đổi sản phẩm và danh sách ảnh được lưu cùng transaction.

Xóa ảnh trong form gỡ đường dẫn khỏi sản phẩm khi lưu; không xóa tệp vật lý khỏi Cloudinary. Các thao tác đổi thứ tự và xóa đường dẫn không ảnh hưởng ảnh trong lịch sử đơn hàng.
