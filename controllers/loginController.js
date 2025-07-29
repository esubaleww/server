const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use promise-based pool.query
    const [rows] = await db.query("SELECT * FROM students WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.student_id,
        email: user.email,
        role: user.role,
        image: user.profile_picture,
      },
      process.env.JWT_SECRET
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.student_id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.profile_picture,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
