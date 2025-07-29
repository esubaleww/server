const bcrypt = require('bcryptjs');
const db = require('../config/db');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');



// ------------------------- RESET PASSWORD -------------------------
exports.resetPassword = async (req, res) => {
  const { otp, newPassword, email } = req.body;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and contain letters, numbers, and symbols.' });
  }
 try {
    const [rows] = await db.query(
      'SELECT * FROM otps WHERE email = ? AND code = ? AND expires_at > NOW()',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: '❌ Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE students SET password = ? where email = ?', [hashedPassword, email]);

    await db.query('DELETE FROM otps WHERE email = ?', [email]);

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const [userResult] = await db.query('SELECT * FROM students WHERE email = ?', [email]);
      const user = userResult[0];
  
      if (!user) {
        return res.status(400).json({ message: 'Email not found.' });
      }
  
      const generatedOTP = Math.floor(100000 + Math.random() * 900000);
      const expiry = new Date(Date.now() + 5 * 60 * 1000); 
      await db.query(
          `INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE code = ?, expires_at = ?`,
          [email, generatedOTP, expiry, generatedOTP, expiry]
        );
  
       const subject =  'Password Reset OTP';
       const message = `<h2>Password Reset Request</h2><p>Please use the OTP below to reset your password:</p>`;
  
       await sendEmail(email, subject,
        `<div>${message}<div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333;">${generatedOTP}</div></div>`
        );
        res.json({ message: 'OTP sent to your email.' });
     
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  };
  
  
  
    