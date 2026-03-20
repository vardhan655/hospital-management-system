const express = require('express');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Conflict detection helper
const checkConflict = async (doctorId, date, startTime, endTime, excludeId = null) => {
  const appointmentDate = new Date(date);
  const startOfDay = new Date(appointmentDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(appointmentDate.setHours(23, 59, 59, 999));

  const query = {
    doctor: doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['Cancelled', 'No Show'] },
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };

  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await Appointment.findOne(query).populate('patient', 'name');
  return conflict;
};

// GET all appointments (role-filtered)
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'doctor') filter.doctor = req.user._id;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const d = new Date(req.query.date);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999))
      };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name email')
      .populate('department', 'name')
      .sort({ date: -1, startTime: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single appointment
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name patientId phone dateOfBirth gender bloodGroup')
      .populate('doctor', 'name email')
      .populate('department', 'name');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create appointment
router.post('/', protect, authorize('admin', 'staff', 'doctor'), async (req, res) => {
  try {
    const { doctor, date, startTime, endTime } = req.body;
    const conflict = await checkConflict(doctor, date, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Scheduling conflict: Doctor already has an appointment from ${conflict.startTime} to ${conflict.endTime}`,
        conflict: {
          appointmentId: conflict.appointmentId,
          patient: conflict.patient?.name,
          startTime: conflict.startTime,
          endTime: conflict.endTime
        }
      });
    }

    const appointment = await Appointment.create({ ...req.body, createdBy: req.user._id });
    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name patientId')
      .populate('doctor', 'name email')
      .populate('department', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update appointment
router.put('/:id', protect, async (req, res) => {
  try {
    const { doctor, date, startTime, endTime } = req.body;
    if (doctor && date && startTime && endTime) {
      const conflict = await checkConflict(doctor, date, startTime, endTime, req.params.id);
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Scheduling conflict: Doctor already has an appointment from ${conflict.startTime} to ${conflict.endTime}`,
          conflict: { appointmentId: conflict.appointmentId, patient: conflict.patient?.name }
        });
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    })
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name email')
      .populate('department', 'name');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE appointment (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST check conflict (for frontend real-time check)
router.post('/check-conflict', protect, async (req, res) => {
  try {
    const { doctor, date, startTime, endTime, excludeId } = req.body;
    const conflict = await checkConflict(doctor, date, startTime, endTime, excludeId);
    res.json({ success: true, hasConflict: !!conflict, conflict });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
