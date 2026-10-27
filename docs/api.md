# LastBite - Tài liệu API v1

| | |
|---|---|
| Phiên bản | 1.0 (bản đầu, 15/10/2026) |
| Người chịu trách nhiệm | VT1 (Trưởng nhóm, Backend Lead) |
| Base URL (máy cá nhân) | `http://localhost:5000/api` |
| Ảnh đã tải lên | `http://localhost:5000/uploads/<tên-file>` |
| Dữ liệu trao đổi | JSON, mã hoá UTF-8 |

> Đây là **hợp đồng** giữa frontend và backend. Backend phải trả đúng đường dẫn và đúng dạng JSON ở đây; frontend dùng các ví dụ JSON bên dưới làm **dữ liệu giả (mock)** trong lúc chờ API thật. Muốn đổi API thì **sửa file này trước, báo cả nhóm, rồi mới sửa code**.
>
> Cột ưu tiên: **P0** bắt buộc, **P1** nên có, **P2** nếu còn thời gian. Cấu trúc bảng dữ liệu xem `database/schema.sql`.

## Mục lục

1. [Quy ước chung](#1-quy-ước-chung)
2. [Bảng tổng hợp endpoint](#2-bảng-tổng-hợp-endpoint)
3. [Chi tiết từng API](#3-chi-tiết-từng-api)
4. [Các đối tượng dữ liệu](#4-các-đối-tượng-dữ-liệu)
5. [Quy tắc nghiệp vụ gắn với API](#5-quy-tắc-nghiệp-vụ-gắn-với-api)
6. [Luồng demo từ đầu đến cuối](#6-luồng-demo-từ-đầu-đến-cuối)
7. [Hướng dẫn sử dụng cho từng vị trí](#7-hướng-dẫn-sử-dụng-cho-từng-vị-trí)

---

## 1. Quy ước chung

### 1.1 Định dạng yêu cầu

- Gửi và nhận **JSON** với header `Content-Type: application/json`.
- Ngoại lệ duy nhất: `POST /uploads/image` dùng `multipart/form-data`.
- Tên trường dùng **snake_case**, trùng với tên cột trong database (`original_price`, `pickup_start`...).

### 1.2 Xác thực

Các API cần đăng nhập phải gửi kèm header:

```
Authorization: Bearer <token>
```

- `token` lấy từ `POST /auth/login` hoặc `POST /auth/register`.
- Token là JWT chứa `id` và `role` của người dùng, hết hạn sau 7 ngày (`JWT_EXPIRES_IN`).
- Middleware xác thực nên **tra lại `status` của người dùng trong database** mỗi yêu cầu, để tài khoản bị admin khoá bị chặn ngay, không phải đợi token hết hạn.

### 1.3 Cấu trúc phản hồi

**Thành công, một đối tượng:**

```json
{
  "success": true,
  "data": { "id": 15, "title": "Túi bánh mì cuối ngày" }
}
```

**Thành công, danh sách có phân trang:**

```json
{
  "success": true,
  "data": [ { "id": 15 }, { "id": 16 } ],
  "pagination": { "page": 1, "limit": 12, "total": 27, "total_pages": 3 }
}
```

**Thành công, có thông điệp** (khi thao tác không cần trả đối tượng):

```json
{
  "success": true,
  "message": "Đã huỷ đơn"
}
```

**Lỗi:**

```json
{
  "success": false,
  "message": "Không đủ suất, chỉ còn 1 suất"
}
```

**Lỗi dữ liệu không hợp lệ (400)** có thêm danh sách lỗi theo trường:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "email", "message": "Email không đúng định dạng" },
    { "field": "password", "message": "Mật khẩu tối thiểu 6 ký tự" }
  ]
}
```

> Hai API kiểm tra sức khoẻ (`/health`, `/health/db`) đã có sẵn trong khung backend và trả `{ success, message, time }`, **không có** trường `data`. Giữ nguyên, không cần sửa.

### 1.4 Mã trạng thái HTTP

| Mã | Ý nghĩa | Ví dụ trong LastBite |
|---|---|---|
| 200 | Thành công | Lấy danh sách, cập nhật |
| 201 | Đã tạo mới | Đăng ký, đặt chỗ, tạo tin |
| 400 | Dữ liệu gửi lên sai | Thiếu trường, giá sai, ảnh quá 2MB |
| 401 | Chưa đăng nhập, token sai hoặc hết hạn | Gọi API cần đăng nhập mà không có token |
| 403 | Không đủ quyền hoặc tài khoản bị khoá | Người mua gọi API admin |
| 404 | Không tìm thấy | Tin đăng không tồn tại |
| 409 | Xung đột với trạng thái hiện tại | Email trùng, hết suất, đơn đã nhận |
| 429 | Gọi quá nhiều lần | Đăng nhập sai liên tục (rate limit) |
| 500 | Lỗi máy chủ | Lỗi không lường trước |
| 501 | Chưa triển khai | Các route còn là khung |

**Lưu ý cho frontend:** axios interceptor nên đăng xuất khi gặp **401**. Vì vậy các lỗi "sai mật khẩu hiện tại" khi đổi mật khẩu dùng **400**, không dùng 401.

### 1.5 Quy ước dữ liệu

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Tiền | Số nguyên, đơn vị đồng (VND), không có phần thập phân | `25000` |
| Ngày giờ | Chuỗi ISO 8601, **giờ Việt Nam** kèm `+07:00` | `"2026-10-20T20:00:00+07:00"` |
| Khoá chính | Số nguyên dương | `15` |
| Giá trị trống | `null` (không bỏ trường) | `"phone": null` |
| Email | Lưu và so sánh bằng chữ thường | `"an.nguyen@example.com"` |
| Mã nhận hàng | 6 ký tự chữ hoa và số, bỏ các ký tự dễ nhầm `0 O 1 I` | `"K7M3QX"` |
| Đường dẫn ảnh | Đường dẫn tương đối, frontend nối thêm địa chỉ server | `"/uploads/1760500000000-8f3a1c.jpg"` |

**Về múi giờ:** MySQL lưu `DATETIME` không kèm múi giờ. VT1 phải đảm bảo MySQL và Node.js cùng chạy **giờ Việt Nam** (so `SELECT NOW()` với giờ máy), nếu không bộ lọc "còn hạn nhận" sẽ sai lệch vài tiếng.

### 1.6 Phân trang, sắp xếp

Mọi API danh sách dùng chung các tham số:

| Tham số | Mặc định | Giới hạn | Ý nghĩa |
|---|---|---|---|
| `page` | 1 | >= 1 | Trang cần lấy |
| `limit` | 12 | 1 đến 50 | Số phần tử mỗi trang |

Giá trị vượt giới hạn thì server tự đưa về giới hạn gần nhất, không báo lỗi.

### 1.7 Ký hiệu quyền trong tài liệu

| Ký hiệu | Ai được gọi |
|---|---|
| Công khai | Không cần đăng nhập |
| Đăng nhập | Mọi vai trò đã đăng nhập |
| buyer | Chỉ người mua |
| store | Chỉ tài khoản cửa hàng |
| store (đã duyệt) | Tài khoản cửa hàng có `store.status = approved` |
| admin | Chỉ quản trị viên |

---

## 2. Bảng tổng hợp endpoint

Phụ trách: **VT1** Backend Lead, **VT3** module cửa hàng, **VT4** module admin. Cột "Xong" để tick khi hoàn thành.

| # | Method | Đường dẫn | Quyền | Mô tả | Mức | Phụ trách | Hạn | Xong |
|---|---|---|---|---|---|---|---|---|
| 1 | GET | `/health` | Công khai | Server còn sống | P0 | VT1 | Xong | [x] |
| 2 | GET | `/health/db` | Công khai | Kết nối MySQL | P0 | VT1 | Xong | [x] |
| 3 | POST | `/auth/register` | Công khai | Đăng ký | P0 | VT1 | 16/10 | [ ] |
| 4 | POST | `/auth/login` | Công khai | Đăng nhập | P0 | VT1 | 16/10 | [ ] |
| 5 | GET | `/auth/me` | Đăng nhập | Thông tin tài khoản hiện tại | P0 | VT1 | 16/10 | [ ] |
| 6 | PUT | `/auth/me` | Đăng nhập | Sửa hồ sơ | P0 | VT1 | 22/10 | [ ] |
| 7 | PUT | `/auth/password` | Đăng nhập | Đổi mật khẩu | P0 | VT1 | 22/10 | [ ] |
| 8 | GET | `/categories` | Công khai | Danh sách loại món | P0 | VT1 | 17/10 | [ ] |
| 9 | POST | `/uploads/image` | store, admin | Tải ảnh lên | P0 | VT3 | 17/10 | [ ] |
| 10 | GET | `/listings` | Công khai | Tìm kiếm, lọc suất đồ ăn | P0 | VT1 | 18/10 (bản đầu), 21/10 (đủ lọc) | [ ] |
| 11 | GET | `/listings/:id` | Công khai | Chi tiết một suất | P0 | VT1 | 21/10 | [ ] |
| 12 | POST | `/listings` | store (đã duyệt) | Đăng tin | P0 | VT3 | 18/10 | [ ] |
| 13 | PUT | `/listings/:id` | store (chủ tin) | Sửa tin | P0 | VT3 | 18/10 | [ ] |
| 14 | DELETE | `/listings/:id` | store (chủ tin) | Xoá tin (xoá mềm) | P0 | VT3 | 18/10 | [ ] |
| 15 | POST | `/listings/:id/duplicate` | store (chủ tin) | Nhân bản tin cũ | P1 | VT3 | 27/10 | [ ] |
| 16 | POST | `/stores` | store | Đăng ký cửa hàng (chờ duyệt) | P0 | VT3 | 21/10 | [ ] |
| 17 | GET | `/stores/me` | store | Cửa hàng của tôi | P0 | VT3 | 21/10 | [ ] |
| 18 | PUT | `/stores/me` | store | Sửa thông tin cửa hàng | P0 | VT3 | 21/10 | [ ] |
| 19 | GET | `/stores/me/listings` | store | Tin đăng của cửa hàng tôi | P0 | VT3 | 18/10 | [ ] |
| 20 | GET | `/stores/me/orders` | store | Đơn của cửa hàng tôi | P0 | VT1 | 23/10 | [ ] |
| 21 | GET | `/stores/me/orders/by-code/:code` | store | Tra cứu đơn theo mã | P0 | VT1 | 23/10 | [ ] |
| 22 | POST | `/stores/me/orders/confirm` | store | Xác nhận khách đã nhận | P0 | VT1 | 23/10 | [ ] |
| 23 | PATCH | `/stores/me/orders/:id/no-show` | store | Đánh dấu khách không đến | P0 | VT1 | 23/10 | [ ] |
| 24 | GET | `/stores/me/stats` | store | Thống kê dashboard | P1 | VT3 | 27/10 | [ ] |
| 25 | GET | `/stores` | Công khai | Danh sách cửa hàng (bản đồ) | P1 | VT3 | 28/10 | [ ] |
| 26 | GET | `/stores/:id` | Công khai | Thông tin một cửa hàng | P1 | VT3 | 28/10 | [ ] |
| 27 | POST | `/orders` | buyer | Đặt chỗ | P0 | VT1 | 22/10 | [ ] |
| 28 | GET | `/orders/my` | buyer | Lịch sử đơn của tôi | P0 | VT1 | 23/10 | [ ] |
| 29 | GET | `/orders/:id` | buyer, store, admin | Chi tiết một đơn | P0 | VT1 | 23/10 | [ ] |
| 30 | PATCH | `/orders/:id/cancel` | buyer | Huỷ đơn | P0 | VT1 | 23/10 | [ ] |
| 31 | GET | `/favorites` | buyer | Cửa hàng yêu thích | P1 | VT4 | 27/10 | [ ] |
| 32 | POST | `/favorites/:storeId` | buyer | Thêm yêu thích | P1 | VT4 | 27/10 | [ ] |
| 33 | DELETE | `/favorites/:storeId` | buyer | Bỏ yêu thích | P1 | VT4 | 27/10 | [ ] |
| 34 | POST | `/orders/:id/review` | buyer | Đánh giá đơn đã nhận | P2 | VT4 | nếu kịp | [ ] |
| 35 | GET | `/stores/:id/reviews` | Công khai | Đánh giá của cửa hàng | P2 | VT4 | nếu kịp | [ ] |
| 36 | GET | `/notifications` | Đăng nhập | Danh sách thông báo | P2 | VT4 | nếu kịp | [ ] |
| 37 | PATCH | `/notifications/:id/read` | Đăng nhập | Đánh dấu đã đọc | P2 | VT4 | nếu kịp | [ ] |
| 38 | PATCH | `/notifications/read-all` | Đăng nhập | Đọc hết | P2 | VT4 | nếu kịp | [ ] |
| 39 | GET | `/admin/stores` | admin | Danh sách cửa hàng | P0 | VT4 | 20/10 | [ ] |
| 40 | PATCH | `/admin/stores/:id/status` | admin | Duyệt hoặc khoá cửa hàng | P0 | VT4 | 20/10 | [ ] |
| 41 | GET | `/admin/users` | admin | Danh sách người dùng | P0 | VT4 | 23/10 | [ ] |
| 42 | PATCH | `/admin/users/:id/status` | admin | Khoá hoặc mở tài khoản | P0 | VT4 | 23/10 | [ ] |
| 43 | GET | `/admin/listings` | admin | Danh sách tin đăng | P0 | VT4 | 23/10 | [ ] |
| 44 | PATCH | `/admin/listings/:id/status` | admin | Hiện, ẩn hoặc xoá tin | P0 | VT4 | 23/10 | [ ] |
| 45 | GET | `/admin/stats` | admin | Thống kê "suất đã cứu" | P0 (cơ bản), P1 (biểu đồ tuần) | VT4 | 27/10 | [ ] |

**Hai lưu ý khi viết route trong Express:**

1. Khai báo đường dẫn cố định **trước** đường dẫn có tham số, nếu không `me` sẽ bị hiểu là `:id`. Ví dụ `/stores/me` phải đặt trước `/stores/:id`, `/orders/my` trước `/orders/:id`.
2. Các nhóm `/categories`, `/uploads`, `/favorites`, `/notifications` chưa có file route trong khung backend. Cần thêm file mới và khai báo trong `server/src/routes/index.js`.

---

## 3. Chi tiết từng API

### 3.1 Health (đã có)

| API | Phản hồi |
|---|---|
| `GET /health` | `{ "success": true, "message": "LastBite API đang chạy", "time": "..." }` |
| `GET /health/db` | 200 nếu nối được MySQL, 503 nếu không |

---

### 3.2 Xác thực và tài khoản (VT1)

#### POST /auth/register

Đăng ký tài khoản mới. **Quyền:** Công khai.

| Trường | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `name` | string | Có | 2 đến 100 ký tự |
| `email` | string | Có | Đúng định dạng email, tối đa 150 ký tự |
| `password` | string | Có | 6 đến 72 ký tự (giới hạn của bcrypt) |
| `phone` | string | Không | 9 đến 11 chữ số |
| `role` | string | Không | `buyer` (mặc định) hoặc `store`. Gửi `admin` bị từ chối 400 |

Yêu cầu mẫu:

```json
{
  "name": "Nguyễn Văn An",
  "email": "an.nguyen@example.com",
  "password": "matkhau123",
  "phone": "0901234567",
  "role": "buyer"
}
```

Phản hồi **201** (đã đăng nhập sẵn, frontend lưu token luôn):

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 7,
      "name": "Nguyễn Văn An",
      "email": "an.nguyen@example.com",
      "phone": "0901234567",
      "role": "buyer",
      "status": "active",
      "created_at": "2026-10-16T09:30:00+07:00"
    }
  }
}
```

Lỗi: `400` dữ liệu không hợp lệ, `409` "Email đã được sử dụng".

#### POST /auth/login

**Quyền:** Công khai. Có giới hạn tần suất: tối đa 10 lần sai trong 15 phút mỗi địa chỉ IP, vượt thì trả `429`.

```json
{
  "email": "an.nguyen@example.com",
  "password": "matkhau123"
}
```

Phản hồi **200**: giống `register` (gồm `token` và `user`).

Nếu `user.role` là `store`, `user` có thêm trường `store`: `null` nếu chưa đăng ký cửa hàng, ngược lại là `{ "id", "name", "status" }`. Frontend dựa vào đây để chuyển người dùng tới form đăng ký cửa hàng hoặc màn hình "chờ duyệt".

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "name": "Trần Thị Hương",
      "email": "huong.tran@example.com",
      "phone": "0912345678",
      "role": "store",
      "status": "active",
      "created_at": "2026-10-15T10:00:00+07:00",
      "store": { "id": 3, "name": "Tiệm bánh Hương Quê", "status": "pending" }
    }
  }
}
```

Lỗi:

- `401` "Email hoặc mật khẩu không đúng" (dùng chung một thông báo cho cả hai trường hợp, không cho biết email có tồn tại hay không).
- `403` "Tài khoản đã bị khoá". Chỉ kiểm tra **sau khi mật khẩu đúng**.
- `429` "Bạn đã thử quá nhiều lần, vui lòng thử lại sau".

#### GET /auth/me

**Quyền:** Đăng nhập. Trả về `user` hiện tại (có thêm `store` nếu là tài khoản cửa hàng). Dùng khi tải lại trang để biết token còn hợp lệ.

```json
{
  "success": true,
  "data": {
    "id": 7,
    "name": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "phone": "0901234567",
    "role": "buyer",
    "status": "active",
    "created_at": "2026-10-16T09:30:00+07:00"
  }
}
```

Lỗi: `401` token thiếu, sai hoặc hết hạn.

#### PUT /auth/me

**Quyền:** Đăng nhập. Sửa hồ sơ. Chỉ sửa được `name` và `phone` (không đổi được `email`, `role`).

```json
{
  "name": "Nguyễn Văn An",
  "phone": "0907654321"
}
```

Phản hồi **200**: `user` sau khi cập nhật. Lỗi: `400`.

#### PUT /auth/password

**Quyền:** Đăng nhập. Đổi mật khẩu.

```json
{
  "current_password": "matkhau123",
  "new_password": "matkhaumoi456"
}
```

Phản hồi **200**: `{ "success": true, "message": "Đã đổi mật khẩu" }`.
Lỗi: `400` nếu mật khẩu hiện tại sai hoặc mật khẩu mới không hợp lệ (dùng 400, không dùng 401, xem mục 1.4).

---

### 3.3 Loại món (VT1)

#### GET /categories

**Quyền:** Công khai. Dùng cho bộ lọc và form đăng tin. Dữ liệu lấy từ bảng `categories`.

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Bánh ngọt và bánh mì", "slug": "banh" },
    { "id": 2, "name": "Cơm và món chính", "slug": "com-mon-chinh" },
    { "id": 3, "name": "Đồ uống", "slug": "do-uong" },
    { "id": 4, "name": "Ăn vặt", "slug": "an-vat" },
    { "id": 5, "name": "Đồ tiện lợi", "slug": "tien-loi" },
    { "id": 6, "name": "Túi bất ngờ", "slug": "tui-bat-ngo" }
  ]
}
```

---

### 3.4 Tải ảnh (VT3)

Mọi ảnh (ảnh món, ảnh cửa hàng) đều đi qua **một** API này. Cách dùng: tải ảnh lên, nhận `image_url`, rồi đưa `image_url` vào body JSON khi tạo hoặc sửa tin, cửa hàng.

#### POST /uploads/image

**Quyền:** store, admin. Dùng `multipart/form-data`, trường file tên **`image`**.

| Quy tắc | Giá trị |
|---|---|
| Định dạng | JPG, JPEG, PNG (kiểm tra cả MIME và đuôi file) |
| Dung lượng tối đa | 2MB |
| Tên file lưu | Tự sinh (thời gian + số ngẫu nhiên), **không** dùng tên gốc của người dùng |
| Nơi lưu | `server/uploads/` |

Phản hồi **201**:

```json
{
  "success": true,
  "data": { "image_url": "/uploads/1760500000000-8f3a1c.jpg" }
}
```

Lỗi `400`: không có file, sai định dạng ("Chỉ chấp nhận ảnh JPG hoặc PNG"), quá lớn ("Ảnh tối đa 2MB"). Lỗi của multer (ví dụ `LIMIT_FILE_SIZE`) cần được đổi thành 400 trong `errorHandler`.

Ảnh xem trực tiếp qua `GET /uploads/<tên-file>`. Tin hoặc cửa hàng bị xoá không tự xoá file ảnh (chấp nhận được với bài tập lớn).

---

### 3.5 Tìm kiếm tin đăng, phía người mua (VT1)

#### GET /listings

**Quyền:** Công khai. Danh sách suất đồ ăn đang bán.

**Điều kiện mặc định, luôn áp dụng:**

```sql
l.status = 'active' AND s.status = 'approved'
AND l.pickup_end > NOW() AND l.remaining > 0
AND l.pickup_start - INTERVAL <BOOKING_LEAD_MINUTES> MINUTE <= NOW()
```

Nghĩa là tin còn hiệu lực, cửa hàng đã duyệt, chưa hết giờ nhận, còn suất, và **đã mở đặt chỗ**. Tin hết hạn, hết suất hoặc chưa tới giờ mở đặt **không** xuất hiện ở đây.

**Giờ mở đặt chỗ:** người mua chỉ đặt được trong khoảng `BOOKING_LEAD_MINUTES` phút trước `pickup_start` (mặc định 120 phút = 2 tiếng, chỉnh trong `server/.env`). Nhờ vậy số suất hiển thị là số suất dư thật của cuối ngày, không phải số đăng từ sáng. Khi demo ban ngày, đặt `BOOKING_LEAD_MINUTES=1440` để món hiện ra suốt cả ngày.

| Tham số | Kiểu | Ý nghĩa |
|---|---|---|
| `q` | string | Tìm theo tên món hoặc tên cửa hàng (chứa chuỗi này) |
| `category_id` | int | Lọc theo loại món |
| `min_price`, `max_price` | int | Lọc theo **giá cứu** (`sale_price`), đơn vị đồng |
| `pickup_from`, `pickup_to` | ISO 8601 | Lấy tin có khung giờ nhận **giao** với khoảng này: `pickup_start < pickup_to` và `pickup_end > pickup_from` |
| `store_id` | int | Chỉ lấy tin của một cửa hàng |
| `sort` | string | `pickup_asc` (mặc định, sắp hết giờ trước), `price_asc`, `price_desc`, `newest` |
| `page`, `limit` | int | Phân trang, xem mục 1.6 |

Ví dụ: `GET /listings?category_id=1&max_price=30000&pickup_from=2026-10-20T20:00:00%2B07:00&sort=price_asc&page=1&limit=12`

Phản hồi **200**:

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "store_id": 3,
      "store": {
        "id": 3,
        "name": "Tiệm bánh Hương Quê",
        "address": "25 Nguyễn Trãi, Quận 1, TP.HCM",
        "image_url": "/uploads/1760400000000-a1b2c3.jpg",
        "latitude": 10.768,
        "longitude": 106.69
      },
      "category": { "id": 1, "name": "Bánh ngọt và bánh mì" },
      "title": "Túi bánh mì và bánh ngọt cuối ngày",
      "description": "Gồm 3 đến 4 loại bánh còn lại trong ngày, làm sáng nay.",
      "image_url": "/uploads/1760500000000-8f3a1c.jpg",
      "original_price": 60000,
      "sale_price": 25000,
      "discount_percent": 58,
      "quantity": 10,
      "remaining": 4,
      "pickup_start": "2026-10-20T20:00:00+07:00",
      "pickup_end": "2026-10-20T21:30:00+07:00",
      "status": "active",
      "is_available": true,
      "created_at": "2026-10-20T14:05:00+07:00"
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 1, "total_pages": 1 }
}
```

`discount_percent` được tính khi trả về: `round((1 - sale_price / original_price) * 100)`, không lưu trong database.

#### GET /listings/:id

**Quyền:** Công khai. Chi tiết một suất, dạng đối tượng giống phần tử ở trên.

Khác với danh sách, trang chi tiết **vẫn trả về** tin đã hết hạn hoặc hết suất, kèm `"is_available": false` để frontend hiển thị "Đã hết suất" hoặc "Đã hết giờ nhận" và khoá nút đặt. `is_available = remaining > 0 && pickup_end > bây giờ`.

Mọi đối tượng Listing trả về còn có `booking_opens_at` (ISO 8601: `pickup_start` trừ `BOOKING_LEAD_MINUTES` phút) và `is_booking_open` (`true` khi đã tới mốc đó). Chi tiết của tin **chưa mở đặt** vẫn xem được, nhưng frontend khoá nút đặt và ghi "Mở đặt chỗ lúc ...".

Lỗi `404` khi tin không tồn tại, có `status` là `hidden` hoặc `deleted`, hoặc cửa hàng chưa được duyệt.

---

### 3.6 Quản lý tin đăng, phía cửa hàng (VT3)

Chung cho nhóm này: người gọi phải là tài khoản `store` có cửa hàng **đã duyệt**, nếu không trả `403` "Cửa hàng chưa được duyệt". Chỉ **chủ tin** mới sửa hoặc xoá được tin, người khác nhận `403`.

#### POST /listings

Tạo tin mới.

| Trường | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `title` | string | Có | 3 đến 150 ký tự |
| `description` | string | Không | Tối đa 2000 ký tự |
| `image_url` | string | Không | Đường dẫn nhận từ `POST /uploads/image` |
| `category_id` | int | Không | Phải tồn tại trong `categories` |
| `original_price` | int | Có | Từ 1.000 đồng |
| `sale_price` | int | Có | Từ 1.000 đồng và **nhỏ hơn hoặc bằng** `original_price` |
| `quantity` | int | Có | 1 đến 999 |
| `pickup_start` | ISO 8601 | Có | Giờ bắt đầu nhận, phải nằm trong **ngày hôm nay** (giờ Việt Nam) |
| `pickup_end` | ISO 8601 | Có | **Sau** `pickup_start`, **sau thời điểm hiện tại** và nằm trong **ngày hôm nay** (không qua 24:00) |

Quy tắc "chỉ đăng suất dư cuối ngày" cũng áp dụng khi `PUT /listings/:id` có gửi `pickup_start` hoặc `pickup_end`. Sửa giá, số suất... mà không đụng tới giờ nhận thì không bị kiểm tra ngày.

```json
{
  "title": "Túi bánh mì và bánh ngọt cuối ngày",
  "description": "Gồm 3 đến 4 loại bánh còn lại trong ngày, làm sáng nay.",
  "image_url": "/uploads/1760500000000-8f3a1c.jpg",
  "category_id": 1,
  "original_price": 60000,
  "sale_price": 25000,
  "quantity": 10,
  "pickup_start": "2026-10-20T20:00:00+07:00",
  "pickup_end": "2026-10-20T21:30:00+07:00"
}
```

Phản hồi **201**: đối tượng tin (như mục 3.5). Server tự đặt `remaining = quantity` và `status = "active"`.

#### PUT /listings/:id

Sửa tin của mình. Chỉ gửi các trường cần đổi, trường không gửi giữ nguyên. Quy tắc kiểm tra giống `POST /listings`.

**Quy tắc riêng khi đổi `quantity`:** server tính số suất đã được đặt `booked = quantity_cũ - remaining_cũ`, rồi đặt `remaining_mới = quantity_mới - booked`. Nếu `remaining_mới < 0` (tức đổi xuống thấp hơn số suất đã đặt) thì trả `409` "Số lượng thấp hơn số suất đã được đặt".

Đổi giá không ảnh hưởng đơn cũ, vì đơn đã lưu `unit_price` tại thời điểm đặt.

Lỗi: `404` (tin không tồn tại hoặc đã xoá), `403` (không phải chủ tin), `400`, `409`.

#### DELETE /listings/:id

**Xoá mềm:** đổi `status` thành `deleted`, không xoá dòng trong database (vì đơn cũ vẫn tham chiếu tới tin).

Phản hồi **200**: `{ "success": true, "message": "Đã xoá tin" }`.
Lỗi `409` "Còn 2 đơn đang chờ nhận, hãy xử lý trước khi xoá" nếu tin còn đơn ở trạng thái `pending`.

#### POST /listings/:id/duplicate (P1)

Nhân bản tin cũ để đăng nhanh cho ngày mới. Sao chép tên, mô tả, ảnh, loại, giá; cần cung cấp giờ nhận mới.

```json
{
  "pickup_start": "2026-10-21T20:00:00+07:00",
  "pickup_end": "2026-10-21T21:30:00+07:00",
  "quantity": 8
}
```

`quantity` không bắt buộc (mặc định bằng tin gốc). Phản hồi **201**: tin mới.

#### GET /stores/me/listings

Danh sách tin của cửa hàng mình, bao gồm tin đã hết hạn, **không** gồm tin `deleted`.

| Tham số | Ý nghĩa |
|---|---|
| `status` | `active` hoặc `hidden` (tin bị admin ẩn), bỏ trống là lấy cả hai |
| `page`, `limit` | Phân trang |

Mỗi phần tử là đối tượng tin kèm thêm `booked` (số suất đã đặt, bằng `quantity - remaining`). Sắp xếp mới nhất trước.

---

### 3.7 Cửa hàng (VT3)

#### POST /stores

**Quyền:** store. Đăng ký cửa hàng, mỗi tài khoản chỉ có **một** cửa hàng.

| Trường | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `name` | string | Có | 2 đến 150 ký tự |
| `address` | string | Có | 5 đến 255 ký tự |
| `phone` | string | Không | 9 đến 11 chữ số |
| `description` | string | Không | Tối đa 2000 ký tự |
| `image_url` | string | Không | Từ `POST /uploads/image` |
| `latitude`, `longitude` | number | Không | Phải gửi **cả hai** hoặc không gửi. Vĩ độ -90 đến 90, kinh độ -180 đến 180 |

```json
{
  "name": "Tiệm bánh Hương Quê",
  "address": "25 Nguyễn Trãi, Quận 1, TP.HCM",
  "phone": "0281234567",
  "description": "Tiệm bánh gia đình, mở cửa từ 6 giờ sáng.",
  "image_url": "/uploads/1760400000000-a1b2c3.jpg",
  "latitude": 10.768,
  "longitude": 106.69
}
```

Phản hồi **201** (trạng thái ban đầu luôn là `pending`):

```json
{
  "success": true,
  "message": "Đăng ký thành công, vui lòng chờ admin duyệt",
  "data": {
    "id": 3,
    "owner_id": 3,
    "name": "Tiệm bánh Hương Quê",
    "address": "25 Nguyễn Trãi, Quận 1, TP.HCM",
    "phone": "0281234567",
    "description": "Tiệm bánh gia đình, mở cửa từ 6 giờ sáng.",
    "image_url": "/uploads/1760400000000-a1b2c3.jpg",
    "latitude": 10.768,
    "longitude": 106.69,
    "status": "pending",
    "created_at": "2026-10-20T08:00:00+07:00"
  }
}
```

Lỗi: `400`, `409` "Bạn đã đăng ký cửa hàng".

#### GET /stores/me

**Quyền:** store. Trả cửa hàng của mình, hoặc `"data": null` nếu chưa đăng ký (vẫn trả 200, để frontend dễ rẽ nhánh).

#### PUT /stores/me

**Quyền:** store. Sửa `name`, `address`, `phone`, `description`, `image_url`, `latitude`, `longitude`. **Không** sửa được `status`. Cửa hàng đang bị khoá (`locked`) thì trả `403`.

#### GET /stores/me/stats (P1)

**Quyền:** store. Số liệu cho dashboard cửa hàng.

```json
{
  "success": true,
  "data": {
    "total_listings": 18,
    "active_now": 3,
    "orders": { "total": 30, "pending": 2, "picked_up": 24, "cancelled": 3, "no_show": 1 },
    "meals_saved": 51,
    "revenue": 1275000,
    "weekly": [
      { "date": "2026-10-19", "meals": 9, "revenue": 225000 },
      { "date": "2026-10-20", "meals": 12, "revenue": 300000 },
      { "date": "2026-10-21", "meals": 7, "revenue": 175000 }
    ]
  }
}
```

- `meals_saved`: tổng `quantity` của các đơn `picked_up`.
- `revenue`: tổng `total_price` của các đơn `picked_up`.
- `weekly`: tối đa 7 ngày gần nhất (ví dụ trên rút gọn còn 3 ngày), mỗi ngày tính theo `picked_up_at`.

#### GET /stores (P1)

**Quyền:** Công khai. Danh sách cửa hàng đã duyệt, dùng vẽ bản đồ. Tham số: `q`, `page`, `limit`.

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Tiệm bánh Hương Quê",
      "address": "25 Nguyễn Trãi, Quận 1, TP.HCM",
      "image_url": "/uploads/1760400000000-a1b2c3.jpg",
      "latitude": 10.768,
      "longitude": 106.69,
      "active_listings": 2
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 1, "total_pages": 1 }
}
```

