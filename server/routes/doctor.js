const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const User = require('../models/User');
const Vitals = require('../models/Vitals');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const { calculateRisk } = require('../utils/riskEngine');

router.use(protect, authorize('doctor'));

// GET /api/doctor/patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password').lean();

    const patientsWithRisk = await Promise.all(
      patients.map(async (patient) => {
        const risk = await calculateRisk(patient._id);
        const lastVitals = await Vitals.findOne({ patient: patient._id }).sort({ createdAt: -1 });
        return {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          createdAt: patient.createdAt,
          risk,
          lastVitals: lastVitals
            ? {
                bp: lastVitals.bp_systolic
                  ? `${lastVitals.bp_systolic}/${lastVitals.bp_diastolic}`
                  : null,
                blood_sugar: lastVitals.blood_sugar,
                weight: lastVitals.weight,
                date: lastVitals.createdAt
              }
            : null
        };
      })
    );

    const riskOrder = { High: 0, Medium: 1, Low: 2 };
    patientsWithRisk.sort((a, b) => riskOrder[a.risk.level] - riskOrder[b.risk.level]);

    res.json(patientsWithRisk);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/doctor/patient/:id
router.get('/patient/:id', async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const risk = await calculateRisk(patient._id);

    const vitals = await Vitals.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('recordedBy', 'name role');

    const medications = await Medication.find({ patient: patient._id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const medicationsWithStatus = medications.map((med) => ({
      _id: med._id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      takenToday: med.taken.some((d) => {
        const date = new Date(d);
        return date >= today && date < tomorrow;
      }),
      adherenceRate:
        medications.length > 0
          ? Math.round(
              (med.taken.filter(
                (d) =>
                  new Date(d) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length /
                7) *
                100
            )
          : 0
    }));

    const appointments = await Appointment.find({
      patient: patient._id,
      doctor: req.user._id
    }).sort({ date: -1 });

    const payments = await Payment.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ patient, risk, vitals, medications: medicationsWithStatus, appointments, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/doctor/appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email phone')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/doctor/appointments/:id
router.patch('/appointments/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id },
      { status },
      { new: true }
    ).populate('patient', 'name email');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
