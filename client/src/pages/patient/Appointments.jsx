import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('rzp-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'rzp-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700'
};

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ doctorId: '', date: '', time: '', reason: '' });

  const fetchData = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('/patient/appointments'),
        api.get('/patient/doctors')
      ]);
      setAppointments(apptRes.data);
      setDoctors(docRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/patient/appointments', form);
      setAppointments((prev) => [res.data, ...prev]);
      setForm({ doctorId: '', date: '', time: '', reason: '' });
      setShowForm(false);
      setSuccess('Appointment booked successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (appt) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert('Razorpay SDK failed to load. Check your internet connection.');
      return;
    }

    setPayingId(appt._id);
    const CONSULTATION_FEE = 500;

    try {
      const res = await api.post('/patient/payment/order', {
        appointmentId: appt._id,
        amount: CONSULTATION_FEE
      });

      const { orderId, amount, currency } = res.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount,
        currency,
        name: 'PCHIS Health',
        description: `Consultation with ${appt.doctor?.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post('/patient/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appt._id
            });
            setAppointments((prev) =>
              prev.map((a) => a._id === appt._id ? { ...a, paymentStatus: 'paid' } : a)
            );
            setSuccess('Payment successful! ₹' + CONSULTATION_FEE);
            setTimeout(() => setSuccess(''), 4000);
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => setPayingId(null) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        alert('Payment failed: ' + response.error.description);
        setPayingId(null);
      });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate payment');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const upcoming = appointments.filter(
    (a) => new Date(a.date) >= new Date() && a.status !== 'cancelled'
  );
  const past = appointments.filter(
    (a) => new Date(a.date) < new Date() || a.status === 'cancelled'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">Book and manage your doctor appointments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Book Appointment'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}

      {/* Booking form */}
      {showForm && (
        <div className="card border-2 border-primary-100">
          <h3 className="font-bold text-gray-900 mb-4">Book New Appointment</h3>
          {error && <div className="mb-3 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
          <form onSubmit={handleBook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Select Doctor *</label>
              <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="input-field" required>
                <option value="">-- Choose a doctor --</option>
                {doctors.length === 0 && <option disabled>No doctors registered yet</option>}
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} {d.email ? `(${d.email})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Preferred Date *</label>
              <input type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field" required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Preferred Time *</label>
              <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input-field" required>
                <option value="">-- Select time slot --</option>
                {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
                  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reason for Visit</label>
              <input type="text" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input-field" placeholder="e.g. routine checkup, BP management..." />
            </div>

            <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
              💳 Consultation fee: <strong>₹500</strong> — payable after booking via Razorpay (test mode)
            </div>

            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Booking...</> : 'Book Appointment'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Appointments ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No upcoming appointments. Book one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <div key={appt._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900">{appt.doctor?.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status]}`}>
                      {appt.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      appt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {appt.paymentStatus === 'paid' ? '✓ Paid' : 'Payment Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    📅 {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })} at {appt.time}
                  </p>
                  {appt.reason && <p className="text-xs text-gray-400 mt-1">{appt.reason}</p>}
                </div>
                {appt.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => handlePayment(appt)}
                    disabled={payingId === appt._id}
                    className="btn-primary text-xs flex items-center gap-1"
                  >
                    {payingId === appt._id ? (
                      <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
                    ) : '💳 Pay ₹500'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Past Appointments</h2>
          <div className="space-y-2">
            {past.map((appt) => (
              <div key={appt._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-70">
                <div>
                  <p className="text-sm font-medium text-gray-700">{appt.doctor?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(appt.date).toLocaleDateString('en-IN')} · {appt.time}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status]}`}>
                    {appt.status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    appt.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>{appt.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