`active_listings`: số tin đang bán (còn hạn, còn suất) của cửa hàng.

#### GET /stores/:id (P1)

**Quyền:** Công khai. Thông tin một cửa hàng đã duyệt (đối tượng Store, không gồm `owner_id`). `404` nếu chưa duyệt hoặc không tồn tại. Danh sách tin của cửa hàng lấy bằng `GET /listings?store_id=...`.

---

### 3.8 Đơn đặt chỗ, phía người mua (VT1)

Đây là phần quan trọng nhất của dự án.

#### POST /orders

**Quyền:** buyer. Đặt giữ chỗ.

| Trường | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `listing_id` | int | Có | Tin phải đang `active`, cửa hàng `approved` |
| `quantity` | int | Có | 1 đến 5 mỗi đơn |

```json
{ "listing_id": 15, "quantity": 2 }
```

**Điều kiện đặt được:** tin `active`, cửa hàng `approved`, `pickup_end` chưa qua, **đã tới giờ mở đặt chỗ** (`pickup_start` trừ `BOOKING_LEAD_MINUTES` phút), `remaining >= quantity`.

**Xử lý trong một transaction** (chống bán lố, xem mục 5.2):

1. `START TRANSACTION`.
2. Đọc `sale_price` của tin (`SELECT ... FOR UPDATE`).
3. `UPDATE listings SET remaining = remaining - ? WHERE id = ? AND status = 'active' AND pickup_end > NOW() AND pickup_start - INTERVAL <BOOKING_LEAD_MINUTES> MINUTE <= NOW() AND remaining >= ?`. Nếu số dòng bị ảnh hưởng bằng 0 thì `ROLLBACK` và trả 409.
4. Sinh `pickup_code`, `INSERT` vào `orders` với `unit_price` và `total_price`. Nếu trùng mã (`ER_DUP_ENTRY`) thì sinh mã khác và thử lại.
5. `COMMIT`.

