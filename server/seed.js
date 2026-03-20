const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Staff = require('./models/Staff');
const Department = require('./models/Department');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Staff.deleteMany({});
    await Department.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create Departments
    const departments = await Department.insertMany([
      { name: 'Cardiology', description: 'Heart and cardiovascular care', location: 'Block A, Floor 2' },
      { name: 'Neurology', description: 'Brain and nervous system', location: 'Block B, Floor 3' },
      { name: 'Orthopedics', description: 'Bone and joint care', location: 'Block C, Floor 1' },
      { name: 'Pediatrics', description: "Children's healthcare", location: 'Block D, Floor 1' },
      { name: 'General Medicine', description: 'General health consultations', location: 'Block A, Floor 1' }
    ]);

    console.log('🏥 Departments created');

    // Create Admin
    const admin = await User.create({
      name: 'Dr. Admin User',
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1-555-0100'
    });
    await Staff.create({ user: admin._id, department: departments[4]._id, shift: 'Morning', joiningDate: new Date('2020-01-01') });

    // Create Doctors
    const doctorData = [
      { name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@hospital.com', specialty: 'Cardiologist', dept: departments[0]._id, fee: 150, exp: 12 },
      { name: 'Dr. James Wilson', email: 'james.wilson@hospital.com', specialty: 'Neurologist', dept: departments[1]._id, fee: 180, exp: 15 },
      { name: 'Dr. Emily Chen', email: 'emily.chen@hospital.com', specialty: 'Orthopedic Surgeon', dept: departments[2]._id, fee: 160, exp: 8 },
      { name: 'Dr. Robert Kumar', email: 'robert.kumar@hospital.com', specialty: 'Pediatrician', dept: departments[3]._id, fee: 120, exp: 10 }
    ];

    const doctors = [];
    for (const d of doctorData) {
      const user = await User.create({ name: d.name, email: d.email, password: 'doctor123', role: 'doctor', phone: '+1-555-020' + (doctors.length + 1) });
      await Staff.create({ user: user._id, specialty: d.specialty, department: d.dept, consultationFee: d.fee, experience: d.exp, shift: 'Morning' });
      doctors.push(user);
    }

    // Update department heads
    await Department.findByIdAndUpdate(departments[0]._id, { headDoctor: doctors[0]._id });
    await Department.findByIdAndUpdate(departments[1]._id, { headDoctor: doctors[1]._id });

    // Create Staff
    const staffMembers = [];
    const staffData = [
      { name: 'Alice Johnson', email: 'alice.j@hospital.com', dept: departments[4]._id },
      { name: 'Bob Martinez', email: 'bob.m@hospital.com', dept: departments[0]._id }
    ];
    for (const s of staffData) {
      const user = await User.create({ name: s.name, email: s.email, password: 'staff123', role: 'staff', phone: '+1-555-030' + staffMembers.length });
      await Staff.create({ user: user._id, department: s.dept, shift: 'Morning' });
      staffMembers.push(user);
    }

    console.log('👨‍⚕️ Users (Admin + Doctors + Staff) created');

    // Create Patients
    const patientsData = [
      { name: 'John Smith', dateOfBirth: new Date('1985-03-15'), gender: 'Male', phone: '555-1001', bloodGroup: 'A+', assignedDoctor: doctors[0]._id, status: 'Active', email: 'john.smith@email.com' },
      { name: 'Maria Garcia', dateOfBirth: new Date('1992-07-22'), gender: 'Female', phone: '555-1002', bloodGroup: 'O-', assignedDoctor: doctors[1]._id, status: 'Active', email: 'maria.garcia@email.com' },
      { name: 'David Lee', dateOfBirth: new Date('1978-11-08'), gender: 'Male', phone: '555-1003', bloodGroup: 'B+', assignedDoctor: doctors[2]._id, status: 'Stable', email: 'david.lee@email.com' },
      { name: 'Emma Wilson', dateOfBirth: new Date('2005-01-30'), gender: 'Female', phone: '555-1004', bloodGroup: 'AB+', assignedDoctor: doctors[3]._id, status: 'Active', email: 'emma.wilson@email.com' },
      { name: 'James Brown', dateOfBirth: new Date('1965-09-12'), gender: 'Male', phone: '555-1005', bloodGroup: 'A-', assignedDoctor: doctors[0]._id, status: 'Critical', email: 'james.brown@email.com' },
      { name: 'Sophia Martinez', dateOfBirth: new Date('1990-04-18'), gender: 'Female', phone: '555-1006', bloodGroup: 'O+', assignedDoctor: doctors[1]._id, status: 'Active' }
    ];

    const patients = [];
    for (const p of patientsData) {
      patients.push(await Patient.create(p));
    }
    console.log('🧑‍🤝‍🧑 Patients created');

    // Create Appointments
    const today = new Date();
    const apptData = [
      { patient: patients[0]._id, doctor: doctors[0]._id, department: departments[0]._id, date: new Date(today.toDateString()), startTime: '09:00', endTime: '09:30', type: 'Consultation', status: 'Scheduled' },
      { patient: patients[1]._id, doctor: doctors[1]._id, department: departments[1]._id, date: new Date(today.toDateString()), startTime: '10:00', endTime: '10:45', type: 'Follow-up', status: 'In Progress' },
      { patient: patients[2]._id, doctor: doctors[2]._id, department: departments[2]._id, date: new Date(today.toDateString()), startTime: '11:00', endTime: '11:30', type: 'Check-up', status: 'Scheduled' },
      { patient: patients[3]._id, doctor: doctors[3]._id, department: departments[3]._id, date: new Date(today.toDateString()), startTime: '14:00', endTime: '14:30', type: 'Consultation', status: 'Completed' },
      { patient: patients[4]._id, doctor: doctors[0]._id, department: departments[0]._id, date: new Date(new Date().setDate(today.getDate() - 1)), startTime: '09:00', endTime: '09:30', type: 'Emergency', status: 'Completed' },
      { patient: patients[5]._id, doctor: doctors[1]._id, department: departments[1]._id, date: new Date(new Date().setDate(today.getDate() + 1)), startTime: '11:00', endTime: '11:30', type: 'Follow-up', status: 'Scheduled' }
    ];

    const appointments = [];
    for (const a of apptData) {
      appointments.push(await Appointment.create(a));
    }
    console.log('📅 Appointments created');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:  admin@hospital.com    / admin123');
    console.log('Doctor: sarah.mitchell@...    / doctor123');
    console.log('Doctor: james.wilson@...      / doctor123');
    console.log('Staff:  alice.j@hospital.com  / staff123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
