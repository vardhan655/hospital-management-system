const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Staff = require('../models/Staff');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// @route   POST /api/auth/register
// @access  Admin only
router.post('/register',
  protect,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'doctor', 'staff']).withMessage('Invalid role')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { name, email, password, role, phone, specialty, qualification, department, shift, consultationFee, experience } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });

      const user = await User.create({ name, email, password, role, phone });

      // Create staff profile
      await Staff.create({
        user: user._id,
        specialty,
        qualification,
        department,
        shift,
        consultationFee,
        experience
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   POST /api/auth/login
// @access  Public
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');

      if (!user || !await user.comparePassword(password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated' });
      }

      const token = generateToken(user._id);
      res.json({
        success: true,
        token,
        data: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   GET /api/auth/me
// @access  Protected
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const staffProfile = await Staff.findOne({ user: req.user._id }).populate('department');
    res.json({ success: true, data: { ...user.toObject(), staffProfile } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/updatedetails
// @access  Protected
router.put('/updatedetails', protect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Check if new email already exists
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/updatepassword
// @access  Protected
router.put('/updatepassword',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Please provide current password'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const user = await User.findById(req.user._id).select('+password');

      // Check current password
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(401).json({ success: false, message: 'Incorrect current password' });
      }

      user.password = req.body.newPassword;
      await user.save();

      const token = generateToken(user._id);

      res.json({ success: true, token, message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
