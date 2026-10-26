# CN_25 — Chat với NutriBot

## Phạm vi

Mở rộng widget, Pinia store và `/api/chat/ask` hiện có; dùng Express và pool PostgreSQL chung. Guest được chat theo yêu cầu cập nhật của người dùng, khác tiền điều kiện Customer đăng nhập trong Use Case 1.2.2.25. Không triển khai đăng nhập mới: Customer dùng JWT do module tài khoản của nhóm cấp.

## Cấu hình và migration

Cấu hình riêng trong `.env`, không commit file hoặc khóa:

```dotenv
LLM_API_KEY=<khoa-cua-nha-cung-cap>
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-2.5-flash
JWT_SECRET=<bi-mat-HS256-dung-chung-voi-module-dang-nhap-it-nhat-32-ky-tu>
```

`OPENAI_API_KEY` là tên dự phòng cho `LLM_API_KEY`. URL phải dùng HTTPS, không chứa username/password, query hay fragment. Backend gọi `${LLM_BASE_URL}/chat/completions`; model phải hỗ trợ giao thức Chat Completions, system messages và `max_tokens`. Không hardcode model hay đưa biến bí mật vào `VITE_*`.

Adapter tham chiếu [OpenAI Docs — Create chat completion](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create); mức tương thích của từng nhà cung cấp cần kiểm thử bằng model được cấu hình.

Cấu hình được chọn cho dự án là `gemini-2.5-flash` qua [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai). `LLM_API_KEY` phải là khóa Gemini hợp lệ; khóa của nhà cung cấp khác không dùng được cho endpoint này.

Áp dụng migration trên **database NutriMate hiện có** bằng công cụ PostgreSQL. Nếu database chưa có bảng chat cũ, chạy `server/db/migrations/001_chat.sql`. Nếu đã có `chat_sessions` và `chat_messages` dạng cũ (`session_id`, `question`, `response`), chạy migration tương thích `server/db/migrations/003_chat_conversation_schema_compat.sql` thay vì `001_chat.sql`:

```bash
psql -v ON_ERROR_STOP=1 -f server/db/migrations/003_chat_conversation_schema_compat.sql
```

Migration tương thích chạy trong transaction, giữ nguyên `chat_sessions` và đổi tên bảng tin nhắn cũ thành `chat_messages_legacy`, sau đó tạo các bảng/index cần cho API hiện tại. Nội dung legacy được giữ nguyên để tra cứu/đối chiếu; không tự gán hội thoại cũ cho Guest hoặc Customer vì không có liên kết danh tính an toàn tới chủ phiên chat mới. Migration không tự chạy trong bootstrap hoặc tạo database thứ hai. Nếu tồn tại đồng thời bảng archive hoặc schema khác không nhận diện được, migration dừng và rollback để tránh ghi đè dữ liệu.

## Danh tính và quyền truy cập

- Customer gửi `Authorization: Bearer <JWT>`. Adapter hiện nhận HS256, `sub` là chuỗi ID số của `users.id`, có `exp`, kiểm tra `nbf` nếu có. Server kiểm tra chữ ký bằng `JWT_SECRET`, rồi đọc vai trò hiện tại trong `users` và chỉ chấp nhận `customer`. Không tin `userId`, `role` hoặc history gửi từ client. Hợp đồng JWT khác cần phối hợp với module tài khoản trước khi kết nối.
- Frontend có điểm tích hợp `authStore.login(profile, accessToken)`; JWT giữ trong bộ nhớ, không lưu vào localStorage. Đăng nhập mẫu không có token vẫn là Guest đối với API chat, không được giả làm Customer.
- Guest gọi `POST /api/chat/session` trước để nhận hoặc khôi phục cookie `nutrimate_guest`: ngẫu nhiên 256 bit, HttpOnly, SameSite=Strict, thời hạn 7 ngày, path `/api/chat`; Secure ở production. Sau đó mới lấy danh sách hội thoại và lịch sử. Database chỉ lưu SHA-256 của token, không trả token trong JSON. Mất cookie thì không thể khôi phục lịch sử Guest bằng ID hội thoại đơn thuần.
- Đọc lịch sử, danh sách hoặc gửi khi không có JWT/cookie hợp lệ trả 401. JWT sai/hết hạn không được tự hạ thành Guest. Sai vai trò trả 403. Hội thoại không thuộc danh tính hiện tại trả 404, kể cả khi ID tồn tại, để tránh tiết lộ sự tồn tại.
- Không tự chuyển hội thoại Guest vào tài khoản khi đăng nhập; hai không gian tách riêng. UI xóa lịch sử trong bộ nhớ và bỏ qua phản hồi cũ khi JWT thay đổi.
- JWT lỗi/hết hạn: widget giữ hội thoại hiện tại, khóa gửi/thao tác lịch sử và hiện liên kết “Đăng nhập lại”; không xóa JWT hay tự chuyển sang Guest. Khi module đăng nhập cung cấp token mới, widget tải lại lịch sử theo token đó. Trang đăng nhập hiện có vẫn là phần mô phỏng của module tài khoản; kiểm thử CN_25 xác minh điểm tích hợp `authStore.login(profile, token)` với JWT được server kiểm tra, không thay thế kiểm thử đăng nhập bằng mật khẩu của module tài khoản.
- Guest mất cookie giữa phiên: giữ ngữ cảnh đang hiển thị và thông báo hết phiên; chỉ xóa trạng thái cũ/tạo phiên mới sau khi người dùng chọn “Bắt đầu phiên Guest mới”. Không tự gửi lại câu hỏi vào danh tính mới.
- API trả `Cache-Control: no-store`, từ chối yêu cầu cross-site và Origin không trùng host. Khi triển khai sau reverse proxy HTTPS cần cấu hình proxy/host của Express phù hợp để Origin chính xác.
- Vite dùng URL `/api` cùng origin và giữ `Host` của trình duyệt (`changeOrigin: false`) khi proxy tới Express 3000. Không gọi URL backend khác host trực tiếp từ frontend; cookie HttpOnly không được đọc/chép vào JavaScript. Khi sửa routes backend phải khởi động lại Express, HMR frontend không nạp lại routes server.

