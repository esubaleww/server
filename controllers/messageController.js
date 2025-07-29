const db = require("../config/db");

// Send a new message
exports.sendMessage = async (req, res) => {
  const sender_id = req.user.id;
  const { receiver_id, claim_id, content, tempId } = req.body;

  if (!receiver_id || !claim_id || !content) {
    return res.status(400).json({
      error: "All fields (receiver_id, claim_id, content) are required.",
    });
  }

  if (sender_id === receiver_id) {
    return res.status(400).json({ error: "You cannot message yourself." });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO messages (sender_id, receiver_id, claim_id, content) VALUES (?, ?, ?, ?)",
      [sender_id, receiver_id, claim_id, content]
    );

    const [messageDetails] = await db.execute(
      `SELECT m.*, s.full_name, s.profile_picture 
       FROM messages m 
       JOIN students s ON m.sender_id = s.student_id 
       WHERE m.id = ?`,
      [result.insertId]
    );

    if (!messageDetails.length) {
      return res.status(500).json({ error: "Message not found after insert." });
    }

    const fullMessage = messageDetails[0];
    if (tempId) fullMessage.tempId = tempId;

    const io = req.app.get("io");
    io.to(claim_id).emit("receive_message", fullMessage);

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Server error. Unable to send message." });
  }
};

// Get all messages for a claim
exports.getMessages = async (req, res) => {
  const { claimId } = req.params;

  try {
    // Fetch messages related to a claim, sorted by timestamp
    const [messages] = await db.execute(
      `SELECT m.*, s.full_name, s.profile_picture 
       FROM messages m 
       JOIN students s ON m.sender_id = s.student_id 
       WHERE m.claim_id = ? 
       ORDER BY m.timestamp ASC`,
      [claimId]
    );

    // Check if messages were found for the given claim
    if (messages.length === 0) {
      return res
        .status(404)
        .json({ error: "No messages found for this claim." });
    }

    res.json(messages); // Return the list of messages
  } catch (error) {
    console.error("Fetch messages error:", error);
    res.status(500).json({ error: "Server error. Unable to fetch messages." });
  }
};

// Get requester and finder (reporter) IDs for a claim
exports.getChatDetailsFromClaim = async (req, res) => {
  const { claimId } = req.params;

  try {
    // Retrieve claim details and associated requester and reporter IDs
    const [rows] = await db.execute(
      `SELECT c.item_id, c.requester_id, f.user_id AS reporter_id
       FROM claim_requests c
       JOIN found_items f ON c.item_id = f.id
       WHERE c.id = ? AND c.status = 'approved'`,
      [claimId]
    );

    // Check if the claim exists and is approved
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Claim not found or not approved." });
    }

    const { item_id, requester_id, reporter_id } = rows[0];

    // Fetch user details for both the requester and the reporter
    const [users] = await db.execute(
      "SELECT student_id FROM students WHERE student_id IN (?, ?)",
      [requester_id, reporter_id]
    );

    // Ensure both users exist
    if (users.length !== 2) {
      return res.status(404).json({ error: "One or both users not found." });
    }

    // Respond with the claim and user details
    res.json({
      claim_id: claimId,
      item_id,
      requester_id,
      reporter_id,
    });
  } catch (error) {
    console.error("Fetch chat details error:", error);
    res
      .status(500)
      .json({ error: "Server error. Unable to fetch chat details." });
  }
};
