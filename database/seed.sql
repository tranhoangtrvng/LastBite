-- =====================================================================
--  LastBite - Cứu đồ ăn cuối ngày
--  File: database/seed.sql   (MySQL 8.4)
--  Dữ liệu gốc: 7 quán thật + 7 tin có ảnh + 2 đơn test do TV3 gửi,
--  được chuyển sang đúng schema.sql (MySQL) và bổ sung thêm dữ liệu test.
--
--  Cách chạy (sau khi đã chạy schema.sql):
--    mysql -u root -p lastbite < database/seed.sql
--
--  LƯU Ý:
--  - File XOÁ SẠCH dữ liệu các bảng (trừ categories) rồi nạp lại.
--    CHỈ dùng trên máy dev / môi trường demo.
--  - Mọi tài khoản dùng chung mật khẩu:  Demo@123   (đã băm bcrypt)
--  - Khung giờ nhận của các tin chuẩn là 20:00-21:30. Nếu chạy seed sau 21:30
--    thì tự dời sang ngày mai để tin vẫn còn hạn.
--
--  Tài khoản (id giữ nguyên như file của TV3):
--    id 1-7  Chủ quán (role store, 7 quán đều đã duyệt = approved)
--            tuankhang76@gmail.com, banhminuong102@gmail.com, pastrami48@gmail.com,
--            donerneu@gmail.com, kimbapbk@gmail.com, comsuon183@gmail.com,
--            comgazon185@gmail.com
--    id 8    Người mua  buyer.lastbite@gmail.com   (Nguyễn Văn A)
--    id 9    Admin      admin@lastbite.vn
--    id 10   Người mua  ha.lastbite@gmail.com      (Lê Thu Hà)
--
--  Đơn test của TV3:
--    Mã LB9482 (Cơm Gà Zòn 185, Chờ nhận)  -> test nhập mã xác nhận
--    Mã LB1001 (Bánh Mì Tuấn Khang, Đã nhận) -> test dashboard
--
--  Tình huống test có sẵn:
--    - Hết suất: tin 17 | Đã qua giờ nhận: tin 18
--    - Admin ẩn: tin 19 | Cửa hàng xoá mềm: tin 20
--    - Tin cũ (lịch sử đơn, thống kê theo tuần): tin 21-24
--    - Đơn đủ 4 trạng thái; remaining đã khớp với đơn (đơn huỷ trả lại suất)
-- =====================================================================

USE lastbite;

SET NAMES utf8mb4;
-- Bảng mã quên mật khẩu (thêm ngày 28/10). Tạo ở đây nữa để máy chưa chạy lại schema.sql vẫn nạp seed được;
-- định nghĩa phải GIỐNG HỆT trong schema.sql.
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

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE password_resets;
TRUNCATE TABLE notifications;
TRUNCATE TABLE reviews;
TRUNCATE TABLE favorites;
TRUNCATE TABLE orders;
TRUNCATE TABLE listings;
TRUNCATE TABLE stores;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Bánh ngọt và bánh mì', 'banh'),
  ('Cơm và món chính',     'com-mon-chinh'),
  ('Đồ uống',              'do-uong'),
  ('Ăn vặt',               'an-vat'),
  ('Đồ tiện lợi',          'tien-loi'),
  ('Túi bất ngờ',          'tui-bat-ngo');

-- Mật khẩu chung 'Demo@123' (bcrypt)
SET @pw := '$2b$12$2COAlKniTt3PaNpOPQHy3O9UQNcV.8WNJ3ux8GYNdgOSC/FBJjque';

-- Ngày áp dụng cho khung giờ nhận chuẩn: hôm nay, hoặc ngày mai nếu đã quá 21:30
SET @d := IF(CURTIME() >= '21:30:00', CURDATE() + INTERVAL 1 DAY, CURDATE());

-- Map loại món của TV3 sang categories trong schema:
--   Cơm -> com-mon-chinh | Bánh mì -> banh | Đồ ăn vặt -> an-vat
SET @c_banh := (SELECT id FROM categories WHERE slug = 'banh');
SET @c_com_mon_chinh := (SELECT id FROM categories WHERE slug = 'com-mon-chinh');
SET @c_an_vat := (SELECT id FROM categories WHERE slug = 'an-vat');

