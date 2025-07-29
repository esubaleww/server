const express = require('express');
const router = express.Router();
const path = require('path');
const { getLatestLostItems, searchLostItems, reportLostItem, updateLostItemStatus,
getAllLostItems} = require('../controllers/lostItemController');
const  upload  = require('../middlewares/multer');

router.post('/lost_items', upload.single('image_url'), reportLostItem);
router.get('/lost_items/latest', getLatestLostItems);
router.get('/lost_items/search', searchLostItems);
router.get('/lost_items/all', getAllLostItems);
router.put('/lost_items/:id/status', updateLostItemStatus);



module.exports = router;
