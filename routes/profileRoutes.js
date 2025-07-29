// routes/profile.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/multer');
const { getProfile, updateProfile } = require('../controllers/profileController');


router.put('/', verifyToken, upload.single('profile_picture'), updateProfile);

router.get('/', verifyToken, getProfile);
  
module.exports = router;
