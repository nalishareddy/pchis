const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bp_systolic: { type: Number, min: 50, max: 300 },
  bp_diastolic: { type: Number, min: 30, max: 200 },
  blood_sugar: { type: Number, min: 20, max: 1000 },
  weight: { type: Number, min: 1, max: 500 },
  notes: { type: String, maxlength: 500 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

vitalsSchema.index({ patient: 1, createdAt: -1 });

module.exports = mongoose.model('Vitals', vitalsSchema);
