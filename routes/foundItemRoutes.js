const express = require('express');
const router = express.Router();
const { getLatestFoundItems, searchFoundItems, reportFoundItem,
   getAllFoundItems, updateFoundItemStatus} = require('../controllers/foundItemController');
const upload = require('../middlewares/multer');

router.post('/found_items', upload.single('image_url'), reportFoundItem);
router.get('/found_items/latest', getLatestFoundItems);   
router.get('/found_items/search', searchFoundItems);
router.get('/found_items/all', getAllFoundItems);     
router.put('/found_items/:id/status', updateFoundItemStatus);

module.exports = router;
