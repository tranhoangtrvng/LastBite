-- =========================================================================
-- FILE: seed_data.sql
-- Mô tả: Dữ liệu mẫu 7 quán ăn & món khảo sát theo đúng ERD LastBite
-- Người thực hiện: Trần A Ngọc (TV3) gửi TV4
-- Thứ tự nạp: CATEGORIES -> USERS -> STORES -> LISTINGS
-- =========================================================================

-- 1. BẢNG CATEGORIES (Danh mục món ăn)
INSERT OR IGNORE INTO CATEGORIES (id, name) VALUES 
(1, 'Cơm'),
(2, 'Bánh mì'),
(3, 'Đồ ăn vặt'),
(4, 'Bún / Phở');

-- 2. BẢNG USERS (Tạo tài khoản chủ quán cho 7 quán)
INSERT OR IGNORE INTO USERS (id, email, name, password_hash, role, status, created_at, updated_at) VALUES
(1, 'tuankhang76@gmail.com', 'Chủ quán Tuấn Khang', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'banhminuong102@gmail.com', 'Chủ quán Bánh Mì Khâm Thiên', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'pastrami48@gmail.com', 'Chủ tiệm Pastrami Tây Hồ', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'donerneu@gmail.com', 'Chủ quán Doner Kebab NEU', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'kimbapbk@gmail.com', 'Chủ tiệm Kimbap Nguyễn Hiền', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'comsuon183@gmail.com', 'Chủ quán Cơm Sườn 183', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'comgazon185@gmail.com', 'Chủ quán Cơm Gà Zòn 185', 'hash_pass_123', 'store', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. BẢNG STORES (Thông tin chi tiết 7 quán ăn thực tế)
INSERT OR IGNORE INTO STORES (id, owner_id, name, address, phone, description, status, created_at, updated_at) VALUES
(1, 1, 'Bánh Mì Tuấn Khang', '76 Bạch Mai, Hai Bà Trưng, Hà Nội', '0912345601', 'Chuyên bánh mì kẹp thịt và xúc xích nướng gia truyền Bạch Mai.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 'Bánh Mì Bơ Nướng Mật Ong', '102 Khâm Thiên, Đống Đa, Hà Nội', '0912345602', 'Bánh mì nướng bơ mật ong kèm xiên que thơm lừng phục vụ đêm.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 3, 'Pastrami Tây Hồ Deli', '48 Đ. Tây Hồ, Tây Hồ, Hà Nội', '0912345603', 'Tiệm bánh mì phong cách New York với món bò muối Pastrami trứ danh.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 4, 'Doner Kebab NEU', 'Cổng KTX ĐH Kinh Tế Quốc Dân, Trần Đại Nghĩa, HBT, Hà Nội', '0912345604', 'Bánh mì tam giác Kebab Thổ Nhĩ Kỳ sốt tỏi của sinh viên NEU.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 5, 'Kimbap Phố Bách Khoa', '101-K10A Nguyễn Hiền, Bách Khoa, HBT, Hà Nội', '0912345605', 'Ẩm thực Hàn Quốc giá sinh viên ngay trung tâm Bách Khoa.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 6, 'Cơm Sườn Đêm 183', 'Số 1 Ngõ 183 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', '0912345606', 'Cơm tấm sườn nướng than hoa nóng hổi, xả món cứu trợ cuối ca tối.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 7, 'Cơm Gà Zòn 185', '185 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội', '0912345607', 'Thương hiệu cơm gà chiên giòn sốt cay quen thuộc đường Trần Đại Nghĩa.', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. BẢNG LISTINGS (Khớp chính xác tên và đuôi file ảnh trong folder uploads)
INSERT OR IGNORE INTO LISTINGS (id, store_id, category_id, title, description, image_url, original_price, sale_price, quantity, remaining, pickup_start, pickup_end, status, created_at, updated_at) VALUES
(1, 1, 2, 'Bánh mì xúc xích nướng sốt cay', 'Bánh mì giòn nóng, kẹp xúc xích nướng, xà lách, dưa chuột và sốt mayo.', '/uploads/banh_mi_tuan_khang_1.jpeg', 35000, 20000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 2, 'Set bánh mì nướng bơ mật ong + xiên thịt', 'Bánh mì quết bơ mật ong giòn rụm kèm xiên thịt nướng đậm đà.', '/uploads/banh_mi_nuong_mat_ong.webp', 30000, 15000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 3, 2, 'Sandwich Pastrami bò muối áp chảo', 'Bánh mì sandwich kẹp nhiều lớp thịt bò muối hun khói cùng bắp cải chua.', '/uploads/pastrami.avif', 85000, 45000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 4, 2, 'Bánh mì Doner Kebab Thổ Nhĩ Kỳ', 'Bánh mì tam giác kẹp thịt nướng xiên quay, bắp cải tím và sốt tỏi thơm ngậy.', '/uploads/doner_kebab.jpeg', 35000, 20000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 5, 3, 'Kimbap thịt lợn ướp Bulgogi', 'Cuộn kimbap rong biển nhân thịt lợn ướp đậm vị, củ cải vàng, trứng chiên.', '/uploads/kimbap_thit_uop.jpg', 40000, 20000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 6, 1, 'Cơm tấm sườn nướng kèm chả trứng', 'Suất cơm sườn nướng than hoa, trứng ốp la lòng đào, chả trứng và dưa góp.', '/uploads/com_suon.jpeg', 45000, 25000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 7, 1, 'Cơm đùi gà chiên giòn rụm sốt cay', 'Đùi gà chiên giòn rụm sốt cay ngọt, cơm nghệ vàng và canh rau nóng hổi.', '/uploads/com_ga_zon.webp', 45000, 25000, 3, 3, '20:00:00', '21:30:00', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);