# LastBite

Website kết nối **cửa hàng còn đồ ăn cuối ngày** với **sinh viên và người đi làm** muốn mua món ngon giá rẻ.
Cửa hàng đăng suất ăn còn dư và khung giờ nhận, người mua đặt giữ chỗ, đến quầy đọc mã 6 ký tự và thanh toán trực tiếp.

Đề tài bài tập lớn nhóm 4 người. Hạn nộp: **01/11/2026**.

## Ba vai trò

| Vai trò | Làm được gì |
|---|---|
| Người mua (`buyer`) | Tìm và lọc suất ăn, đặt giữ chỗ, xem và huỷ đơn của mình |
| Cửa hàng (`store`) | Đăng ký cửa hàng, chờ admin duyệt, đăng / sửa / xoá suất ăn, xác nhận khách đã nhận |
| Quản trị (`admin`) | Duyệt hoặc khoá cửa hàng, quản lý người dùng (module admin do VT4 đang làm; trong lúc chờ, duyệt cửa hàng bằng SQL: `UPDATE stores SET status = 'approved' WHERE id = ...;`) |

## Công nghệ

- **Frontend** (`client/`): React 19, Vite, Tailwind CSS 3, react-router-dom 7, axios, react-hook-form
- **Backend** (`server/`): Node.js, Express 4, mysql2, JWT, bcrypt, multer
- **Cơ sở dữ liệu**: MySQL (chỉ dùng MySQL)
- Chạy hoàn toàn trên máy cá nhân (local), không triển khai lên mạng.

## Cần cài sẵn

- Node.js 20 trở lên
- MySQL 8.x (đang dùng 8.4)

## Cách chạy trên máy (Windows PowerShell)

### Bước 1. Tạo cơ sở dữ liệu và nạp dữ liệu mẫu

Chạy ở thư mục gốc của dự án. PowerShell không dùng được dấu `<`, nên dùng lệnh `source`:

```powershell
mysql -u root -p -e "source database/schema.sql"
mysql -u root -p lastbite -e "source database/seed.sql"
```

Muốn các tin mẫu có ảnh riêng, chạy thêm (sau `seed.sql`): `mysql -u root -p lastbite -e "source database/seed_images.sql"`.

`schema.sql` chạy lại nhiều lần vẫn an toàn. `seed.sql` **xoá sạch dữ liệu rồi nạp lại**, chỉ dùng khi dev hoặc demo.
Khung giờ nhận của tin mẫu là 20:00 - 21:30 trong ngày chạy seed, nên **hãy chạy lại seed ngay trước buổi demo** để các tin còn hạn.

> **Ngày 28/10 có thêm bảng `password_resets`:** máy nào đã có database cũ thì chạy lại `schema.sql` một lần (an toàn, không xoá dữ liệu): `mysql -u root -p -e "source database/schema.sql"`. File `seed.sql` cũng tự tạo bảng này nếu thiếu.
>
> **Quên mật khẩu:** gọi `POST /api/auth/forgot-password`, mã 6 số hiện ở **cửa sổ backend** (dự án chưa gửi email thật), rồi dùng `POST /api/auth/reset-password`.
>
> **Giới hạn đăng nhập sai:** sai mật khẩu 5 lần với cùng một email thì bị khoá đăng nhập 15 phút (mã 429); một máy sai quá 30 lần / 15 phút cũng bị khoá.
>
> **Giới hạn 2 đơn chờ:** mỗi người mua giữ tối đa 2 đơn "chờ nhận" cùng lúc. Sau khi chạy seed, `buyer.lastbite@gmail.com` có 1 đơn chờ (đặt thêm được 1), còn `ha.lastbite@gmail.com` có sẵn 5 đơn chờ nên sẽ bị chặn, dùng để demo luật này.

> **Quy tắc giờ "cuối ngày":** cửa hàng chỉ đăng suất nhận hàng trong ngày hôm nay, và người mua chỉ thấy / đặt được suất trong khoảng `BOOKING_LEAD_MINUTES` phút trước giờ bắt đầu nhận (mặc định 120 phút = 2 tiếng). Vì tin mẫu bắt đầu nhận từ 19:00 - 20:30, nếu demo **ban ngày** mà không thấy món nào thì mở `server/.env`, thêm dòng `BOOKING_LEAD_MINUTES=1440`, rồi chạy lại backend. Đơn quá giờ nhận được server tự chuyển sang "Không đến" mỗi phút.

