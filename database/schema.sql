-- =====================================================================
--  LastBite - Cứu đồ ăn cuối ngày
--  File: database/schema.sql   (MySQL 8.4.11)
--
--  Cách chạy:
--    mysql -u root -p < database/schema.sql
--  hoặc mở file này trong MySQL Workbench / phpMyAdmin (tab SQL) rồi chạy.
--
--  Chạy lại nhiều lần an toàn (CREATE ... IF NOT EXISTS), không xoá dữ liệu.
--  Muốn làm lại từ đầu trên máy mình:  DROP DATABASE lastbite;  rồi chạy lại file.
--
--  Mức ưu tiên:  P0 = bắt buộc | P1 = nên có | P2 = nếu còn thời gian
--  Bảng P0: users, stores, categories, listings, orders
--  Bảng P1: favorites      Bảng P2: reviews, notifications
-- =====================================================================

CREATE DATABASE IF NOT EXISTS lastbite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lastbite;

-- Bắt buộc dùng UTF-8 khi nạp tiếng Việt (tên loại món bên dưới), bất kể máy cài MySQL mặc định gì.
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. users : tài khoản của cả 3 vai trò (người mua, cửa hàng, admin)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,                       -- băm bcrypt, KHÔNG lưu mật khẩu thô
  phone         VARCHAR(20)  NULL,
  role          ENUM('buyer','store','admin') NOT NULL DEFAULT 'buyer',
  status        ENUM('active','locked')       NOT NULL DEFAULT 'active',  -- admin khoá/mở
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. stores : cửa hàng (mỗi tài khoản role 'store' có tối đa 1 cửa hàng)
--    Cửa hàng đăng ký -> 'pending' -> admin duyệt -> 'approved' / khoá 'locked'
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_id    INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  address     VARCHAR(255) NOT NULL,
  phone       VARCHAR(20)  NULL,
  description TEXT         NULL,
  image_url   VARCHAR(255) NULL,                             -- ảnh đại diện / logo quán
  latitude    DECIMAL(9,6) NULL,                             -- toạ độ cho bản đồ (P1)
  longitude   DECIMAL(9,6) NULL,
  status      ENUM('pending','approved','locked') NOT NULL DEFAULT 'pending',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stores_owner (owner_id),
  KEY idx_stores_status (status),
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. categories : loại món, dùng cho bộ lọc "loại món" của người mua
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id   SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  slug VARCHAR(60) NOT NULL,
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. listings : tin đăng suất đồ ăn cuối ngày
--    - quantity  : số suất ban đầu
--    - remaining : số suất còn lại (bị trừ trong transaction đặt chỗ)
--    - Tin hết hạn KHÔNG cần cột riêng: lọc bằng pickup_end > NOW() khi truy vấn
--    - "Xoá" tin = đổi status = 'deleted' (xoá mềm) vì đơn cũ còn tham chiếu tin này
--    - Giá lưu số nguyên, đơn vị đồng (VND)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  store_id       INT UNSIGNED      NOT NULL,
  category_id    SMALLINT UNSIGNED NULL,
  title          VARCHAR(150) NOT NULL,
  description    TEXT         NULL,
  image_url      VARCHAR(255) NULL,
  original_price INT UNSIGNED NOT NULL,                      -- giá gốc
  sale_price     INT UNSIGNED NOT NULL,                      -- giá cứu
  quantity       INT UNSIGNED NOT NULL,
  remaining      INT UNSIGNED NOT NULL,
  pickup_start   DATETIME NOT NULL,                          -- bắt đầu khung giờ nhận
  pickup_end     DATETIME NOT NULL,                          -- kết thúc khung giờ nhận
  status         ENUM('active','hidden','deleted') NOT NULL DEFAULT 'active',  -- hidden: admin ẩn tin vi phạm
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_listings_store (store_id),
  KEY idx_listings_category (category_id),
  KEY idx_listings_search (status, pickup_end, remaining),   -- truy vấn trang chủ
  KEY idx_listings_price (sale_price),
  CONSTRAINT fk_listings_store FOREIGN KEY (store_id) REFERENCES stores(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_listings_category FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_listings_price     CHECK (sale_price <= original_price),
  CONSTRAINT chk_listings_remaining CHECK (remaining <= quantity),
  CONSTRAINT chk_listings_pickup    CHECK (pickup_end > pickup_start)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. orders : đơn đặt chỗ. Thanh toán tại quầy khi nhận hàng.
--    - pickup_code : mã nhận 6 ký tự, không trùng
--    - Trạng thái : pending (chờ nhận) -> picked_up (đã nhận)
--                   hoặc cancelled (đã huỷ) / no_show (không đến)
--    - unit_price  : giá cứu tại thời điểm đặt (tin sửa giá sau này không đổi đơn cũ)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buyer_id     INT UNSIGNED NOT NULL,
  listing_id   INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  unit_price   INT UNSIGNED NOT NULL,
  total_price  INT UNSIGNED NOT NULL,                        -- = quantity * unit_price
  pickup_code  CHAR(6) NOT NULL,
  status       ENUM('pending','picked_up','cancelled','no_show') NOT NULL DEFAULT 'pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  picked_up_at DATETIME NULL,                                -- lúc cửa hàng xác nhận đã nhận
  cancelled_at DATETIME NULL,                                -- lúc người mua huỷ
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orders_pickup_code (pickup_code),
  KEY idx_orders_buyer (buyer_id, created_at),               -- lịch sử đơn của người mua
  KEY idx_orders_listing_status (listing_id, status),        -- đơn của cửa hàng theo trạng thái
  KEY idx_orders_status (status),                            -- thống kê "số suất đã cứu"
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_listing FOREIGN KEY (listing_id) REFERENCES listings(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_orders_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. favorites (P1) : người mua yêu thích cửa hàng
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  user_id    INT UNSIGNED NOT NULL,
  store_id   INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, store_id),
  KEY idx_favorites_store (store_id),
  CONSTRAINT fk_favorites_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_favorites_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. reviews (P2) : đánh giá sau khi đã nhận hàng (mỗi đơn tối đa 1 đánh giá)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  comment    VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reviews_order (order_id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. notifications (P2) : thông báo trong web (đơn mới, sắp hết giờ nhận...)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(150) NOT NULL,
  content    VARCHAR(500) NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user (user_id, is_read, created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. password_resets : mã đặt lại mật khẩu khi QUÊN mật khẩu
--    POST /auth/forgot-password tạo mã, POST /auth/reset-password dùng mã.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,                 -- băm bcrypt của mã 6 số, KHÔNG lưu mã thô
  expires_at DATETIME NOT NULL,                     -- hết hạn sau 15 phút
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- số lần nhập sai (tối đa 5)
  used_at    DATETIME NULL,                         -- đã dùng hoặc đã bị thay bằng mã mới
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_password_resets_user (user_id, used_at, expires_at),
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Dữ liệu tham chiếu: các loại món (cần có sẵn cho bộ lọc và form đăng tin)
-- Chạy lại nhiều lần không bị trùng nhờ INSERT IGNORE.
-- Dữ liệu mẫu khác (tài khoản, cửa hàng, tin đăng) nằm trong database/seed.sql
-- ---------------------------------------------------------------------
INSERT IGNORE INTO categories (name, slug) VALUES
  ('Bánh ngọt và bánh mì', 'banh'),
  ('Cơm và món chính',     'com-mon-chinh'),
  ('Đồ uống',              'do-uong'),
  ('Ăn vặt',               'an-vat'),
  ('Đồ tiện lợi',          'tien-loi'),
  ('Túi bất ngờ',          'tui-bat-ngo');
