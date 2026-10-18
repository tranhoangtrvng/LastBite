// Tin đăng suất ăn.
// Công khai (VT1): GET /api/listings (tìm kiếm, lọc), GET /api/listings/:id
// Cửa hàng (VT3): POST/PUT/DELETE /api/listings, upload ảnh bằng multer
// QUY TẮC: đường dẫn cố định (vd /mine) phải khai báo TRƯỚC '/:id', nếu không Express sẽ hiểu "mine" là id.
const router = require('express').Router();
const { getListings, getListingById } = require('../controllers/listings.controller');

router.get('/', getListings);
router.get('/:id', getListingById);

// VT3 sẽ thay phần dưới bằng POST / PUT / DELETE thật.
router.all('*', (req, res) => res.status(501).json({ success: false, message: 'Chưa triển khai: listings' }));

module.exports = router;
