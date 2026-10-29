-- =====================================================================
--  LastBite - Gán ảnh riêng cho các tin mẫu bổ sung (id 8-24)
--  File: database/seed_images.sql
--
--  CHẠY SAU seed.sql:   mysql -u root -p lastbite < database/seed_images.sql
--  (hoặc mở trong MySQL Workbench và bấm Execute)
--
--  - KHÔNG sửa seed.sql, KHÔNG đụng tin id 1-7 (ảnh gốc của TV3).
--  - Chỉ đổi cột image_url của listings id 8-24.
--  - Ảnh đặt trong server/seed-images/ (được phục vụ tại /uploads/<tên-file>).
--  - Nếu một file ảnh chưa có, giao diện tự hiện ảnh mặc định, không lỗi.
--  - Chạy lại seed.sql sẽ xoá các ảnh này (seed.sql có TRUNCATE), khi đó chạy lại file này.
-- =====================================================================

USE lastbite;

-- Các tin đang hiển thị trên trang người mua (id 8-16): ảnh riêng cho từng món
UPDATE listings SET image_url = '/uploads/extra_banh_mi_pate.jpg'          WHERE id = 8;   -- Bánh mì pate thịt nguội
UPDATE listings SET image_url = '/uploads/extra_xien_thit_nuong.jpg'       WHERE id = 9;   -- Xiên thịt nướng (5 xiên)
UPDATE listings SET image_url = '/uploads/extra_banh_mi_pastrami_mini.jpg' WHERE id = 10;  -- Bánh mì Pastrami mini
UPDATE listings SET image_url = '/uploads/extra_doner_kebab_hop.jpg'       WHERE id = 11;  -- Doner Kebab hộp thịt
UPDATE listings SET image_url = '/uploads/extra_kimbap_ca_ngu.jpg'         WHERE id = 12;  -- Kimbap cá ngừ mayo
UPDATE listings SET image_url = '/uploads/extra_tteokbokki_coc.jpg'        WHERE id = 13;  -- Tteokbokki cốc
UPDATE listings SET image_url = '/uploads/extra_com_suon_bi_cha.jpg'       WHERE id = 14;  -- Cơm sườn bì chả
UPDATE listings SET image_url = '/uploads/extra_com_ga_mat_ong.jpg'        WHERE id = 15;  -- Cơm gà sốt mật ong
UPDATE listings SET image_url = '/uploads/extra_combo_ga_chien.jpg'        WHERE id = 16;  -- Combo gà chiên 3 miếng

-- Các tin dùng để test (hết suất, hết giờ, bị ẩn, đã xoá, tin cũ): dùng lại ảnh phía trên
-- hoặc ảnh gốc của TV3 cho món tương tự.
UPDATE listings SET image_url = '/uploads/doner_kebab.jpeg'                WHERE id = 17;  -- Doner Kebab cuộn
UPDATE listings SET image_url = '/uploads/extra_banh_mi_pate.jpg'          WHERE id IN (18, 21);  -- bánh mì chả cá, thập cẩm
UPDATE listings SET image_url = '/uploads/banh_mi_nuong_mat_ong.webp'      WHERE id = 19;  -- bánh mì bơ nướng phô mai
UPDATE listings SET image_url = '/uploads/extra_com_suon_bi_cha.jpg'       WHERE id IN (20, 23);  -- cơm sườn
UPDATE listings SET image_url = '/uploads/extra_com_ga_mat_ong.jpg'        WHERE id = 22;  -- cơm gà tiêu đen
UPDATE listings SET image_url = '/uploads/extra_kimbap_ca_ngu.jpg'         WHERE id = 24;  -- kimbap chiên
