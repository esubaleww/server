const db = require('../config/db');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

// ✅ SEND OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: '❌ Email is required' });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  const generatedOTP = Math.floor(100000 + Math.random() * 900000);
  const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  try {
    await db.query(
      `INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE code = ?, expires_at = ?`,
      [email, generatedOTP, expiry, generatedOTP, expiry]
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Lost & Found - OTP Verification</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="color: #2c3e50;">${generatedOTP}</h1>
        <p>This code is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail(email, 'Your OTP Code', htmlContent);
    res.status(200).json({ message: '✅ OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '❌ Failed to send OTP' });
  }
};

// ✅ VERIFY OTP AND REGISTER
exports.verifyOtpAndRegister = async (req, res) => {
  const { email, otp, fullName, studentId, password, phone } = req.body;
  const profilePicture = req.file?.filename;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and contain letters, numbers, and symbols.' });
  }

  if (!email || !otp || !fullName || !studentId || !password || !phone || !profilePicture) {
    return res.status(400).json({ message: '❌ All fields are required' });
  }

  try {
    // 1. Check OTP validity
    const [rows] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND code = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: '❌ Invalid or expired OTP' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = `${profilePicture}`;

    // 3. Register student
    await db.query(`
      INSERT INTO students (student_id, full_name, email, password, phone, profile_picture, status, role)
      VALUES (?, ?, ?, ?, ?, ?, 'verified', 'student')
    `, [studentId, fullName, email, hashedPassword, phone, profileImagePath]);

    // 4. Clean up used OTP
    await db.query('DELETE FROM otps WHERE email = ?', [email]);

    res.status(201).json({ message: '✅ Registration successful' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: '❌ Registration failed' });
  }
};
