const express = require('express');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET admin dashboard stats
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalPatients, totalDoctors, totalStaff, totalDepts,
           todayAppointments, monthAppointments, pendingAppointments,
           completedAppointments, activePatients, recentPatients, recentAppointments] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'staff', isActive: true }),
      Department.countDocuments({ isActive: true }),
      Appointment.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Appointment.countDocuments({ date: { $gte: startOfMonth } }),
      Appointment.countDocuments({ status: 'Scheduled' }),
      Appointment.countDocuments({ status: 'Completed' }),
      Patient.countDocuments({ status: 'Active' }),
      Patient.find().sort({ createdAt: -1 }).limit(5).select('name patientId status createdAt'),
      Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay } })
        .populate('patient', 'name')
        .populate('doctor', 'name')
        .sort({ startTime: 1 }).limit(5)
    ]);

    // Monthly appointment trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await Appointment.countDocuments({ date: { $gte: start, $lte: end } });
      monthlyTrend.push({
        month: start.toLocaleString('default', { month: 'short' }),
        count
      });
    }

    res.json({
      success: true,
      data: {
        stats: { totalPatients, totalDoctors, totalStaff, totalDepts, todayAppointments, monthAppointments, pendingAppointments, completedAppointments, activePatients },
        recentPatients,
        recentAppointments,
        monthlyTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET doctor dashboard stats
router.get('/doctor', protect, authorize('doctor'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [todayCount, totalPatients, pendingCount, completedCount, todayAppointments] = await Promise.all([
      Appointment.countDocuments({ doctor: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } }),
      Patient.countDocuments({ assignedDoctor: req.user._id }),
      Appointment.countDocuments({ doctor: req.user._id, status: 'Scheduled' }),
      Appointment.countDocuments({ doctor: req.user._id, status: 'Completed' }),
      Appointment.find({ doctor: req.user._id, date: { $gte: startOfDay, $lte: endOfDay } })
        .populate('patient', 'name patientId phone dateOfBirth gender')
        .sort({ startTime: 1 })
    ]);

    res.json({
      success: true,
      data: { stats: { todayCount, totalPatients, pendingCount, completedCount }, todayAppointments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET staff dashboard stats
router.get('/staff', protect, authorize('staff'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [todayCount, totalPatients, scheduledToday, cancelledToday] = await Promise.all([
      Appointment.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay } }),
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, status: 'Scheduled' }),
      Appointment.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, status: 'Cancelled' })
    ]);

    const todayAppointments = await Appointment.find({ date: { $gte: startOfDay, $lte: endOfDay } })
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: { stats: { todayCount, totalPatients, scheduledToday, cancelledToday }, todayAppointments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