Phản hồi **201**:

```json
{
  "success": true,
  "message": "Đặt chỗ thành công",
  "data": {
    "id": 42,
    "quantity": 2,
    "unit_price": 25000,
    "total_price": 50000,
    "pickup_code": "K7M3QX",
    "status": "pending",
    "created_at": "2026-10-20T18:45:00+07:00",
    "picked_up_at": null,
    "cancelled_at": null,
    "listing": {
      "id": 15,
      "title": "Túi bánh mì và bánh ngọt cuối ngày",
      "image_url": "/uploads/1760500000000-8f3a1c.jpg",
      "pickup_start": "2026-10-20T20:00:00+07:00",
      "pickup_end": "2026-10-20T21:30:00+07:00"
    },
    "store": {
      "id": 3,
      "name": "Tiệm bánh Hương Quê",
      "address": "25 Nguyễn Trãi, Quận 1, TP.HCM",
      "phone": "0281234567"
    }
  }
}
```

Lỗi:

| Mã | Khi nào | Thông báo gợi ý |
|---|---|---|
| 400 | `quantity` không hợp lệ | "Số lượng từ 1 đến 5" |
| 403 | Không phải buyer | "Chỉ người mua mới đặt chỗ được" |
| 404 | Tin không tồn tại hoặc không hiển thị | "Không tìm thấy suất ăn" |
| 409 | Hết giờ nhận | "Suất này đã hết giờ nhận" |
| 409 | Chưa tới giờ mở đặt | "Suất này chưa mở đặt chỗ, bạn đặt được từ 18:00" |
| 409 | Không đủ suất | "Không đủ suất, chỉ còn 1 suất" |

