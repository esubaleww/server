const express = require("express");
const router = express.Router();
const {
  createClaim,
  getClaimsByItem,
  updateClaimStatus,
  getAcceptedClaim,
} = require("../controllers/claimController");
const { verifyToken } = require("../middlewares/auth");

// POST a new claim
router.post("/", createClaim);

// GET claims for an item
router.get("/:itemId", verifyToken, getClaimsByItem);

router.get("/accepted", verifyToken, getAcceptedClaim);

// UPDATE claim status
router.put("/:id", verifyToken, updateClaimStatus);

module.exports = router;
