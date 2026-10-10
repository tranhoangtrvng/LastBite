# LastBite - Cứu đồ ăn cuối ngày

> Website kết nối **cửa hàng còn đồ ăn cuối ngày** với **sinh viên và người đi làm** muốn mua giá rẻ.

Bài tập lớn môn **Lập trình Web** 

---

## 1. Giới thiệu

Cuối ngày, quán bánh, tiệm cơm, trà sữa thường còn dư đồ ăn, trong khi nhiều bạn trẻ muốn ăn ngon với giá mềm. LastBite cho phép cửa hàng đăng các suất đồ ăn giảm giá; người mua đặt trước và đến lấy trong khung giờ quy định. Cửa hàng bớt lãng phí, người mua tiết kiệm tiền.

**Luồng chính:**

```
Cửa hàng đăng suất ăn -> Người mua tìm, đặt chỗ, nhận mã -> Cửa hàng nhập mã xác nhận -> Admin duyệt và theo dõi
```

## 2. Chức năng

| Vai trò | Chức năng bắt buộc (P0) | Nếu còn thời gian (P1/P2) |
|---|---|---|
| **Chung** | Đăng ký, đăng nhập, phân quyền 3 vai trò, hồ sơ cá nhân | Quên mật khẩu |
| **Người mua** | Xem danh sách suất, tìm kiếm và lọc (giá, loại món, giờ nhận), xem chi tiết, đặt chỗ, xem mã nhận, lịch sử đơn, huỷ đơn | Bản đồ, yêu thích, đánh giá, mã QR |
| **Cửa hàng** | Đăng ký (chờ duyệt), thêm/sửa/xoá tin đăng kèm ảnh, danh sách đơn, nhập mã xác nhận đã nhận | Dashboard doanh thu, nhân bản tin cũ |
| **Admin** | Duyệt/khoá cửa hàng, quản lý người dùng và tin đăng, thống kê "số suất đã cứu" | Biểu đồ theo tuần, thông báo |

### Quy tắc nghiệp vụ

- Thanh toán **tại quầy** khi nhận hàng.
- Mã nhận hàng là chuỗi **6 ký tự**.
- Đặt chỗ dùng **transaction** để không bán quá số suất còn lại.
- Tin đăng tự ẩn khi qua giờ nhận hoặc hết suất.
- Trạng thái đơn: `Chờ nhận` -> `Đã nhận` / `Đã huỷ` / `Không đến`.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, Vite, React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express, JWT, bcrypt, multer |
| Cơ sở dữ liệu | MySQL |
| Công cụ | Git/GitHub, Trello, Figma, Postman |
| Triển khai | Vercel (frontend), Render/Railway (backend + DB) |

## 4. Cấu trúc thư mục

```
lastbite/
├── client/              # Frontend (React + Vite)
│   └── src/
│       ├── api/         # Axios instance, hàm gọi API
│       ├── components/  # Component dùng chung (Button, Card, Modal, Toast)
│       ├── context/     # AuthContext
│       ├── layouts/     # BuyerLayout, StoreLayout, AdminLayout
│       ├── pages/
│       │   ├── auth/    # Đăng nhập, đăng ký
│       │   ├── buyer/   # Giao diện người mua
│       │   ├── store/   # Giao diện cửa hàng
│       │   └── admin/   # Giao diện admin
│       ├── routes/      # ProtectedRoute theo vai trò
│       └── utils/       # Định dạng tiền, ngày giờ
├── server/              # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/ # Xác thực JWT, phân quyền, xử lý lỗi
│   │   └── config/
│   └── uploads/         # Ảnh tải lên (không đưa lên Git)
├── database/
│   ├── schema.sql       # Tạo bảng
│   └── seed.sql         # Dữ liệu mẫu
├── docs/
│   ├── api.md           # Tài liệu API
│   └── screenshots/     # Ảnh chụp màn hình cho slide
└── README.md
```

## 5. Hướng dẫn cài đặt

### Yêu cầu

