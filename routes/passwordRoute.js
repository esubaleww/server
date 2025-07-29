const express = require('express');
const router = express.Router();
const {  
  forgotPassword,
  resetPassword
} = require('../controllers/passwordController');

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
