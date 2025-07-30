const db = require("../config/db");
const path = require("path");
const fs = require("fs");

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT student_id, full_name, email, role, profile_picture, phone FROM students WHERE student_id = ?",
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const user = rows[0];

    res.json({
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile_picture: user.profile_picture
        ? `https://server-production-82bb.up.railway.app/uploads/${user.profile_picture}`
        : null,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { full_name, phone } = req.body;
    const profile_picture = req.file ? req.file.filename : null;

    const fieldsToUpdate = [];
    const values = [];

    if (full_name) {
      fieldsToUpdate.push("full_name = ?");
      values.push(full_name);
    }
    if (phone) {
      fieldsToUpdate.push("phone = ?");
      values.push(phone);
    }
    if (profile_picture) {
      fieldsToUpdate.push("profile_picture = ?");
      values.push(profile_picture);
    }

    if (fieldsToUpdate.length > 0) {
      const updateQuery = `UPDATE students SET ${fieldsToUpdate.join(
        ", "
      )} WHERE student_id = ?`;
      values.push(student_id);
      await db.execute(updateQuery, values);
    }

    // Fetch updated user
    const [updated] = await db.execute(
      "SELECT student_id, full_name, phone, email, profile_picture FROM students WHERE student_id = ?",
      [student_id]
    );

    const updatedUser = updated[0];

    res.status(200).json({
      student_id: updatedUser.student_id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profile_picture: updatedUser.profile_picture
        ? `https://server-production-82bb.up.railway.app/uploads/${updatedUser.profile_picture}`
        : null,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};
