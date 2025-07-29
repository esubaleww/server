const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require("../controllers/notificationController");
const { verifyToken } = require("../middlewares/auth"); // Import your middleware

// Apply verifyToken to all notification routes
router.use(verifyToken);

router.get("/", getNotifications);
router.get("/count", getUnreadCount);
router.put("/read/:id", markAsRead);

module.exports = router;