## API

Mọi phản hồi dùng `{ "success": true, "data": ... }` hoặc `{ "success": false, "message": "..." }`. API dùng cookie cùng origin; Customer bổ sung Bearer JWT. UUID ví dụ bên dưới chỉ là giá trị minh họa.

### Tạo hội thoại

Trước bước này, gọi `POST /api/chat/session` với body `{}`. Customer gửi Bearer JWT; Guest gửi cookie hiện có nếu có, trình duyệt tự nhận cookie mới khi cần. Response 200:

```json
{ "success": true, "data": { "kind": "guest", "created": true } }
```

`created: false` nghĩa là phiên hiện tại được khôi phục; `kind: "customer"` khi JWT hợp lệ. Endpoint này không tạo hội thoại hoặc trả token/ID người dùng. JWT sai/hết hạn trả 401 ngay cả khi request có cookie Guest. Sau response thành công mới gọi `GET /api/chat/conversations`; nếu danh sách rỗng thì tạo hội thoại, nếu có thì tải lịch sử của hội thoại đã chọn. Gọi GET trực tiếp bằng curl/trình duyệt mới không có cookie/JWT vẫn phải trả 401; đây là bảo vệ đúng thiết kế, không phải lỗi cần bỏ middleware.

`POST /api/chat/conversations`, body `{}`. Guest mới nhận Set-Cookie. Response 201:

```json
{
  "success": true,
  "data": {
    "id": "b434796c-1c84-4bcd-8cca-4f52c2409be2",
    "createdAt": "2026-10-19T10:00:00.000Z",
    "updatedAt": "2026-10-19T10:00:00.000Z"
  }
}
```

### Danh sách hội thoại của mình

`GET /api/chat/conversations` trả `data: Conversation[]`, tối đa 50 hội thoại gần nhất theo `updatedAt`. Customer và Guest chỉ thấy hội thoại thuộc danh tính tương ứng.

### Đọc lịch sử

`GET /api/chat/conversations/:id/messages?before=<message-id>` trả:

```json
{
  "success": true,
  "data": {
    "conversationId": "b434796c-1c84-4bcd-8cca-4f52c2409be2",
    "messages": [
      {
        "id": "1",
        "role": "user",
        "content": "Tôi muốn ăn uống hợp lý",
        "requestId": "57c3c0e4-8c1e-4530-a331-d7a4f629c1d0",
        "suggestedProducts": [],
        "createdAt": "2026-10-19T10:00:01.000Z"
      }
    ]
  }
}
```

Mỗi trang tối đa 50 tin, sắp thứ tự tăng dần. Không có `before` thì lấy trang mới nhất; tải trang cũ bằng ID đầu tiên của trang đang xem. ID tin nhắn là chuỗi số để tránh mất độ chính xác BIGINT.

### Gửi và gửi lại

`POST /api/chat/conversations/:id/messages`:

```json
{
  "requestId": "57c3c0e4-8c1e-4530-a331-d7a4f629c1d0",
  "message": "Tôi muốn ăn uống hợp lý"
}
```

Route cũ `POST /api/chat/ask` được giữ lại, dùng cùng body với thêm `conversationId`. Đây là hợp đồng mới cần phiên và request ID, không còn nhận câu hỏi vô danh đơn lẻ.

Response 200 chứa `conversationId`, `reply`, `suggestedProducts` và `messages` (hai tin User/Assistant vừa được lưu, cùng định dạng lịch sử). Widget giữ giao diện cũ, quick prompts, thẻ sản phẩm, xem chi tiết và thêm giỏ hàng; thêm chọn hội thoại, chat mới, tải tin cũ và nút gửi lại khi thất bại.

