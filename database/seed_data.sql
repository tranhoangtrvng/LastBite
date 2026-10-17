-- =========================================================================
-- FILE: test_orders.sql
-- Mô tả: Dữ liệu đơn hàng mẫu phục vụ test luồng nhận hàng và Dashboard
-- =========================================================================

-- Tạo tài khoản khách hàng mẫu
INSERT OR IGNORE INTO USERS (id, email, name, password_hash, role, status, created_at, updated_at) VALUES
(8, 'buyer.lastbite@gmail.com', 'Nguyễn Văn A (Khách hàng)', 'hash_pass_123', 'buyer', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Đơn 1: Đặt Cơm Gà Zòn 185 (Mã LB-9482, Trạng thái: Chờ nhận)
-- Dùng để test: Nhập mã LB-9482 vào form để kiểm tra nút "Xác nhận mã"
INSERT OR IGNORE INTO ORDERS (id, buyer_id, pickup_code, total_price, status, created_at, updated_at) VALUES
(1, 8, 'LB-9482', 25000, 'Chờ nhận', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO ORDER_ITEMS (id, order_id, listing_id, quantity, unit_price) VALUES
(1, 1, 7, 1, 25000);

-- Đơn 2: Đã nhận tại Bánh Mì Tuấn Khang (Trạng thái: Đã nhận, tiền 20.000đ)
-- Dùng để test: API Dashboard tự tính COUNT = 1 suất và SUM = 20.000 VNĐ
INSERT OR IGNORE INTO ORDERS (id, buyer_id, pickup_code, total_price, status, created_at, updated_at) VALUES
(2, 8, 'LB-1001', 20000, 'Đã nhận', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO ORDER_ITEMS (id, order_id, listing_id, quantity, unit_price) VALUES
(2, 2, 1, 1, 20000);