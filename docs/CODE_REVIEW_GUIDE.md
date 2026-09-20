# Quy Trình Kiểm Thử Tích Hợp & Review Code (NutriMate)

Tài liệu chuẩn hóa quy trình kiểm thử trước khi merge và tiêu chuẩn review code cho nhóm.

---

## 1. Nguyên Tắc Vàng Khi "Merge Thử"
> **TUYỆT ĐỐI KHÔNG** merge thẳng vào `develop` để test! Nếu code lỗi, cả nhóm sẽ bị gián đoạn.  
> **Nguyên tắc đúng:** Kéo code mới nhất của `develop` về nhánh của mình để test trước.

### 2 Cách kiểm tra tích hợp an toàn 100%:
* **Cách 1 (Nhanh nhất - Thường dùng trong công ty):**
  Đang ở nhánh tính năng của mình (`feat/task-A`), kéo `develop` về gộp:
  ```bash
  git pull origin develop
  ```
  Nếu có xung đột (conflict), VS Code sẽ hiện rõ phần code trùng. Ta chọn giữ code đúng, lưu lại rồi test chạy thử (`npm run dev` & `npm run build`).

* **Cách 2 (An toàn tuyệt đối bằng nhánh nháp):**
  Tạo một nhánh thử nghiệm tạm thời từ nhánh của bạn:
  ```bash
  git checkout -b feat/task-A-preview     # Tạo nhánh thử nghiệm
  git pull origin develop                 # Gộp develop vào nhánh thử nghiệm này
  # Chạy test, kiểm tra tính năng thoải mái. Test xong thì xóa nhánh nháp:
  git checkout feat/task-A
  git branch -D feat/task-A-preview
  ```

---

## 2. Cách Xử Lý Khi Bị Trùng Code (Conflict)
1. Khi có conflict, mở VS Code, file bị trùng sẽ chuyển sang màu đỏ.
2. VS Code có 4 nút bấm tiện lợi ngay trên đoạn code bị trùng:
   - **Accept Current Change:** Giữ lại code của bạn.
   - **Accept Incoming Change:** Lấy code mới từ `develop`.
   - **Accept Both Changes:** Giữ cả hai đoạn code.
3. Sau khi chọn xong, chạy thử nghiệm hệ thống:
   ```bash
   npm run build                          # Kiểm tra xem có lỗi cú pháp/type không
   npm run dev                            # Mở kiểm tra tính năng có hoạt động chuẩn không
   ```
4. Khi đã chạy ổn định:
   ```bash
   git add .
   git commit -m "fix: resolve merge conflicts with develop"
   git push origin feat/task-A
   ```

---

## 3. Quy Trình Review Code Chuẩn (Pull Request)

### A. Đối với người tạo PR (Tác giả code):
- [ ] Tự chạy `npm run build` không phát sinh bất kỳ lỗi nào.
- [ ] Xóa toàn bộ `console.log` thừa, file rác và code thừa (comment out).
- [ ] Điền tiêu đề và mô tả PR rõ ràng: *Đã làm chức năng gì? Cần chú ý gì khi test?*
- [ ] Gửi link PR vào nhóm Zalo/Discord để nhờ thành viên khác review.

### B. Đối với người Review (Bạn cùng nhóm):
- [ ] Đọc lướt qua tab **Files changed** trên GitHub xem code có dễ hiểu, sạch sẽ không.
- [ ] Nếu phát hiện sai sót, để lại comment góp ý ngay tại dòng code đó.
- [ ] Nếu đạt yêu cầu: Bấm **Review changes** -> Chọn **Approve**.
- [ ] Bấm nút **Squash and merge** để gộp vào `develop` và xóa branch tính năng.
