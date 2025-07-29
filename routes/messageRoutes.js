const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getChatDetailsFromClaim,
} = require("../controllers/messageController");
const { verifyToken } = require("../middlewares/auth");

router.post("/", verifyToken, sendMessage); // Send message
router.get("/:claimId", verifyToken, getMessages); // Get all messages for a claim
router.get("/claim/:claimId", verifyToken, getChatDetailsFromClaim); // Get chat details for a claim

module.exports = router;
