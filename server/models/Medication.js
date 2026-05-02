const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  dosage: { type: String, trim: true },
  frequency: { type: String, default: 'Daily', trim: true },
  taken: [{ type: Date }]
}, { timestamps: true });

medicationSchema.index({ patient: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