#### GET /orders/my

**Quyền:** buyer. Lịch sử đơn của mình, mới nhất trước.

| Tham số | Ý nghĩa |
|---|---|
| `status` | `pending`, `picked_up`, `cancelled`, `no_show` (bỏ trống là tất cả) |
| `page`, `limit` | Phân trang |

Mỗi phần tử là đối tượng Order như ở `POST /orders` (có `listing` và `store`).

#### GET /orders/:id

**Quyền:** buyer (chủ đơn), store (cửa hàng sở hữu tin của đơn), admin. Người khác nhận `403`. Phản hồi là đối tượng Order; khi người gọi là store hoặc admin thì có thêm `buyer`: `{ "id", "name", "phone" }`.

#### PATCH /orders/:id/cancel

**Quyền:** buyer (chủ đơn). Không cần body.

**Điều kiện:** đơn đang `pending` và chưa qua `pickup_end`.

**Xử lý trong transaction:**

1. `UPDATE orders SET status = 'cancelled', cancelled_at = NOW() WHERE id = ? AND buyer_id = ? AND status = 'pending'`.
2. Nếu số dòng bị ảnh hưởng bằng 1 thì `UPDATE listings SET remaining = remaining + ? WHERE id = ?` để **trả suất lại**.
3. `COMMIT`.

