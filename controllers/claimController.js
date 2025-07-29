const db = require("../config/db");

// Submit a claim request
exports.createClaim = async (req, res) => {
  const { item_id, requester_id, message } = req.body;
  try {
    await db.execute(
      "INSERT INTO claim_requests (item_id, requester_id, message) VALUES (?, ?, ?)",
      [item_id, requester_id, message]
    );

    // Get the item's owner to notify
    const [itemResult] = await db.execute(
      "SELECT user_id FROM found_items WHERE id = ?",
      [item_id]
    );

    if (itemResult.length === 0) {
      console.warn(`No item found with ID: ${item_id}`);
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    const item = itemResult[0];

    if (item.user_id) {
      await db.execute(
        "INSERT INTO notifications (student_id, message, type, item_id) VALUES (?, ?, ?, ?)",
        [
          item.user_id,
          `You have a new claim request on your found item (ID: ${item_id}).`,
          "claim",
          item_id,
        ]
      );
    } else {
      console.warn(`Item with ID ${item_id} has no user_id`);
    }

    res
      .status(201)
      .json({ success: true, message: "Claim request submitted." });
  } catch (err) {
    console.error("Error in createClaim:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
};

// claimController.js

// GET claims by item
exports.getClaimsByItem = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id; // Finder ID from token

  try {
    // Check if the item belongs to the current user (finder)
    const [itemRows] = await db.execute(
      "SELECT * FROM found_items WHERE id = ? AND user_id = ?",
      [itemId, userId]
    );

    if (itemRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view claims for this item.",
      });
    }

    // Fetch all claims for this item, including requester's name and item description
    const [claims] = await db.execute(
      `SELECT c.*, s.full_name, f.description AS item_description
       FROM claim_requests c
       JOIN students s ON c.requester_id = s.student_id
       JOIN found_items f ON c.item_id = f.id
       WHERE c.item_id = ?`,
      [itemId]
    );

    if (claims.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No claims found for this item." });
    }

    return res.status(200).json(claims); // Return all claims
  } catch (err) {
    console.error("Error fetching claims:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
};

// PUT (approve or reject a claim)
exports.updateClaimStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Update claim status
    const [result] = await db.execute(
      "UPDATE claim_requests SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Claim not found." });
    }

    // Fetch claim details (to get requester and item_id)
    const [[claim]] = await db.execute(
      "SELECT * FROM claim_requests WHERE id = ?",
      [id]
    );

    if (!claim) {
      return res
        .status(404)
        .json({ success: false, message: "Claim not found after update." });
    }

    const { item_id, requester_id } = claim;

    // Fetch item details to get finder user_id
    const [[item]] = await db.execute(
      "SELECT * FROM found_items WHERE id = ?",
      [item_id]
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    // Only send notifications if approved
    if (status === "approved") {
      // Notify looser (claim requester)
      await db.execute(
        "INSERT INTO notifications (student_id, message, type, item_id, claim_id) VALUES (?, ?, ?, ?, ?)",
        [
          requester_id,
          `Your claim for item ID ${item_id} has been approved. You can now chat with the finder.`,
          "claim_approved",
          item_id,
          id, // Add claim_id
        ]
      );

      // Notify finder (item owner)
      await db.execute(
        "INSERT INTO notifications (student_id, message, type, item_id, claim_id) VALUES (?, ?, ?, ?, ?)",
        [
          item.user_id,
          `You approved a claim for item ID ${item_id}. You can now chat with the looser.`,
          "claim_approved",
          item_id,
          id, // Add claim_id
        ]
      );
    }

    res.status(200).json({ success: true, message: `Claim ${status}` });
  } catch (err) {
    console.error("Error updating claim status:", err);
    res.status(500).json({ success: false, error: "Database error" });
  }
};

// Check if current user has access to chat for a given item
exports.getAcceptedClaim = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.query;

  try {
    const [rows] = await db.execute(
      `SELECT * FROM claim_requests 
         WHERE item_id = ? 
           AND status = 'approved' 
           AND (requester_id = ? OR (SELECT user_id FROM found_items WHERE id = ?) = ?)`,
      [itemId, userId, itemId, userId]
    );

    if (rows.length > 0) {
      res.json({ hasAccess: true, claimId: rows[0].id });
    } else {
      res.json({ hasAccess: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
