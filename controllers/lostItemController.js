const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");
// Get latest lost items
exports.getLatestLostItems = async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM lost_items ORDER BY date_lost DESC LIMIT 6"
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// Get all lost items
exports.getAllLostItems = async (req, res) => {
  try {
    const [items] = await db.query(
      "SELECT * FROM lost_items ORDER BY date_lost DESC"
    );
    res.json(items);
  } catch (err) {
    console.error("Error fetching lost items:", err);
    res.status(500).json({ message: "Failed to fetch lost items" });
  }
};

// Search lost items
exports.searchLostItems = async (req, res) => {
  const { name, location, date } = req.query;
  let query = "SELECT * FROM lost_items WHERE 1=1";
  const params = [];

  if (name) {
    query += " AND name LIKE ?";
    params.push(`%${name}%`);
  }
  if (location) {
    query += " AND location LIKE ?";
    params.push(`%${location}%`);
  }
  if (date) {
    query += " AND date_lost = ?";
    params.push(date);
  }

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
};

// Report lost item

exports.reportLostItem = async (req, res) => {
  const {
    name,
    description,
    location,
    date_lost,
    category,
    lost_by,
    contact_info,
    user_id,
  } = req.body;
  const image_url = req.file ? req.file.filename : null;

  const insertQuery = `
    INSERT INTO lost_items (name, description, location, date_lost, category, lost_by, contact_info, image_url, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const insertValues = [
    name,
    description,
    location,
    date_lost,
    category,
    lost_by,
    contact_info,
    image_url,
    user_id,
  ];

  try {
    // Insert the lost item first
    await db.query(insertQuery, insertValues);

    // Match logic to check found items
    const matchQuery = `
      SELECT f.*, s.email, s.full_name
      FROM found_items f
      JOIN students s ON f.user_id = s.student_id
      WHERE f.category = ?
        AND f.location = ?
        AND f.name LIKE ?
        AND ABS(DATEDIFF(f.date_found, ?)) <= 3
    `;
    const [matches] = await db.query(matchQuery, [
      category,
      location,
      `%${name}%`,
      date_lost,
    ]);

    let emailFailures = [];

    for (const item of matches) {
      const emailBody = `
    Hi ${item.full_name || "user"},

    Someone just reported a lost item "${name}" that closely matches what you reported as found earlier.

    📍 Location: ${location}  
     📅 Date Lost: ${date_lost}  
   📝 Description: ${description}

Please log in to the Lost & Found Portal to confirm or get in touch.

- Lost & Found Team`;
      try {
        const notifMessage = `A similar lost item ("${name}") was reported at ${location}. Check if it matches your found item.`;
        await db.query(
          "INSERT INTO notifications (student_id, message, is_read, item_id) VALUES (?, ?, false, ?)",
          [item.user_id, notifMessage, item.id]
        );
      } catch (notifErr) {
        console.error("❌ Failed to insert notification:", notifErr);
      }

      try {
        await sendEmail(
          item.email,
          "🔔 Possible Match for Found Item",
          emailBody
        );
      } catch (emailErr) {
        console.error(`❌ Failed to send email to ${item.email}:`, emailErr);
        emailFailures.push(item.email);
      }
    }

    const responseMessage = `Lost item reported successfully${
      matches.length
        ? emailFailures.length
          ? `, match found but failed to notify ${emailFailures.length} user(s)`
          : " and notifications sent"
        : ""
    }`;

    res.status(201).json({ message: responseMessage, emailFailures });
  } catch (err) {
    console.error("❌ Report lost item error:", err);
    res.status(500).json({ error: "Failed to report lost item" });
  }
};

exports.updateLostItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query("UPDATE lost_items SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ message: "Lost item status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lost item status" });
  }
};
