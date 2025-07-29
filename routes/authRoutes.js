const express = require('express');
const router = express.Router();
const {loginUser}  = require('../controllers/loginController'); // Import the controller

// Login route
router.post('/login', loginUser);

module.exports = router;
