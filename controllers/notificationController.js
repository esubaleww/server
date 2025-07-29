const db = require("../config/db");

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await db.query(
      `SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`UPDATE notifications SET is_read = true WHERE id = ?`, [
      id,
    ]);
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

// Count unread notifications
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const [result] = await db.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE student_id = ? AND is_read = false`,
      [userId]
    );
    res.json({ count: result[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to count unread notifications" });
  }
};
