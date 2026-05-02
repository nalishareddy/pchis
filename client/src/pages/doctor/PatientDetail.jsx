import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/axios';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const DoctorPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [updatingAppt, setUpdatingAppt] = useState(null);

  useEffect(() => {
    api.get(`/doctor/patient/${id}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const updateAppointmentStatus = async (apptId, status) => {
    setUpdatingAppt(apptId);
    try {
      const res = await api.patch(`/doctor/appointments/${apptId}`, { status });
      setData((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) => a._id === apptId ? res.data : a)
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAppt(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="card text-center py-12 text-gray-400">Patient not found.</div>;

  const { patient, risk, vitals, medications, appointments, payments } = data;

  const chartData = [...vitals].reverse().slice(-20).map((v) => ({
    date: new Date(v.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    Systolic: v.bp_systolic || null,
    Diastolic: v.bp_diastolic || null,
    Sugar: v.blood_sugar || null,
    Weight: v.weight || null
  }));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'vitals', label: `Vitals (${vitals.length})` },
    { id: 'medications', label: `Medications (${medications.length})` },
    { id: 'appointments', label: `Appointments (${appointments.length})` },
    { id: 'payments', label: `Payments (${payments.length})` }
  ];

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/doctor')} className="text-primary-600 text-sm font-medium flex items-center gap-1 mb-3 hover:underline">
          ← Back to Patients
        </button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
              risk.level === 'High' ? 'bg-red-500' : risk.level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-500 text-sm">{patient.email}</p>
              {patient.phone && <p className="text-gray-400 text-xs">📞 {patient.phone}</p>}
              <p className="text-gray-400 text-xs">Patient since {new Date(patient.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskBadge level={risk.level} size="lg" />
            <span className="text-sm text-gray-500">Risk Score: <strong>{risk.score}</strong>/100</span>
          </div>
        </div>
      </div>

      {/* Risk explanation */}
      <div className={`rounded-xl border p-4 ${
        risk.level === 'High' ? 'bg-red-50 border-red-200' :
        risk.level === 'Medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
      }`}>
        <p className="font-semibold text-gray-800 text-sm mb-2">Clinical Risk Analysis</p>
        <ul className="space-y-1">
          {risk.reasons.map((r, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
              <span>{risk.level === 'High' ? '⚠️' : risk.level === 'Medium' ? '📌' : '✅'}</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{vitals.length}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Vitals Logged</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{medications.filter((m) => m.takenToday).length}/{medications.length}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Meds Today</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600">{appointments.filter((a) => a.status !== 'cancelled').length}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Appointments</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-purple-600">{payments.filter((p) => p.status === 'paid').length}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Payments Done</p>
            </div>
          </div>
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Vitals Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="Sugar" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tab: Vitals */}
      {tab === 'vitals' && (
        <div className="card">
          {vitals.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No vitals recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Systolic', 'Diastolic', 'Sugar', 'Weight', 'By', 'Notes'].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 font-semibold uppercase pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((v) => (
                    <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-gray-700">
                        {new Date(v.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={v.bp_systolic > 140 ? 'text-red-600 font-medium' : 'text-gray-800'}>
                          {v.bp_systolic || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700">{v.bp_diastolic || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className={v.blood_sugar > 200 ? 'text-red-600 font-medium' : v.blood_sugar > 126 ? 'text-yellow-600 font-medium' : 'text-gray-800'}>
                          {v.blood_sugar || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700">{v.weight || '—'}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-500 capitalize">{v.recordedBy?.role || 'patient'}</td>
                      <td className="py-2.5 text-gray-400 text-xs">{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Medications */}
      {tab === 'medications' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {medications.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-gray-400">No medications on record.</div>
          ) : medications.map((med) => (
            <div key={med._id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{med.name}</p>
                  <p className="text-sm text-gray-500">{med.dosage} · {med.frequency}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  med.takenToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {med.takenToday ? 'Taken Today' : 'Not Yet'}
                </span>
              </div>
              {med.adherenceRate !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>7-day adherence</span>
                    <span>{Math.min(med.adherenceRate, 100)}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${med.adherenceRate >= 70 ? 'bg-green-500' : med.adherenceRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(med.adherenceRate, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Appointments */}
      {tab === 'appointments' && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">No appointments with this patient yet.</div>
          ) : appointments.map((appt) => (
            <div key={appt._id} className="card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status]}`}>
                      {appt.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${appt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {appt.paymentStatus}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {appt.time}
                  </p>
                  {appt.reason && <p className="text-sm text-gray-500">{appt.reason}</p>}
                </div>
                {appt.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateAppointmentStatus(appt._id, 'confirmed')}
                      disabled={updatingAppt === appt._id}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appt._id, 'cancelled')}
                      disabled={updatingAppt === appt._id}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {appt.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus(appt._id, 'completed')}
                    disabled={updatingAppt === appt._id}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Payments */}
      {tab === 'payments' && (
        <div className="card">
          {payments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No payment records found.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">₹{payment.amount}</p>
                    <p className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleDateString('en-IN')}</p>
                    {payment.razorpayPaymentId && (
                      <p className="text-xs text-gray-400 font-mono">{payment.razorpayPaymentId}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                    payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700'
};

export default DoctorPatientDetail;