Điều kiện `status = 'pending'` trong câu `UPDATE` đầu tiên chặn việc huỷ hai lần làm cộng suất hai lần.

Phản hồi **200**: `{ "success": true, "message": "Đã huỷ đơn" }`. Lỗi: `403` (không phải chủ đơn), `404`, `409` "Đơn không thể huỷ".

---

### 3.9 Đơn đặt chỗ, phía cửa hàng (VT1)

Các API này nằm dưới `/stores/me/orders`, chỉ thấy đơn của tin thuộc **cửa hàng của mình**. Người gọi phải là tài khoản `store` có cửa hàng.

#### GET /stores/me/orders

| Tham số | Ý nghĩa |
|---|---|
| `status` | `pending`, `picked_up`, `cancelled`, `no_show` |
| `listing_id` | Chỉ đơn của một tin |
| `page`, `limit` | Phân trang |

Mỗi phần tử là Order kèm `buyer` (`id`, `name`, `phone`), sắp xếp mới nhất trước. Frontend dùng tham số `status` để làm các tab "Chờ nhận", "Đã nhận", "Đã huỷ".

#### GET /stores/me/orders/by-code/:code

Tra cứu đơn theo mã trước khi xác nhận, để cửa hàng thấy tên khách, món, số lượng. `:code` không phân biệt chữ hoa thường.

