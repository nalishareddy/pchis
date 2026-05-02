import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../api/axios';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const AshaPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    bp_systolic: '', bp_diastolic: '', blood_sugar: '', weight: '', notes: ''
  });

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/asha/patient/${id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatient(); }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.bp_systolic && !form.blood_sugar && !form.weight) {
      setError('Enter at least one vital sign');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/asha/patient/${id}/vitals`, {
        bp_systolic: form.bp_systolic ? Number(form.bp_systolic) : undefined,
        bp_diastolic: form.bp_diastolic ? Number(form.bp_diastolic) : undefined,
        blood_sugar: form.blood_sugar ? Number(form.blood_sugar) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        notes: form.notes || undefined
      });
      setForm({ bp_systolic: '', bp_diastolic: '', blood_sugar: '', weight: '', notes: '' });
      setSuccess('Vitals recorded successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchPatient();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record vitals');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="card text-center py-12 text-gray-400">Patient not found.</div>;

  const { patient, risk, vitals, medications } = data;

  const chartData = [...vitals].reverse().slice(-14).map((v) => ({
    date: new Date(v.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    BP: v.bp_systolic || null,
    Sugar: v.blood_sugar || null,
    Weight: v.weight || null
  }));

  const takenCount = medications.filter((m) => m.takenToday).length;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button onClick={() => navigate('/asha')} className="text-primary-600 text-sm font-medium flex items-center gap-1 mb-3 hover:underline">
          ← Back to Dashboard
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
              risk.level === 'High' ? 'bg-red-500' : risk.level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-500 text-sm">{patient.email} {patient.phone && `· ${patient.phone}`}</p>
              <p className="text-xs text-gray-400">Registered: {new Date(patient.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <RiskBadge level={risk.level} size="lg" />
        </div>
      </div>

      {/* Risk details */}
      <div className={`rounded-xl border p-5 ${
        risk.level === 'High' ? 'bg-red-50 border-red-200' :
        risk.level === 'Medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
      }`}>
        <p className="font-semibold text-gray-800 mb-2">Risk Factors</p>
        <ul className="space-y-1.5">
          {risk.reasons.map((r, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
              <span>{risk.level === 'High' ? '⚠️' : risk.level === 'Medium' ? '📌' : '✅'}</span> {r}
            </li>
          ))}
        </ul>
      </div>

      {/* Medication adherence */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-3">Medication Adherence Today</h2>
        <p className="text-sm text-gray-600 mb-3">{takenCount} of {medications.length} medications taken today</p>
        <div className="space-y-2">
          {medications.length === 0 ? (
            <p className="text-gray-400 text-sm">No medications on record.</p>
          ) : medications.map((med) => (
            <div key={med._id} className={`flex items-center gap-3 p-3 rounded-lg border ${
              med.takenToday ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                med.takenToday ? 'bg-green-500' : 'bg-gray-200'
              }`}>
                {med.takenToday && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{med.name}</p>
                <p className="text-xs text-gray-400">{med.dosage} · {med.frequency}</p>
              </div>
              <span className={`text-xs font-semibold ${med.takenToday ? 'text-green-600' : 'text-gray-400'}`}>
                {med.takenToday ? 'Taken' : 'Missed'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Record vitals form */}
      <div className="card border-2 border-primary-100">
        <h2 className="font-bold text-gray-900 mb-4">Record Vitals for {patient.name}</h2>
        {error && <div className="mb-3 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
        {success && (
          <div className="mb-3 text-green-700 text-sm bg-green-50 p-2 rounded flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Systolic BP (mmHg)</label>
            <input type="number" name="bp_systolic" value={form.bp_systolic} onChange={handleChange}
              className="input-field" placeholder="120" />
          </div>
          <div>
            <label className="label">Diastolic BP (mmHg)</label>
            <input type="number" name="bp_diastolic" value={form.bp_diastolic} onChange={handleChange}
              className="input-field" placeholder="80" />
          </div>
          <div>
            <label className="label">Blood Sugar (mg/dL)</label>
            <input type="number" name="blood_sugar" value={form.blood_sugar} onChange={handleChange}
              className="input-field" placeholder="100" />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" name="weight" value={form.weight} onChange={handleChange}
              className="input-field" placeholder="65" step="0.1" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <input type="text" name="notes" value={form.notes} onChange={handleChange}
              className="input-field" placeholder="e.g. patient reports dizziness, fasting reading..." />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : 'Record Vitals'}
            </button>
          </div>
        </form>
      </div>

      {/* Vitals chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Vitals History (Last 14 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="BP" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Sugar" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vitals table */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Vitals Log</h2>
        {vitals.length === 0 ? (
          <p className="text-gray-400 text-sm">No vitals recorded for this patient yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date', 'BP', 'Sugar', 'Weight', 'Recorded By', 'Notes'].map((h) => (
                    <th key={h} className="text-left text-xs text-gray-500 font-semibold uppercase pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vitals.map((v) => (
                  <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 text-gray-700 whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2.5 pr-4">
                      {v.bp_systolic ? (
                        <span className={v.bp_systolic > 140 ? 'text-red-600 font-medium' : 'text-gray-800'}>
                          {v.bp_systolic}/{v.bp_diastolic}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      {v.blood_sugar ? (
                        <span className={v.blood_sugar > 200 ? 'text-red-600 font-medium' : 'text-gray-800'}>
                          {v.blood_sugar}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700">{v.weight || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">
                      {v.recordedBy?.name || 'Patient'} <span className="text-gray-400">({v.recordedBy?.role || 'patient'})</span>
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs">{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AshaPatientDetail;
