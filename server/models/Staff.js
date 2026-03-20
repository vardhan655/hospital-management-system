const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    unique: true
  },
  specialty: { type: String }, // For doctors
  qualification: { type: String },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Night', 'Rotating'],
    default: 'Morning'
  },
  joiningDate: { type: Date, default: Date.now },
  salary: { type: Number },
  experience: { type: Number }, // in years
  consultationFee: { type: Number } // For doctors
}, { timestamps: true });

// Auto-generate employee ID
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Staff').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