Phản hồi **200**: một Order (kèm `buyer`, mọi trạng thái). `404` "Mã nhận hàng không đúng hoặc không thuộc cửa hàng của bạn" (dùng chung một thông báo cho hai trường hợp, để không lộ mã của cửa hàng khác).

#### POST /stores/me/orders/confirm

Xác nhận khách đã đến nhận hàng.

```json
{ "pickup_code": "K7M3QX" }
```

**Xử lý:** server chuyển chữ thường thành chữ hoa, bỏ khoảng trắng đầu cuối, tìm đơn có mã đó **thuộc cửa hàng của mình**, rồi `UPDATE orders SET status = 'picked_up', picked_up_at = NOW() WHERE id = ? AND status = 'pending'`.

Phản hồi **200**: Order sau cập nhật (`status` là `picked_up`, `picked_up_at` có giá trị).

Lỗi:

| Mã | Khi nào | Thông báo gợi ý |
|---|---|---|
| 400 | Mã không đủ 6 ký tự | "Mã nhận hàng gồm 6 ký tự" |
| 404 | Mã không có hoặc thuộc cửa hàng khác | "Mã nhận hàng không đúng hoặc không thuộc cửa hàng của bạn" |
| 409 | Đơn đã nhận | "Đơn này đã được nhận trước đó" |
| 409 | Đơn đã huỷ hoặc đã đánh dấu không đến | "Đơn này đã bị huỷ" hoặc "Đơn này đã được đánh dấu không đến" |
| 409 | Đã quá giờ nhận (`pickup_end`) | "Đã quá giờ nhận hàng, không thể xác nhận đơn này" |

#### PATCH /stores/me/orders/:id/no-show

Đánh dấu khách không đến. Chỉ được khi đơn đang `pending` **và đã qua `pickup_end`** của tin, nếu chưa hết giờ trả `409` "Chưa hết giờ nhận hàng". Suất **không** được trả lại (xem mục 5.3). Phản hồi **200**: Order với `status` là `no_show`.

---

### 3.10 Yêu thích (VT4, P1)

| API | Mô tả | Phản hồi |
|---|---|---|
| `GET /favorites` | Danh sách cửa hàng đã yêu thích của buyer, dạng giống `GET /stores` | 200, có phân trang |
| `POST /favorites/:storeId` | Thêm cửa hàng (chỉ cửa hàng đã duyệt). Gọi lặp lại không báo lỗi | 201 `{ "success": true, "message": "Đã thêm vào yêu thích" }` |
| `DELETE /favorites/:storeId` | Bỏ yêu thích. Gọi khi chưa yêu thích vẫn trả 200 | 200 `{ "success": true, "message": "Đã bỏ yêu thích" }` |

Lỗi: `404` khi cửa hàng không tồn tại hoặc chưa duyệt.

---

### 3.11 Đánh giá (VT4, P2)

#### POST /orders/:id/review

**Quyền:** buyer (chủ đơn). Chỉ đánh giá được đơn có `status = picked_up`, và mỗi đơn **một** lần.

```json
{ "rating": 5, "comment": "Bánh còn ngon, nhân viên thân thiện." }
```

`rating` từ 1 đến 5 (bắt buộc), `comment` tối đa 500 ký tự (không bắt buộc). Phản hồi **201**: `{ "id", "order_id", "rating", "comment", "created_at" }`.
Lỗi: `403` (không phải chủ đơn), `409` "Đơn chưa được nhận" hoặc "Bạn đã đánh giá đơn này".

#### GET /stores/:id/reviews

**Quyền:** Công khai. Danh sách đánh giá của một cửa hàng, mới nhất trước, có phân trang, kèm tổng hợp:

```json
{
  "success": true,
  "summary": { "average_rating": 4.6, "total": 12 },
  "data": [
    {
      "id": 5,
      "rating": 5,
      "comment": "Bánh còn ngon, nhân viên thân thiện.",
      "buyer_name": "Nguyễn Văn An",
      "created_at": "2026-10-21T09:00:00+07:00"
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 12, "total_pages": 1 }
}
```

---

### 3.12 Thông báo (VT4, P2)

| API | Mô tả |
|---|---|
| `GET /notifications` | Thông báo của mình, mới nhất trước. Tham số: `unread=true` (chỉ chưa đọc), `page`, `limit`. Phản hồi có thêm `unread_count` |
| `PATCH /notifications/:id/read` | Đánh dấu một thông báo đã đọc. `404` nếu không phải của mình |
| `PATCH /notifications/read-all` | Đánh dấu tất cả đã đọc |

```json
{
  "success": true,
  "unread_count": 2,
  "data": [
    {
      "id": 9,
      "title": "Có đơn mới",
      "content": "Nguyễn Văn An vừa đặt 2 suất Túi bánh mì và bánh ngọt cuối ngày.",
      "is_read": false,
      "created_at": "2026-10-20T18:45:00+07:00"
    }
  ],
  "pagination": { "page": 1, "limit": 12, "total": 2, "total_pages": 1 }
}
```

**Thông báo do hệ thống tự tạo** (không có API tạo từ ngoài), ví dụ: cửa hàng nhận thông báo khi có đơn mới hoặc khi khách huỷ; người mua nhận thông báo khi đơn được xác nhận; chủ cửa hàng nhận thông báo khi được duyệt hoặc bị khoá.

---

### 3.13 Quản trị (VT4)

Mọi API `/admin/...` chỉ cho **admin**, người khác nhận `403`.

#### GET /admin/stores

