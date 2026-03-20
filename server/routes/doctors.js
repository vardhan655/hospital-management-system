const express = require('express');
const User = require('../models/User');
const Staff = require('../models/Staff');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET all doctors
router.get('/', protect, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true }).select('-password');
    const doctorsWithProfile = await Promise.all(doctors.map(async (doc) => {
      const profile = await Staff.findOne({ user: doc._id }).populate('department', 'name');
      return { ...doc.toObject(), profile };
    }));
    res.json({ success: true, count: doctorsWithProfile.length, data: doctorsWithProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all staff (non-doctor)
router.get('/staff', protect, authorize('admin'), async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff', isActive: true }).select('-password');
    const staffWithProfile = await Promise.all(staff.map(async (s) => {
      const profile = await Staff.findOne({ user: s._id }).populate('department', 'name');
      return { ...s.toObject(), profile };
    }));
    res.json({ success: true, count: staffWithProfile.length, data: staffWithProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single doctor/user
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const profile = await Staff.findOne({ user: user._id }).populate('department', 'name');
    res.json({ success: true, data: { ...user.toObject(), profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update user + staff profile (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, isActive, specialty, qualification, department, shift, consultationFee, experience } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const profile = await Staff.findOneAndUpdate(
      { user: req.params.id },
      { specialty, qualification, department, shift, consultationFee, experience },
      { new: true, upsert: true }
    ).populate('department', 'name');

    res.json({ success: true, data: { ...user.toObject(), profile } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE (deactivate) user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
