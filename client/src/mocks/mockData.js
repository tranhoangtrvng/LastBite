export const MOCK_FOODS = [
  {
    id: 1,
    title: 'Cơm gà nướng sốt tiêu đen',
    storeName: 'Cơm Gà Bà Năm',
    address: '123 Chùa Láng, Đống Đa',
    originalPrice: 45000,
    discountPrice: 20000,
    quantity: 3,
    pickupTimeRange: '20:30 - 21:30',
    category: 'Cơm',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    description: 'Suất cơm đùi gà nướng mật ong kèm xà lách, dưa leo. Đồ ăn chế biến trong ngày đảm bảo vệ sinh an toàn thực phẩm.'
  },
  {
    id: 2,
    title: 'Bánh mì chảo đặc biệt',
    storeName: 'Bánh Mì Chảo 35',
    address: '35 Thái Hà, Đống Đa',
    originalPrice: 40000,
    discountPrice: 20000,
    quantity: 2,
    pickupTimeRange: '20:00 - 21:00',
    category: 'Bánh mì',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    description: 'Bánh mì giòn kèm pate cột đèn, xúc xích và trứng ốp la sốt cà chua đậm đà.'
  },
  {
    id: 3,
    title: 'Bún bò Huế thập cẩm',
    storeName: 'Bún Bò O Oanh',
    address: '88 Nguyễn Chí Thanh',
    originalPrice: 50000,
    discountPrice: 25000,
    quantity: 1,
    pickupTimeRange: '21:00 - 22:00',
    category: 'Bún/Phở',
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
    description: 'Bún sợi to kèm nạm bò mềm, chả cua và nước dùng thơm mùi sả ruốc chuẩn vị Huế.'
  },
  {
    id: 4,
    title: 'Trà sữa trân châu hoàng kim',
    storeName: 'Tiệm Trà Toco',
    address: '12 Chùa Láng',
    originalPrice: 35000,
    discountPrice: 15000,
    quantity: 5,
    pickupTimeRange: '21:30 - 22:30',
    category: 'Trà sữa',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b37cf5a4f783?w=600&auto=format&fit=crop&q=80',
    description: 'Trà sữa đậm vị trà lài nguyên bản kèm sẵn một phần trân châu dẻo.'
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'LB-9482',
    foodId: 1,
    title: 'Cơm gà nướng sốt tiêu đen',
    storeName: 'Cơm Gà Bà Năm',
    address: '123 Chùa Láng, Đống Đa, Hà Nội',
    phone: '0987.654.321',
    originalPrice: 45000,
    discountPrice: 20000,
    quantity: 2,
    totalPrice: 40000,
    pickupTimeRange: '20:30 - 21:30 (Hôm nay)',
    status: 'PENDING',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'LB-7123',
    foodId: 2,
    title: 'Bánh mì chảo đặc biệt',
    storeName: 'Bánh Mì Chảo 35',
    address: '35 Thái Hà, Đống Đa, Hà Nội',
    phone: '0912.345.678',
    originalPrice: 40000,
    discountPrice: 20000,
    quantity: 1,
    totalPrice: 20000,
    pickupTimeRange: '19:00 - 20:00 (Hôm qua)',
    status: 'COMPLETED',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&auto=format&fit=crop&q=80'
  }
];