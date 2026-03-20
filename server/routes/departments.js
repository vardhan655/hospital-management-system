const express = require('express');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET all departments
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).populate('headDoctor', 'name email');
    res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create department (admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update department
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('headDoctor', 'name email');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE department
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Department deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
