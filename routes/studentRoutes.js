const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtpAndRegister } = require('../controllers/studentController');
const  upload  = require('../middlewares/multer');

router.post('/send-otp', sendOtp);
router.post('/register', upload.single('profilePicture'), verifyOtpAndRegister);

module.exports = router;
