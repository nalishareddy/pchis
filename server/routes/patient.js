const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const Vitals = require('../models/Vitals');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { calculateRisk } = require('../utils/riskEngine');

router.use(protect, authorize('patient'));

// GET /api/patient/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const patientId = req.user._id;
    const risk = await calculateRisk(patientId);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const vitals = await Vitals.find({ patient: patientId, createdAt: { $gte: sevenDaysAgo } })
      .sort({ createdAt: 1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const medications = await Medication.find({ patient: patientId });
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

    const appointments = await Appointment.find({
      patient: patientId,
      date: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    })
      .populate('doctor', 'name email')
      .sort({ date: 1 })
      .limit(3);

    res.json({ risk, vitals, medications: medicationsWithStatus, appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/patient/vitals
router.post('/vitals', async (req, res) => {
  try {
    const { bp_systolic, bp_diastolic, blood_sugar, weight, notes } = req.body;
    if (!bp_systolic && !blood_sugar && !weight) {
      return res.status(400).json({ message: 'At least one vital sign is required' });
    }
    const vitals = await Vitals.create({
      patient: req.user._id,
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

// GET /api/patient/vitals
router.get('/vitals', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const vitals = await Vitals.find({
      patient: req.user._id,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });
    res.json(vitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/patient/medications
router.get('/medications', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const medications = await Medication.find({ patient: req.user._id });
    const result = medications.map((med) => ({
      _id: med._id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      takenToday: med.taken.some((d) => {
        const date = new Date(d);
        return date >= today && date < tomorrow;
      }),
      takenDates: med.taken.slice(-7).map((d) => d.toISOString().split('T')[0])
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/patient/medications
router.post('/medications', async (req, res) => {
  try {
    const { name, dosage, frequency } = req.body;
    if (!name) return res.status(400).json({ message: 'Medication name is required' });
    const medication = await Medication.create({
      patient: req.user._id,
      name: name.trim(),
      dosage: dosage?.trim(),
      frequency: frequency?.trim() || 'Daily'
    });
    res.status(201).json({
      _id: medication._id,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      takenToday: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/patient/medications/:id/toggle
router.patch('/medications/:id/toggle', async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      patient: req.user._id
    });
    if (!medication) return res.status(404).json({ message: 'Medication not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const idx = medication.taken.findIndex((d) => {
      const date = new Date(d);
      return date >= today && date < tomorrow;
    });

    if (idx >= 0) {
      medication.taken.splice(idx, 1);
    } else {
      medication.taken.push(new Date());
    }
    await medication.save();

    res.json({ takenToday: idx < 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/patient/medications/:id
router.delete('/medications/:id', async (req, res) => {
  try {
    const result = await Medication.deleteOne({ _id: req.params.id, patient: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Medication not found' });
    res.json({ message: 'Medication deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/patient/doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('name email phone');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/patient/appointments
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email phone')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/patient/appointments
router.post('/appointments', async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: new Date(date),
      time,
      reason,
      status: 'pending'
    });
    await appointment.populate('doctor', 'name email');
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/patient/payment/order
router.post('/payment/order', async (req, res) => {
  try {
    const { appointmentId, amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `pchis_${Date.now()}`,
      notes: {
        appointmentId: appointmentId || '',
        patientId: req.user._id.toString(),
        patientName: req.user.name
      }
    });
    await Payment.create({
      patient: req.user._id,
      appointment: appointmentId || undefined,
      razorpayOrderId: order.id,
      amount: amount,
      status: 'created'
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(500).json({ message: 'Payment gateway error: ' + error.message });
  }
});

// POST /api/patient/payment/verify
router.post('/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } =
      req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, status: 'paid' }
    );

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id
      });
    }

    res.json({ message: 'Payment verified successfully', paymentId: razorpay_payment_id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
