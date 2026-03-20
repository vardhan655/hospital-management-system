const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  email: { type: String },
  address: { type: String },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  medicalHistory: [{
    condition: String,
    diagnosis: String,
    treatment: String,
    date: { type: Date, default: Date.now },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  allergies: [String],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['Active', 'Discharged', 'Critical', 'Stable'],
    default: 'Active'
  }
}, { timestamps: true });

// Auto-generate patient ID
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `PAT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