-- 1. users (10 tài khoản)
INSERT INTO users (id, name, email, password_hash, phone, role, status) VALUES
  (1, 'Chủ quán Tuấn Khang', 'tuankhang76@gmail.com', @pw, '0912345601', 'store', 'active'),
  (2, 'Chủ quán Bánh Mì Khâm Thiên', 'banhminuong102@gmail.com', @pw, '0912345602', 'store', 'active'),
  (3, 'Chủ tiệm Pastrami Tây Hồ', 'pastrami48@gmail.com', @pw, '0912345603', 'store', 'active'),
  (4, 'Chủ quán Doner Kebab NEU', 'donerneu@gmail.com', @pw, '0912345604', 'store', 'active'),
  (5, 'Chủ tiệm Kimbap Nguyễn Hiền', 'kimbapbk@gmail.com', @pw, '0912345605', 'store', 'active'),
  (6, 'Chủ quán Cơm Sườn 183', 'comsuon183@gmail.com', @pw, '0912345606', 'store', 'active'),
  (7, 'Chủ quán Cơm Gà Zòn 185', 'comgazon185@gmail.com', @pw, '0912345607', 'store', 'active'),
  (8, 'Nguyễn Văn A (Khách hàng)', 'buyer.lastbite@gmail.com', @pw, '0912345608', 'buyer', 'active'),
  (9, 'Admin LastBite', 'admin@lastbite.vn', @pw, '0912345609', 'admin', 'active'),
  (10, 'Lê Thu Hà', 'ha.lastbite@gmail.com', @pw, '0912345610', 'buyer', 'active');

-- 2. stores (7 quán của TV3 kèm toạ độ thực tế cho bản đồ VT2)
INSERT INTO stores (id, owner_id, name, address, phone, description, latitude, longitude, status) VALUES
  (1, 1, 'Bánh Mì Tuấn Khang', '76 Bạch Mai, Hai Bà Trưng, Hà Nội', '0912345601', 'Chuyên bánh mì kẹp thịt và xúc xích nướng gia truyền Bạch Mai.', 21.006520, 105.850510, 'approved'),
  (2, 2, 'Bánh Mì Bơ Nướng Mật Ong', '102 Khâm Thiên, Đống Đa, Hà Nội', '0912345602', 'Bánh mì nướng bơ mật ong kèm xiên que thơm lừng phục vụ đêm.', 21.018930, 105.836540, 'approved'),
  (3, 3, 'Pastrami Tây Hồ Deli', '48 Đ. Tây Hồ, Tây Hồ, Hà Nội', '0912345603', 'Tiệm bánh mì phong cách New York với món bò muối Pastrami trứ danh.', 21.060120, 105.823650, 'approved'),
  (4, 4, 'Doner Kebab NEU', 'Cổng KTX ĐH Kinh Tế Quốc Dân, Trần Đại Nghĩa, HBT, Hà Nội', '0912345604', 'Bánh mì tam giác Kebab Thổ Nhĩ Kỳ sốt tỏi của sinh viên NEU.', 21.000780, 105.842710, 'approved'),
  (5, 5, 'Kimbap Phố Bách Khoa', '101-K10A Nguyễn Hiền, Bách Khoa, HBT, Hà Nội', '0912345605', 'Ẩm thực Hàn Quốc giá sinh viên ngay trung tâm Bách Khoa.', 21.004820, 105.845890, 'approved'),
  (6, 6, 'Cơm Sườn Đêm 183', 'Số 1 Ngõ 183 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', '0912345606', 'Cơm tấm sườn nướng than hoa nóng hổi, xả món cứu trợ cuối ca tối.', 20.999510, 105.843150, 'approved'),
  (7, 7, 'Cơm Gà Zòn 185', '185 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', '0912345607', 'Thương hiệu cơm gà chiên giòn sốt cay quen thuộc đường Trần Đại Nghĩa.', 20.999230, 105.843020, 'approved');