| Tham số | Ý nghĩa |
|---|---|
| `status` | `pending`, `approved`, `locked` |
| `q` | Tìm theo tên cửa hàng hoặc email chủ cửa hàng |
| `page`, `limit` | Phân trang |

Mỗi phần tử là Store kèm `owner` (`id`, `name`, `email`) và `listing_count`. Dùng tham số `status=pending` cho màn hình duyệt cửa hàng.

#### PATCH /admin/stores/:id/status

```json
{ "status": "approved" }
```

`status` chỉ nhận `approved` hoặc `locked` (đặt về `pending` bị từ chối `400`). Phản hồi **200**: Store sau cập nhật. `404` nếu không tồn tại.

**Hệ quả:** khi cửa hàng bị `locked`, mọi tin của cửa hàng tự biến mất khỏi tìm kiếm công khai (vì điều kiện `s.status = 'approved'`), nhưng các đơn đang `pending` vẫn tồn tại.

#### GET /admin/users

Tham số: `role`, `status` (`active` hoặc `locked`), `q` (tên hoặc email), `page`, `limit`. Mỗi phần tử là `user` (không có mật khẩu).

#### PATCH /admin/users/:id/status

```json
{ "status": "locked" }
```

`status` nhận `active` hoặc `locked`. Lỗi: `403` nếu muốn khoá chính mình hoặc khoá một admin khác, `404`. Tài khoản bị khoá không đăng nhập được (`403` ở `/auth/login`) và các token cũ bị chặn nếu middleware có tra `status` (xem mục 1.2).

Khoá tài khoản chủ cửa hàng **không** tự khoá cửa hàng; muốn ẩn cửa hàng khỏi tìm kiếm, khoá thêm ở `/admin/stores/:id/status`.

#### GET /admin/listings

Tham số: `status` (`active`, `hidden`, `deleted`), `store_id`, `q`, `page`, `limit`. Mỗi phần tử là đối tượng tin kèm tên cửa hàng. Khác với API công khai, ở đây **thấy cả tin hết hạn và tin đã xoá** (khi lọc `status=deleted`).

#### PATCH /admin/listings/:id/status

```json
{ "status": "hidden" }
```

`status` nhận `active` (hiện lại), `hidden` (ẩn tin vi phạm) hoặc `deleted` (xoá mềm). Một API này thay cho cả "ẩn" lẫn "xoá" tin vi phạm. Phản hồi **200**: tin sau cập nhật.

#### GET /admin/stats

Thống kê tổng quan, gồm **số suất đã cứu**.

```json
{
  "success": true,
  "data": {
    "users": { "total": 25, "buyers": 18, "stores": 6, "admins": 1, "locked": 0 },
    "stores": { "total": 6, "pending": 1, "approved": 5, "locked": 0 },
    "listings": { "active_now": 9, "total": 42 },
    "orders": { "total": 57, "pending": 6, "picked_up": 41, "cancelled": 8, "no_show": 2 },
    "meals_saved": 96,
    "revenue_total": 2410000,
    "weekly": [
      { "date": "2026-10-19", "meals": 12, "revenue": 300000 },
      { "date": "2026-10-20", "meals": 18, "revenue": 450000 },
      { "date": "2026-10-21", "meals": 15, "revenue": 375000 }
    ]
  }
}
```

- `meals_saved`: tổng `quantity` của các đơn `picked_up` (đây là con số để trình bày "đã cứu được X suất").
- `revenue_total`: tổng `total_price` của các đơn `picked_up`.
- `weekly` (P1): tối đa 7 ngày gần nhất (ví dụ rút gọn còn 3 ngày), P0 có thể bỏ trường này.

---

## 4. Các đối tượng dữ liệu

### User

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | int | |
| `name` | string | |
| `email` | string | |
| `phone` | string hoặc null | |
| `role` | string | `buyer`, `store`, `admin` |
| `status` | string | `active`, `locked` |
| `created_at` | ISO 8601 | |
| `store` | object hoặc null | **Chỉ có** khi `role = store`, trong `login` và `/auth/me`: `{ id, name, status }` |

**Không bao giờ** trả `password_hash` ra ngoài.

### Store

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | int | |
| `owner_id` | int | Chỉ trả cho chủ cửa hàng và admin |
| `name`, `address` | string | |
| `phone`, `description`, `image_url` | string hoặc null | |
| `latitude`, `longitude` | number hoặc null | |
| `status` | string | `pending`, `approved`, `locked` |
| `created_at` | ISO 8601 | |

### Listing

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id`, `store_id` | int | |
| `store` | object | `{ id, name, address, image_url, latitude, longitude }`, có trong API người mua và admin |
| `category` | object hoặc null | `{ id, name }` |
| `title` | string | |
| `description`, `image_url` | string hoặc null | |
| `original_price`, `sale_price` | int | Đồng |
| `discount_percent` | int | Tính khi trả về |
| `quantity` | int | Số suất ban đầu |
| `remaining` | int | Số suất còn lại |
| `booked` | int | Chỉ có trong `/stores/me/listings`: `quantity - remaining` |
| `pickup_start`, `pickup_end` | ISO 8601 | |
| `status` | string | `active`, `hidden`, `deleted` |
| `is_available` | boolean | `remaining > 0` và chưa quá `pickup_end` |
| `booking_opens_at` | ISO 8601 | Giờ bắt đầu cho phép đặt chỗ: `pickup_start` trừ `BOOKING_LEAD_MINUTES` phút |
| `is_booking_open` | boolean | `true` khi bây giờ đã tới `booking_opens_at` |
| `created_at` | ISO 8601 | |

### Order

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | int | |
| `quantity` | int | |
| `unit_price`, `total_price` | int | Đồng. `total_price = quantity * unit_price` |
| `pickup_code` | string | 6 ký tự |
| `status` | string | `pending`, `picked_up`, `cancelled`, `no_show` |
| `created_at`, `picked_up_at`, `cancelled_at` | ISO 8601 hoặc null | |
| `listing` | object | `{ id, title, image_url, pickup_start, pickup_end }` |
| `store` | object | `{ id, name, address, phone }` |
| `buyer` | object | `{ id, name, phone }`. **Chỉ có** khi người gọi là store hoặc admin |

### Category

`{ id, name, slug }`.

---

## 5. Quy tắc nghiệp vụ gắn với API

### 5.1 Hiển thị tin đăng

| Nơi hiển thị | Điều kiện |
|---|---|
| Danh sách công khai `GET /listings` | `l.status = 'active'` và `s.status = 'approved'` và `pickup_end > NOW()` và `remaining > 0` và đã tới giờ mở đặt (`pickup_start` trừ `BOOKING_LEAD_MINUTES` phút <= `NOW()`) |
| Chi tiết công khai `GET /listings/:id` | `l.status = 'active'` và `s.status = 'approved'` (không lọc hết hạn, hết suất) |
| Cửa hàng xem tin của mình | Mọi tin không `deleted` |
| Admin | Mọi tin, kể cả `deleted` |

Tin hết hạn **không có cột riêng**, chỉ so sánh `pickup_end` với thời điểm hiện tại khi truy vấn.

### 5.2 Chống bán lố

Điều kiện `remaining >= ?` nằm **ngay trong câu `UPDATE`**, nên khi hai người cùng đặt suất cuối, chỉ một câu `UPDATE` thành công (số dòng bị ảnh hưởng bằng 1), người còn lại nhận 0 dòng và bị trả `409`. Cột `remaining` không thể xuống âm (database còn có ràng buộc `CHECK`). Phải dùng transaction để việc trừ suất và tạo đơn hoặc cùng thành công, hoặc cùng bị huỷ.

### 5.3 Trạng thái đơn

```
                 ┌── buyer huỷ (trước pickup_end) ──> cancelled   (TRẢ suất lại)
