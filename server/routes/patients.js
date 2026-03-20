const express = require('express');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET all patients
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    // Doctors see only their assigned patients
    if (req.user.role === 'doctor') {
      filter.assignedDoctor = req.user._id;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { patientId: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.status) filter.status = req.query.status;

    const patients = await Patient.find(filter)
      .populate('assignedDoctor', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single patient
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name email')
      .populate('medicalHistory.doctor', 'name');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create patient (admin & staff)
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update patient (admin & staff)
router.put('/:id', protect, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('assignedDoctor', 'name email');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE patient (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add medical record
router.post('/:id/medical-history', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    patient.medicalHistory.push({ ...req.body, doctor: req.user._id });
    await patient.save();
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
