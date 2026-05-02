const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const User = require('../models/User');
const Vitals = require('../models/Vitals');
const Medication = require('../models/Medication');
const { calculateRisk } = require('../utils/riskEngine');

router.use(protect, authorize('nurse'));

// GET /api/nurse/patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password').lean();

    const patientsWithRisk = await Promise.all(
      patients.map(async (patient) => {
        const risk = await calculateRisk(patient._id);
        return {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          createdAt: patient.createdAt,
          risk
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

// GET /api/nurse/patient/:id
router.get('/patient/:id', async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const risk = await calculateRisk(patient._id);

    const vitals = await Vitals.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .limit(14)
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
      })
    }));

    res.json({ patient, risk, vitals, medications: medicationsWithStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/nurse/patient/:id/vitals
router.post('/patient/:id/vitals', async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const { bp_systolic, bp_diastolic, blood_sugar, weight, notes } = req.body;
    if (!bp_systolic && !blood_sugar && !weight) {
      return res.status(400).json({ message: 'At least one vital sign is required' });
    }

    const vitals = await Vitals.create({
      patient: req.params.id,
      bp_systolic: bp_systolic || undefined,
      bp_diastolic: bp_diastolic || undefined,
      blood_sugar: blood_sugar || undefined,
      weight: weight || undefined,
      notes,
      recordedBy: req.user._id
    });

    res.status(201).json(vitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/nurse/patient/:id/vitals
router.get('/patient/:id/vitals', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const vitals = await Vitals.find({
      patient: req.params.id,
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: 1 })
      .populate('recordedBy', 'name role');
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
