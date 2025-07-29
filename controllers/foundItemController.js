const db = require("../config/db"); // your DB connection
const sendEmail = require("../utils/sendEmail");

// Fetch latest found items
exports.getLatestFoundItems = async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM found_items ORDER BY date_found DESC LIMIT 6"
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

// Search found items
exports.searchFoundItems = async (req, res) => {
  const { name, location, date, category } = req.query;
  let query = "SELECT * FROM found_items WHERE 1=1";
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
    query += " AND date_found = ?";
    params.push(date);
  }
  if (category) {
    query += " AND category LIKE ?";
    params.push(`%${category}%`);
  }

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};

// Report found item

exports.reportFoundItem = async (req, res) => {
  const {
    name,
    description,
    location,
    date_found,
    category,
    found_by,
    contact_info,
    user_id,
  } = req.body;
  const image_url = req.file ? req.file.filename : null;

  const insertQuery = `
    INSERT INTO found_items (name, description, location, date_found, category, found_by, contact_info, image_url, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const insertValues = [
    name,
    description,
    location,
    date_found,
    category,
    found_by,
    contact_info,
    image_url,
    user_id,
  ];

  try {
    // First: insert the found item
    await db.query(insertQuery, insertValues);

    // Second: try to find matching lost items
    const matchQuery = `
      SELECT li.*, s.email, s.full_name
      FROM lost_items li
      JOIN students s ON li.user_id = s.student_id
      WHERE li.category = ?
        AND li.location = ?
        AND li.name LIKE ?
        AND ABS(DATEDIFF(li.date_lost, ?)) <= 3
    `;
    const matchValues = [category, location, `%${name}%`, date_found];
    const [matches] = await db.query(matchQuery, matchValues);

    let emailFailures = [];

    for (const item of matches) {
      const emailBody = `
Hi ${item.full_name || "user"},

A new item reported as "${name}" might match your lost item reported earlier.

📍 Location: ${location}  
📅 Date Found: ${date_found}  
📝 Description: ${description}

Please log in to the Lost & Found Portal to review and claim it if it's yours.

- Lost & Found Team
      `;

      try {
        const notifMessage = `A similar found item ("${name}") was reported at ${location}. Check if it matches your lost item.`;
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
          "🔔 Possible Match Found for Your Lost Item",
          emailBody
        );
      } catch (emailErr) {
        console.error(`❌ Failed to send email to ${item.email}:`, emailErr);
        emailFailures.push(item.email);
      }
    }

    const responseMessage = `Found item reported successfully${
      matches.length
        ? emailFailures.length
          ? `, match found but failed to notify ${emailFailures.length} user(s)`
          : " and notifications sent"
        : ""
    }`;

    res.status(201).json({ message: responseMessage, emailFailures });
  } catch (err) {
    console.error("❌ Report found item error:", err);
    res.status(500).json({ error: "Failed to report found item" });
  }
};

// Get all found items
exports.getAllFoundItems = async (req, res) => {
  try {
    const [items] = await db.query(
      "SELECT * FROM found_items ORDER BY date_found DESC"
    );
    res.json(items);
  } catch (err) {
    console.error("Error fetching found items:", err);
    res.status(500).json({ message: "Failed to fetch found items" });
  }
};

exports.updateFoundItemStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query("UPDATE found_items SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ message: "Found item status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update found item status" });
  }
};