### Bước 2. Chạy backend (cổng 5000)

```powershell
cd server
copy .env.example .env
# mở file .env, điền DB_USER, DB_PASSWORD (mật khẩu MySQL của bạn) và JWT_SECRET (một chuỗi bí mật bất kỳ)
npm install
npm run dev
```

Kiểm tra: mở http://localhost:5000/api/health, thấy `success: true` là backend đã chạy.
File `.env` chứa mật khẩu nên **không được commit** (đã nằm trong `.gitignore`).

### Bước 3. Chạy frontend (cổng 5173)

Mở cửa sổ PowerShell thứ hai:

```powershell
cd client
npm install
npm run dev
```

Mở http://localhost:5173. Nếu backend chạy ở cổng khác, tạo file `client/.env` với dòng
`VITE_API_URL=http://localhost:<cổng>/api`.

## Chạy demo (buổi trình bày)

**Trước buổi trình bày 1 ngày**
1. Chọn **laptop chính** và **laptop dự phòng**; cả hai pull nhánh `main` mới nhất, chạy `npm install` ở `server` và `client`.
2. Trên cả hai máy, mở `server/.env` và kiểm tra có `BOOKING_LEAD_MINUTES=1440` (để món hiện suốt cả ngày khi trình bày ban ngày).
3. Chạy bộ kiểm thử (xem mục *Kiểm thử tự động*), phải ra `KẾT QUẢ: .../... đạt`.
4. Quay video dự phòng toàn bộ kịch bản demo.

