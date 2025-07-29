// DELETE Found Item
const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.delete("/found_items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM notifications WHERE item_id = ?", [id]);
    await db.execute("DELETE FROM messages WHERE claim_id = ?", [id]);
    await db.execute("DELETE FROM claim_requests WHERE item_id = ?", [id]);
    await db.query("DELETE FROM found_items WHERE id = ?", [id]);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error("Error deleting found item:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE Lost Item
router.delete("/lost_items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute("DELETE FROM notifications WHERE item_id = ?", [id]);
    await db.execute("DELETE FROM messages WHERE claim_id = ?", [id]);
    await db.execute("DELETE FROM claim_requests WHERE item_id = ?", [id]);
    await db.query("DELETE FROM lost_items WHERE id = ?", [id]);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error("Error deleting lost item:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
