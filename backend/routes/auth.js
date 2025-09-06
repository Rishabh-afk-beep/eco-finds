const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { dbGet, dbRun } = require('../database');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const transporter = require('../utils/mailer'); // ✅ Import transporter

require('dotenv').config();

const router = express.Router();

// Validation middleware for registration and login
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// -------------------------
// ✅ Register new user
// -------------------------
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, full_name } = req.body;

    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await dbRun(
      `INSERT INTO users (username, email, password, full_name, eco_points, onboarded) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, full_name || '', 100, false]
    );

    const token = generateToken(result.id);
    const refreshToken = generateRefreshToken(result.id);

    const newUser = await dbGet(
      'SELECT id, username, email, full_name, avatar_url, eco_points, onboarded, created_at FROM users WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// -------------------------
// ✅ Login user
// -------------------------
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await dbGet(
      'SELECT id, username, email, password, full_name, avatar_url, eco_points, onboarded FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    delete user.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// -------------------------
// ✅ Get user profile
// -------------------------
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT id, username, email, full_name, phone, address, avatar_url, 
              eco_points, onboarded, created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// -------------------------
// ✅ Update user profile
// -------------------------
router.put('/me', authenticateToken, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, full_name, phone, address, onboarded } = req.body;
    const updates = [];
    const params = [];

    if (username !== undefined) {
      const existingUser = await dbGet(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      }

      updates.push('username = ?');
      params.push(username);
    }

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }

    if (onboarded !== undefined) {
      updates.push('onboarded = ?');
      params.push(onboarded);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.user.id);

    await dbRun(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedUser = await dbGet(
      `SELECT id, username, email, full_name, phone, address, avatar_url, 
              eco_points, onboarded, created_at, updated_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// -------------------------
// ✅ Change password
// -------------------------
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await dbGet(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await dbRun(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// -------------------------
// ✅ Logout
// -------------------------
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// -------------------------
// ✅ Forgot Password
// -------------------------
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, a reset link has been sent."
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h'
    });

    const resetLink = `http://localhost:8080/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'EcoFinds Password Reset',
      text: `Click the link to reset your password: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "If this email is registered, a reset link has been sent."
    });

  } catch (error) {
    console.error('Forgot Password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
});

module.exports = router;