**Ngay trước khi trình bày (khoảng 15 phút)**
1. Bật MySQL. Ở thư mục gốc dự án, nạp lại dữ liệu demo bằng một lệnh (tự sao lưu database cũ vào `database/backups/` trước):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\demo-reset.ps1
   ```
   Dữ liệu mẫu có giờ nhận theo **ngày chạy lệnh**, nên phải chạy lại vào đúng ngày trình bày.
2. Mở 2 cửa sổ PowerShell: `cd server` → `npm run dev` và `cd client` → `npm run dev`. Mở http://localhost:5173.
3. Đăng nhập sẵn 3 vai trò ở 3 cửa sổ trình duyệt (cửa sổ ẩn danh cho từng vai trò), đặt cửa sổ backend cạnh trình duyệt (để thấy mã quên mật khẩu).

**Kịch bản gợi ý (khoảng 7 phút)**
1. Người mua `buyer.lastbite@gmail.com`: tìm, lọc, xem chi tiết (đếm ngược), đặt 1 suất → nhận mã 6 ký tự.
2. Cửa hàng `tuankhang76@gmail.com`: thấy đơn mới, nhập mã → "Đã nhận"; xem dashboard.
3. Người mua đặt thêm → bị chặn ở đơn chờ thứ 3 (giới hạn 2 đơn); hoặc dùng `ha.lastbite@gmail.com` (đã có sẵn 5 đơn chờ).
4. Admin `admin@lastbite.vn`: thống kê "suất đã cứu", duyệt/khoá cửa hàng.
5. Quên mật khẩu: mã 6 số hiện ở cửa sổ backend.

**Sự cố thường gặp**

| Hiện tượng | Cách xử lý |
|---|---|
| "Không tải được danh sách suất ăn" | Backend chưa chạy hoặc đã tắt |
| Danh sách trống | Chưa chạy `demo-reset.ps1` hôm nay, hoặc thiếu `BOOKING_LEAD_MINUTES=1440` |
| `EADDRINUSE :5000` | Còn bản backend cũ đang chạy ở cửa sổ khác, tắt đi rồi chạy lại |
| Đăng nhập báo "nhập sai quá 5 lần" | Đợi 15 phút, hoặc gõ `rs` ở cửa sổ backend (bộ đếm nằm trong bộ nhớ server) |
| Database hỏng giữa buổi | Chạy lại `demo-reset.ps1`; hoặc nạp bản sao lưu cùng ngày: `mysql -u root -p lastbite -e "source database/backups/<tên-file>.sql"` |

## Kiểm thử tự động

Bộ kiểm thử nằm trong `server/tests/` (35 phép thử): đăng nhập và phân quyền, tìm kiếm, đặt chỗ, giới hạn 2 đơn chờ, huỷ trả suất, xác nhận mã, thông báo, quên mật khẩu, giới hạn đăng nhập sai (429) và **chống bán lố khi 20 người đặt cùng lúc**.

```powershell
# cửa sổ 1: backend đang chạy (npm run dev); cửa sổ 2:
cd server
npm test
```

Kiểm thử tự tạo tài khoản và tin thử ("Test LastBite", "[TEST] ...") rồi **tự dọn sạch** khi xong, không ảnh hưởng dữ liệu demo. Chạy nên trước 23:45 (tin thử phải nằm trong ngày). Chạy quá khoảng 4 lần trong 15 phút thì gõ `rs` ở cửa sổ backend để xoá bộ đếm đăng nhập sai.

## Tài khoản dùng thử (sau khi chạy seed)

Mọi tài khoản dùng chung mật khẩu **`Demo@123`**. Đăng nhập bằng **email**.

| Vai trò | Email |
|---|---|
| Người mua | `buyer.lastbite@gmail.com`, `ha.lastbite@gmail.com` |
| Cửa hàng (đã duyệt) | `tuankhang76@gmail.com`, `banhminuong102@gmail.com`, `pastrami48@gmail.com`, `donerneu@gmail.com`, `kimbapbk@gmail.com`, `comsuon183@gmail.com`, `comgazon185@gmail.com` |
| Admin | `admin@lastbite.vn` |

## Cấu trúc thư mục

```text
LastBite/
├── client/                  Giao diện (React + Vite)
│   └── src/
│       ├── api/             Gọi backend (axiosClient, authApi, listingApi, orderApi, storeApi, categoryApi)
│       ├── components/      common/ (dùng chung, gồm Toast thông báo) và store/ (form + danh sách tin của cửa hàng)
│       ├── context/         AuthContext (đăng nhập, lưu token)
│       ├── layouts/         BuyerLayout, StoreLayout
│       ├── pages/           auth/, buyer/, store/
│       ├── routes/          ProtectedRoute (chặn trang theo đăng nhập và vai trò)
│       └── utils/           format.js (tiền, ngày giờ, đếm ngược), mappers.js (đổi dữ liệu API sang dữ liệu giao diện), useNow / useRefreshOnFocus (đồng hồ chạy, tự tải lại)
├── server/                  Backend (Express)
│   ├── seed-images/         Ảnh của dữ liệu mẫu (có trong Git)
│   ├── uploads/             Ảnh người dùng tải lên (không đưa lên Git)
│   └── src/
│       ├── config/          Kết nối MySQL
│       ├── controllers/     Xử lý nghiệp vụ
│       ├── middlewares/     Xác thực, phân quyền, upload, xử lý lỗi, giới hạn đăng nhập sai (rateLimit.js)
│       ├── routes/          Định nghĩa đường dẫn API
│       ├── jobs/            Tác vụ nền (mỗi phút đổi đơn quá giờ nhận sang "không đến")
│       └── utils/           Hàm dùng chung (định dạng dữ liệu, mã nhận hàng, phân trang, quy tắc giờ timeRules.js)
│   └── tests/               Kiểm thử tự động (npm test)
├── scripts/
│   └── demo-reset.ps1       Sao lưu + nạp lại dữ liệu demo bằng một lệnh
├── database/
│   ├── schema.sql           Tạo database và các bảng
│   ├── seed.sql             Dữ liệu mẫu để demo và test
│   └── seed_images.sql      Gán ảnh riêng cho các tin mẫu (chạy sau seed.sql)
└── docs/
    └── api.md               Tài liệu API (hợp đồng giữa frontend và backend)
```

## Tài liệu API

Toàn bộ API nằm trong [`docs/api.md`](docs/api.md): định dạng phản hồi, mã lỗi, phân trang, quyền truy cập và từng endpoint.
Khi cần đổi API, **sửa `docs/api.md` trước** rồi báo cả nhóm.

## Quy trình làm việc của nhóm

- Họp nhóm **21:00 mỗi thứ Bảy**. Công việc và tiến độ theo dõi trên **Notion**.
- Mỗi người làm trên nhánh riêng, mở Pull Request vào **`fix/fixed-develop`** (nhánh tích hợp) và chờ người khác review trước khi gộp. Trước khi bấm Merge: pull về máy, chạy `npm test`, mở thử giao diện.
- Bản cuối cùng: mở **một** Pull Request từ `fix/fixed-develop` vào `main` (xem hướng dẫn trong lần bàn giao), không đẩy thẳng lên `main`.
- Không commit `.env` và `node_modules`.

Mốc thời gian: demo nội bộ **24/10**, chốt tính năng (Feature Freeze) **28/10**, nộp bài **01/11/2026**.
