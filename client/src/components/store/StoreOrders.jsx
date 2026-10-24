import React, { useState, useEffect } from 'react';

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State lưu trữ mã xác nhận đang nhập cho từng đơn hàng (dùng order ID làm key)
  const [pickupCodes, setPickupCodes] = useState({});

  // 1. Lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/store');
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Xử lý khi chủ quán nhập mã vào ô text
  const handleCodeChange = (orderId, value) => {
    setPickupCodes(prev => ({
      ...prev,
      [orderId]: value
    }));
  };

  // 3. Xử lý gửi mã xác nhận lên API
  const handleConfirmOrder = async (orderId) => {
    const code = pickupCodes[orderId];
    if (!code) {
      alert('Vui lòng nhập mã xác nhận!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pickup_code: code })
      });
      
      const result = await response.json();

      if (result.success) {
        alert('Xác nhận thành công!');
        // Xóa ô input đã nhập
        setPickupCodes(prev => ({ ...prev, [orderId]: '' }));
        // Tải lại danh sách đơn hàng để cập nhật trạng thái
        fetchOrders();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (err) {
      alert('Đã xảy ra lỗi khi xác nhận đơn hàng.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Đang tải danh sách đơn hàng...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Đơn hàng (Cửa hàng)</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 border-b">
              <th className="p-4">Mã Đơn</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Món ăn</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">Chưa có đơn hàng nào.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">#{order.id}</td>
                  <td className="p-4">
                    <p className="font-semibold text-gray-800">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.customer_phone}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-800">{order.food_name}</p>
                    <p className="text-sm text-gray-500">SL: {order.quantity}</p>
                  </td>
                  <td className="p-4 font-semibold text-red-500">
                    {order.total_price.toLocaleString()} đ
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'picked_up' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status === 'pending' ? 'Chờ nhận' :
                        order.status === 'picked_up' ? 'Đã nhận' :
                        order.status === 'cancelled' ? 'Đã hủy' : 'Không đến'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center items-center gap-2">
                    {order.status === 'pending' ? (
                      <>
                        <input
                          type="text"
                          maxLength="6"
                          placeholder="Mã 6 ký tự"
                          value={pickupCodes[order.id] || ''}
                          onChange={(e) => handleCodeChange(order.id, e.target.value)}
                          className="w-28 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        />
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                        >
                          Xác nhận
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Không khả dụng</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Vị trí đúng của lệnh export là ở dưới cùng file
export default StoreOrders;