pending ─────────┼── store nhập mã ────────────────> picked_up
                 └── store đánh dấu (sau pickup_end) -> no_show    (KHÔNG trả suất)
```

| Từ | Sang | Ai làm | Suất tồn kho |
|---|---|---|---|
| `pending` | `picked_up` | store, qua `confirm` | Giữ nguyên (đã bán) |
| `pending` | `cancelled` | buyer | **Cộng lại** `quantity` vào `remaining` |
| `pending` | `no_show` | **server tự động** (tác vụ chạy mỗi phút, đơn quá `pickup_end`), hoặc store bấm "Không đến" | Giữ nguyên (đồ ăn đã để dành cho khách) |

Sau `pickup_end`, cửa hàng **không** xác nhận nhận hàng được nữa (`confirm` trả `409`), và người mua cũng không huỷ được.
`picked_up`, `cancelled`, `no_show` là trạng thái cuối, **không đổi tiếp**.

### 5.4 Mã nhận hàng

- 6 ký tự lấy từ bộ `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (bỏ `0 O 1 I` để khỏi đọc nhầm).
- Sinh ngẫu nhiên, **không trùng** trên toàn hệ thống (cột `pickup_code` có ràng buộc `UNIQUE`). Nếu trùng thì sinh lại.
- Khi nhận mã từ người dùng: chuyển chữ hoa, bỏ khoảng trắng đầu cuối.

### 5.5 Phân quyền theo chủ sở hữu

Ngoài kiểm tra vai trò, mỗi thao tác sửa hoặc xem dữ liệu riêng tư phải kiểm tra **đúng chủ**:

- Người mua chỉ thấy, huỷ **đơn của mình**.
- Cửa hàng chỉ sửa tin và xử lý đơn của **cửa hàng mình**.
- Quên kiểm tra bước này là lỗi bảo mật phổ biến nhất: người dùng đổi `id` trên đường dẫn để xem hoặc sửa dữ liệu người khác.

### 5.6 Cửa hàng và tài khoản bị khoá

- Cửa hàng `pending` hoặc `locked` không đăng tin được (`403`).
- Cửa hàng `locked` làm mọi tin của nó biến khỏi tìm kiếm công khai.
- Tài khoản `locked` không đăng nhập được.

---

## 6. Luồng demo từ đầu đến cuối

Luồng này khớp kịch bản demo trước giảng viên. Dùng nó để kiểm thử bằng Postman.

| Bước | Ai | API | Kết quả |
|---|---|---|---|
| 1 | Cửa hàng | `POST /auth/register` với `role = store` | Có token, `user.store = null` |
| 2 | Cửa hàng | `POST /stores` | Cửa hàng ở trạng thái `pending` |
| 3 | Admin | `POST /auth/login`, `GET /admin/stores?status=pending` | Thấy cửa hàng chờ duyệt |
| 4 | Admin | `PATCH /admin/stores/3/status` với `approved` | Cửa hàng được duyệt |
| 5 | Cửa hàng | `POST /uploads/image` rồi `POST /listings` (3 suất, giờ nhận 20:00 đến 21:30) | Tin xuất hiện, `remaining = quantity` |
| 6 | Người mua | `POST /auth/register`, `GET /listings?max_price=30000&sort=price_asc` | Thấy suất vừa đăng |
| 7 | Người mua | `GET /listings/15`, `POST /orders` | Có `pickup_code`, `remaining` giảm |
| 8 | Cửa hàng | `GET /stores/me/orders?status=pending` | Thấy đơn mới |
| 9 | Cửa hàng | `POST /stores/me/orders/confirm` với `pickup_code` | Đơn thành `picked_up` |
| 10 | Admin | `GET /admin/stats` | `meals_saved` tăng đúng số suất vừa nhận |

**Bước 7 kiểm thử chống bán lố:** tạo tin chỉ có 1 suất, cho hai tài khoản người mua gửi `POST /orders` gần như cùng lúc. Kết quả đúng là một bên `201`, một bên `409`, và `remaining` bằng 0 (không bao giờ âm).

Ví dụ gọi bằng `curl`:

```bash
# Đăng nhập, lấy token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"an.nguyen@example.com","password":"matkhau123"}'

# Đặt chỗ (thay <token> bằng token nhận được ở trên)
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"listing_id":15,"quantity":2}'
```

---

## 7. Hướng dẫn sử dụng cho từng vị trí

### Dùng Postman

1. Tạo một **Environment** có biến `base_url` = `http://localhost:5000/api` và biến `token`.
2. Mọi yêu cầu dùng `{{base_url}}/...`, ở tab Authorization chọn **Bearer Token** và điền `{{token}}`.
3. Ở yêu cầu đăng nhập, thêm đoạn kịch bản (tab Tests) để tự lưu token:
   ```js
   pm.environment.set("token", pm.response.json().data.token);
   ```
4. Xuất cả collection thành file `docs/lastbite.postman_collection.json` để cả nhóm dùng chung.

### Việc cần làm theo vị trí

| Vị trí | Việc liên quan đến tài liệu này |
|---|---|
| **VT1** | Giữ tài liệu này đúng với code, hoàn thành nhóm Auth trước **16/10**, `GET /listings` bản đầu trước **18/10**, nhóm Orders trước **23/10**. Bổ sung file route cho `categories`, `uploads`, `favorites`, `notifications`. Mở rộng `errorHandler` để trả `errors[]` cho lỗi 400 và đổi lỗi của multer thành 400. Đặt múi giờ Việt Nam cho MySQL và Node.js |
| **VT2** | Dùng các JSON mẫu trong mục 3 làm mock data. Bọc lời gọi API trong `client/src/api/`. Xử lý 401 bằng cách đăng xuất, 403 bằng thông báo "không đủ quyền", 409 bằng cách hiện `message` cho người dùng. Hiển thị ảnh bằng `VITE_API_URL` bỏ đuôi `/api` nối với `image_url` |
| **VT3** | Phụ trách mục 3.4 (tải ảnh), 3.6 (tin đăng), 3.7 (cửa hàng). Chú ý quy tắc kiểm tra chủ sở hữu và quy tắc đổi `quantity` khi sửa tin |
| **VT4** | Phụ trách mục 3.10 đến 3.13 (yêu thích, đánh giá, thông báo, admin). Dùng tài liệu này viết bảng test case: mỗi API có ít nhất một trường hợp thành công và một trường hợp lỗi (401, 403, 404 hoặc 409) |

### Khi cần thay đổi API

1. Người cần đổi nhắn trong nhóm, nêu rõ API nào, đổi gì, vì sao.
2. VT1 sửa file này (tạo Pull Request riêng).
3. Chỉ sau khi PR được merge, hai phía mới sửa code theo. Ghi vào bảng dưới.

### Nhật ký thay đổi

| Ngày | Thay đổi | Người sửa |
|---|---|---|
| 15/10/2026 | Bản v1 đầu tiên | VT1 |
| 27/10/2026 | Quy tắc giờ "cuối ngày": đăng tin chỉ trong ngày hôm nay; người mua chỉ đặt trong `BOOKING_LEAD_MINUTES` phút trước giờ nhận (thêm `booking_opens_at`, `is_booking_open`); tự động chuyển đơn quá giờ sang `no_show`; `confirm` bị chặn sau `pickup_end` | VT1 |