- Câu hỏi phải là chuỗi có nội dung sau trim, tối đa 4000 ký tự. Sai dữ liệu/UUID trả 400.
- Client tạo UUID `requestId` cho mỗi lần gửi mới. Gửi lại dùng đúng UUID và nội dung cũ. Nếu lượt trước đã commit, server trả lại hai tin đã lưu mà không gọi AI/lưu trùng. Dùng lại UUID với nội dung khác trả 409.
- Mỗi hội thoại khóa dòng `FOR UPDATE NOWAIT` khi xử lý; gửi đồng thời cùng hội thoại trả 409. Lịch sử và hai tin được lưu nguyên tử trong transaction; lỗi AI không ghi lượt dang dở. Tin đang chờ hoặc thất bại nằm ở UI, chưa phải lịch sử bền vững cho đến khi gửi thành công.
- Lịch sử ngữ cảnh được đọc từ PostgreSQL, chỉ lấy các cặp User/Assistant gần nhất: tối đa 20 tin và 16000 ký tự (kể cả câu hỏi mới). System prompt/dữ liệu tham chiếu được giới hạn riêng; tối đa 1000 output tokens. Đây là giới hạn ký tự, không phải tokenizer riêng của từng model.
- Timeout AI 30 giây trả 504; lỗi nhà cung cấp/phản hồi rỗng trả 502; thiếu cấu hình AI hoặc lỗi PostgreSQL trả 503. Không chuyển lỗi thành trả lời sản phẩm mẫu. Chi tiết lỗi nội bộ/API key không được gửi ra client.
- Giữ truy xuất FAQ/sản phẩm theo từ khóa đang có, qua chế độ PostgreSQL bắt buộc; tối đa ba sản phẩm thực. Không mở rộng CN_26–CN_28 thành bộ truy vấn AI hay dùng SQL do model sinh.
- Mọi phản hồi AI được ứng dụng bổ sung câu cảnh báo chỉ mang tính tham khảo. Nội dung được Vue render như text, không dùng `v-html`.

## Kiểm thử

```bash
npm run test:chat
npm run typecheck
npm run build
npm run lint
```

`test:chat` kiểm thử HTTP/controller/service/identity với repository giả lập transaction, provider giả lập và Pinia store. Bao gồm thành công nhiều lượt, câu hỏi trống/sai, timeout, retry/idempotency, Guest mới, chưa có phiên, JWT sai/hết hạn, sai vai trò, khác chủ sở hữu, lỗi DB, giới hạn ngữ cảnh và thay danh tính khi có request đang chạy. Không coi test double là bằng chứng đã kết nối PostgreSQL/LLM thật.

Kiểm tra engine PostgreSQL thật bằng cấu hình PG của `.env` (PowerShell):

```powershell
$env:CHAT_TEST_POSTGRES='1'
npm.cmd run test:chat:postgres
```

Bộ này tạo schema riêng trong một transaction để chạy DDL migration, kiểm tra đọc/ghi, rollback, idempotency, quyền sở hữu và phân trang; rollback toàn bộ schema/dữ liệu test khi kết thúc. Cách này cũng cô lập được khi dùng connection pooler. Không sửa bảng/dữ liệu ứng dụng. Không đặt biến `CHAT_TEST_POSTGRES` thì test được skip rõ ràng.

Kiểm tra cả LLM thật và PostgreSQL thật (hai lượt hỏi không chứa dữ liệu cá nhân, có thể tiêu tốn quota): đặt `CHAT_TEST_LIVE=1` rồi chạy `npm run test:chat:live`. Bộ này dùng schema test rollback như trên, đọc sản phẩm/tri thức hiện có qua luồng service thật và không để lại hội thoại thử trong dữ liệu ứng dụng.

Sau khi migration và cấu hình thật sẵn sàng, chạy `npm run dev`; kiểm tra Guest hỏi hai lượt, tải lại trang để phục hồi lịch sử, tạo chat mới/chuyển chat, giả lập lỗi mạng và gửi lại; kiểm tra Customer bằng JWT của module tài khoản và hai tài khoản khác nhau. Xác nhận secrets không nằm trong Network response/bundle frontend. Chỉ commit/push khi các kiểm tra bắt buộc và kiểm thử thực tế đạt.

Kiểm thử widget bằng Edge headless và backend đang chạy thật: đặt `CHAT_TEST_BROWSER=1`, tùy chọn `CHAT_BROWSER_URL=http://127.0.0.1:3000` hoặc `http://127.0.0.1:5173`, rồi chạy `npm run test:chat:browser`. Cần migration trong database ứng dụng. Bộ này dùng cookie trình duyệt thật, gọi LLM thật, khôi phục sau reload, đăng nhập qua điểm tích hợp JWT với tài khoản test mới, kiểm tra hết hạn/khác chủ sở hữu rồi chỉ dọn các bản ghi do chính test tạo. Có thể đặt `CHAT_BROWSER_PATH` nếu Edge ở đường dẫn khác.

Nguyên nhân lỗi mở widget đã sửa: luồng cũ gọi GET trước rồi bắt 401 để tạo Guest; proxy Vite đổi Host làm kiểm tra Origin không khớp; UI chưa có trạng thái xử lý phiên hết hạn. Ngoài ra, thiếu migration gây 503 khi tạo hội thoại, không phải lỗi xác thực. Trước khi kiểm tra thực tế phải áp dụng migration và khởi động lại backend.