- [Node.js](https://nodejs.org) (bản LTS) và npm
- [Git](https://git-scm.com)
- [MySQL](https://www.mysql.com)

### Bước 1: Tải mã nguồn

```bash
git clone https://github.com/<ten-tai-khoan>/lastbite.git
cd lastbite
git checkout develop
```

### Bước 2: Tạo cơ sở dữ liệu

1. Tạo một database trống tên `lastbite`.
2. Chạy lần lượt hai file:
   - `database/schema.sql` (tạo bảng)
   - `database/seed.sql` (dữ liệu mẫu)

### Bước 3: Cấu hình và chạy Backend

```bash
cd server
cp .env.example .env      # rồi mở .env và điền giá trị thật
npm install
npm run dev
```

Kiểm tra backend chạy được: mở `http://localhost:5000/api/health`.

### Bước 4: Cấu hình và chạy Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

### Biến môi trường

**`server/.env`**

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=lastbite
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

**`client/.env`**

```env
VITE_API_URL=http://localhost:5000/api
```

> **Quan trọng:** không đưa file `.env` lên Git. Chỉ commit file mẫu `.env.example` (không chứa giá trị thật).

## 6. Tài khoản demo

> Điền sau khi `seed.sql` hoàn thành. Chỉ dùng cho môi trường demo.

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `........` | `........` |
| Cửa hàng | `........` | `........` |
| Người mua | `........` | `........` |

## 7. Quy tắc làm việc nhóm

### Quy tắc Git

- Nhánh `main`: bản ổn định để nộp/demo. 
- Nhánh `develop`: nhánh tích hợp chung.
- Nhánh làm việc: `feature/ten-tinh-nang` (ví dụ `feature/login-page`), sửa lỗi dùng `fix/ten-loi`.
- **Cấm push trực tiếp lên `main` và `develop`.** Luôn tạo nhánh riêng và mở Pull Request.
- Mỗi Pull Request cần **ít nhất 1 người review** trước khi merge. PR nên nhỏ, review trong vòng 24 giờ.
- Review chéo theo vòng: VT1 -> VT2 -> VT3 -> VT4 -> VT1.

### Quy ước commit

Viết ngắn gọn, bắt đầu bằng loại thay đổi:

```
feat: thêm trang đăng nhập
fix: sửa lỗi trừ tồn kho khi đặt chỗ
docs: cập nhật tài liệu API
style: chỉnh giao diện thẻ suất ăn
refactor: tách hàm định dạng tiền
```

### Quy trình làm một việc

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ten-tinh-nang
# ... code ...
git add .
git commit -m "feat: mô tả ngắn"
git push origin feature/ten-tinh-nang
# Lên GitHub, mở Pull Request vào develop, gắn người review
```

### Một việc được coi là xong khi

- Chạy được, không lỗi console.
- Đã merge vào `develop`.
- Xử lý được trường hợp rỗng và lỗi.
- Có người khác đã thử.
- **Đã có ảnh chụp màn hình** (đặt tên `MODULE-số_tên.png`, lưu ở `docs/screenshots/`).

## 8. Phân công thành viên

| Vị trí | Họ tên | Nhiệm vụ chính |
|---|---|---|
| **VT1** Trưởng nhóm, Backend Lead, DevOps | `Trần Hoàng Trung` | ERD, API, xác thực/phân quyền, đặt chỗ có transaction, deploy, điều phối, review PR |
| **VT2** Frontend Lead, UI/UX | `Hoàng Hải Anh` | Wireframe, design system, giao diện người mua, responsive |
| **VT3** Full-stack module Cửa hàng | `Trần Anh Ngọc` | Đăng ký cửa hàng, CRUD tin đăng, upload ảnh, quản lý đơn, nhập mã, dữ liệu demo |
| **VT4** Full-stack module Admin, QA, slide | `Trần Ngọc Linh` | Trang admin, thống kê, seed data, test case, slide, video demo |


## 9. Tài liệu liên quan

- Tài liệu API: [`docs/api.md`](docs/api.md)
- Sơ đồ ERD: `docs/erd.png`
- Ảnh chụp màn hình: [`docs/screenshots/`](docs/screenshots/)
- Bảng công việc: `<dán link Trello>`
- Thiết kế Figma: `<dán link Figma>`
- Bản deploy: `<dán link khi có>`

---

*LastBite - mỗi suất ăn được cứu là một chút lãng phí được tránh.*