-- 3. listings (24 tin). Tin 1-7 là dữ liệu và ảnh của TV3; tin 8-24 là tin bổ sung để test
INSERT INTO listings (id, store_id, category_id, title, description, image_url, original_price, sale_price, quantity, remaining, pickup_start, pickup_end, status, created_at) VALUES
  (1, 1, @c_banh, 'Bánh mì xúc xích nướng sốt cay', 'Bánh mì giòn nóng, kẹp xúc xích nướng, xà lách, dưa chuột và sốt mayo.', '/uploads/banh_mi_tuan_khang_1.jpeg', 35000, 20000, 3, 1, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (2, 2, @c_banh, 'Set bánh mì nướng bơ mật ong + xiên thịt', 'Bánh mì quết bơ mật ong giòn rụm kèm xiên thịt nướng đậm đà.', '/uploads/banh_mi_nuong_mat_ong.webp', 30000, 15000, 3, 2, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (3, 3, @c_banh, 'Sandwich Pastrami bò muối áp chảo', 'Bánh mì sandwich kẹp nhiều lớp thịt bò muối hun khói cùng bắp cải chua.', '/uploads/pastrami.avif', 85000, 45000, 3, 2, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (4, 4, @c_banh, 'Bánh mì Doner Kebab Thổ Nhĩ Kỳ', 'Bánh mì tam giác kẹp thịt nướng xiên quay, bắp cải tím và sốt tỏi thơm ngậy.', '/uploads/doner_kebab.jpeg', 35000, 20000, 3, 2, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (5, 5, @c_an_vat, 'Kimbap thịt lợn ướp Bulgogi', 'Cuộn kimbap rong biển nhân thịt lợn ướp đậm vị, củ cải vàng, trứng chiên.', '/uploads/kimbap_thit_uop.jpg', 40000, 20000, 3, 1, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (6, 6, @c_com_mon_chinh, 'Cơm tấm sườn nướng kèm chả trứng', 'Suất cơm sườn nướng than hoa, trứng ốp la lòng đào, chả trứng và dưa góp.', '/uploads/com_suon.jpeg', 45000, 25000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (7, 7, @c_com_mon_chinh, 'Cơm đùi gà chiên giòn rụm sốt cay', 'Đùi gà chiên giòn rụm sốt cay ngọt, cơm nghệ vàng và canh rau nóng hổi.', '/uploads/com_ga_zon.webp', 45000, 25000, 3, 1, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (8, 1, @c_banh, 'Bánh mì pate thịt nguội', 'Bánh mì pate, thịt nguội, đồ chua, ăn kèm tương ớt.', NULL, 25000, 12000, 3, 3, TIMESTAMP(@d, '19:00:00'), TIMESTAMP(@d, '21:00:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (9, 2, @c_an_vat, 'Xiên thịt nướng (5 xiên)', 'Xiên thịt nướng tẩm sa tế, nướng lại khi nhận.', NULL, 30000, 15000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (10, 3, @c_banh, 'Bánh mì Pastrami mini', 'Phiên bản nhỏ của sandwich Pastrami, vừa một người ăn nhẹ.', NULL, 55000, 28000, 3, 3, TIMESTAMP(@d, '20:30:00'), TIMESTAMP(@d, '22:00:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (11, 4, @c_com_mon_chinh, 'Doner Kebab hộp thịt', 'Thịt Doner nướng xiên quay ăn kèm rau và sốt tỏi, dạng hộp.', NULL, 40000, 22000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (12, 5, @c_an_vat, 'Kimbap cá ngừ mayo', 'Kimbap nhân cá ngừ sốt mayo, dưa chuột, trứng chiên.', NULL, 38000, 19000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (13, 5, @c_an_vat, 'Tteokbokki cốc', 'Bánh gạo cay Hàn Quốc đóng cốc, cay vừa.', NULL, 35000, 18000, 3, 3, TIMESTAMP(@d, '19:00:00'), TIMESTAMP(@d, '21:00:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (14, 6, @c_com_mon_chinh, 'Cơm sườn bì chả', 'Cơm tấm sườn nướng, bì, chả trứng, nước mắm chua ngọt.', NULL, 40000, 22000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (15, 7, @c_com_mon_chinh, 'Cơm gà sốt mật ong', 'Gà chiên giòn sốt mật ong, cơm trắng, dưa góp.', NULL, 45000, 25000, 3, 2, TIMESTAMP(@d, '20:30:00'), TIMESTAMP(@d, '22:00:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (16, 7, @c_com_mon_chinh, 'Combo gà chiên 3 miếng', '3 miếng gà chiên giòn sốt cay, ăn kèm khoai tây.', NULL, 60000, 32000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (17, 4, @c_banh, 'Bánh mì Doner Kebab cuộn', 'Đã hết suất (dùng test tin hết suất).', NULL, 38000, 21000, 3, 0, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'active', NOW() - INTERVAL 6 HOUR),
  (18, 1, @c_banh, 'Bánh mì chả cá', 'Đã qua giờ nhận (dùng test tin tự ẩn).', NULL, 30000, 15000, 3, 1, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 1 HOUR, 'active', NOW() - INTERVAL 10 HOUR),
  (19, 2, @c_banh, 'Bánh mì bơ nướng phô mai', 'Tin bị admin ẩn (dùng test chức năng ẩn tin vi phạm).', NULL, 35000, 18000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'hidden', NOW() - INTERVAL 6 HOUR),
  (20, 6, @c_com_mon_chinh, 'Cơm sườn nướng đặc biệt', 'Tin cửa hàng đã xoá (xoá mềm), không hiển thị.', NULL, 50000, 28000, 3, 3, TIMESTAMP(@d, '20:00:00'), TIMESTAMP(@d, '21:30:00'), 'deleted', NOW() - INTERVAL 6 HOUR),
  (21, 1, @c_banh, 'Bánh mì thập cẩm', 'Tin cũ đã kết thúc, dùng cho lịch sử đơn.', NULL, 30000, 15000, 3, 0, NOW() - INTERVAL 28 HOUR, NOW() - INTERVAL 26 HOUR, 'active', NOW() - INTERVAL 40 HOUR),
  (22, 7, @c_com_mon_chinh, 'Cơm gà sốt tiêu đen', 'Tin cũ đã kết thúc, dùng cho lịch sử đơn.', NULL, 45000, 25000, 3, 1, NOW() - INTERVAL 76 HOUR, NOW() - INTERVAL 74 HOUR, 'active', NOW() - INTERVAL 90 HOUR),
  (23, 6, @c_com_mon_chinh, 'Cơm sườn trứng', 'Tin cũ đã kết thúc, dùng cho lịch sử đơn.', NULL, 42000, 24000, 3, 2, NOW() - INTERVAL 124 HOUR, NOW() - INTERVAL 122 HOUR, 'active', NOW() - INTERVAL 140 HOUR),
  (24, 5, @c_an_vat, 'Kimbap chiên giòn', 'Tin cũ đã kết thúc, dùng cho lịch sử đơn.', NULL, 36000, 18000, 3, 0, NOW() - INTERVAL 52 HOUR, NOW() - INTERVAL 50 HOUR, 'active', NOW() - INTERVAL 65 HOUR);

-- 4. orders (22 đơn). Đơn 1-2 là của TV3. Mã nhận 6 ký tự (LB-9482 -> LB9482 cho khớp CHAR(6))
INSERT INTO orders (id, buyer_id, listing_id, quantity, unit_price, total_price, pickup_code, status, created_at, picked_up_at, cancelled_at) VALUES
  (1, 8, 7, 1, 25000, 25000, 'LB9482', 'pending', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (2, 8, 1, 1, 20000, 20000, 'LB1001', 'picked_up', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, NULL),
  (3, 10, 1, 1, 20000, 20000, 'DMT9TX', 'pending', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (4, 10, 2, 1, 15000, 15000, '69D7H7', 'pending', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (5, 8, 3, 1, 45000, 45000, 'WWUQ4V', 'picked_up', NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 30 MINUTE, NULL), -- đơn 5 và 11 đã nhận: người mua chính chỉ còn 1 đơn chờ (giới hạn 2 đơn chờ)
  (6, 10, 5, 2, 20000, 40000, 'U5233S', 'pending', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (7, 8, 6, 1, 25000, 25000, '33VRHA', 'cancelled', NOW() - INTERVAL 2 HOUR, NULL, NOW() - INTERVAL 1 HOUR),
  (8, 10, 7, 1, 25000, 25000, 'WCDK5D', 'pending', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (9, 8, 4, 1, 20000, 20000, 'RA57YS', 'picked_up', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, NULL),
  (10, 10, 15, 1, 25000, 25000, 'YMGPJN', 'picked_up', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR, NULL),
  (11, 8, 17, 2, 21000, 42000, '8N4P2T', 'picked_up', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 90 MINUTE, NULL), -- như đơn 5
  (12, 10, 17, 1, 21000, 21000, 'XC2MCU', 'pending', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (13, 8, 18, 1, 15000, 15000, 'UKKRE7', 'picked_up', NOW() - INTERVAL 6 HOUR, NOW() - INTERVAL 5 HOUR, NULL),
  (14, 10, 18, 1, 15000, 15000, 'XZZVKA', 'no_show', NOW() - INTERVAL 5 HOUR, NULL, NULL),
  (15, 8, 21, 1, 15000, 15000, '6ZNNRQ', 'picked_up', NOW() - INTERVAL 36 HOUR, NOW() - INTERVAL 35 HOUR, NULL),
  (16, 10, 21, 2, 15000, 30000, 'CP7VUS', 'picked_up', NOW() - INTERVAL 34 HOUR, NOW() - INTERVAL 33 HOUR, NULL),
  (17, 8, 22, 1, 25000, 25000, '6DQT43', 'picked_up', NOW() - INTERVAL 84 HOUR, NOW() - INTERVAL 83 HOUR, NULL),
  (18, 10, 22, 1, 25000, 25000, '6W7SP8', 'no_show', NOW() - INTERVAL 82 HOUR, NULL, NULL),
  (19, 10, 23, 1, 24000, 24000, 'TJ6QV8', 'picked_up', NOW() - INTERVAL 132 HOUR, NOW() - INTERVAL 131 HOUR, NULL),
  (20, 8, 23, 1, 24000, 24000, 'STT4AV', 'cancelled', NOW() - INTERVAL 130 HOUR, NULL, NOW() - INTERVAL 129 HOUR),
  (21, 8, 24, 2, 18000, 36000, 'H3E5B9', 'picked_up', NOW() - INTERVAL 58 HOUR, NOW() - INTERVAL 57 HOUR, NULL),
  (22, 10, 24, 1, 18000, 18000, 'ZT7YDZ', 'picked_up', NOW() - INTERVAL 56 HOUR, NOW() - INTERVAL 55 HOUR, NULL);

-- 5. favorites (P1), reviews (P2, chỉ cho đơn đã nhận), notifications (P2)
INSERT INTO favorites (user_id, store_id) VALUES
  (8, 1),
  (8, 6),
  (10, 7),
  (10, 5);

INSERT INTO reviews (order_id, rating, comment) VALUES
  (2, 5, 'Bánh mì nóng giòn, giá rất rẻ, sẽ ủng hộ tiếp!'),
  (9, 4, 'Kebab ngon, lấy hàng nhanh.'),
  (10, 5, 'Cơm gà giòn, đáng tiền.');

INSERT INTO notifications (user_id, title, content, is_read) VALUES
  (7, 'Có đơn đặt mới', 'Khách Nguyễn Văn A vừa đặt 1 suất Cơm đùi gà chiên giòn rụm sốt cay.', 0),
  (8, 'Đặt chỗ thành công', 'Mã nhận hàng đã sẵn sàng, hãy đến lấy trong khung giờ quy định.', 0);



-- ---------------------------------------------------------------------
-- TUỲ CHỌN: muốn test duyệt/khoá cửa hàng và khoá người mua, bỏ comment 3 dòng dưới
-- (mặc định để nguyên 7 quán đã duyệt cho khớp dữ liệu TV3)
-- ---------------------------------------------------------------------
-- UPDATE stores SET status = 'pending' WHERE id = 5;   -- Kimbap: chờ duyệt
-- UPDATE stores SET status = 'locked'  WHERE id = 6;   -- Cơm Sườn 183: bị khoá
-- UPDATE users  SET status = 'locked'  WHERE id = 10;  -- người mua bị khoá

-- ---------------------------------------------------------------------
-- Kiểm tra nhanh sau khi chạy
-- ---------------------------------------------------------------------
-- SELECT role, status, COUNT(*) FROM users GROUP BY role, status;
-- SELECT status, COUNT(*) FROM stores GROUP BY status;
-- SELECT status, COUNT(*) FROM orders GROUP BY status;
-- SELECT SUM(quantity) AS saved_meals FROM orders WHERE status = 'picked_up';
