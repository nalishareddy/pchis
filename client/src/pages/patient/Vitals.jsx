import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const Vitals = () => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    bp_systolic: '', bp_diastolic: '', blood_sugar: '', weight: '', notes: ''
  });

  const fetchVitals = async () => {
    try {
      const res = await api.get('/patient/vitals?days=30');
      setVitals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVitals(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.bp_systolic && !form.blood_sugar && !form.weight) {
      setError('Please enter at least one vital sign');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/patient/vitals', {
        bp_systolic: form.bp_systolic ? Number(form.bp_systolic) : undefined,
        bp_diastolic: form.bp_diastolic ? Number(form.bp_diastolic) : undefined,
        blood_sugar: form.blood_sugar ? Number(form.blood_sugar) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        notes: form.notes || undefined
      });
      setForm({ bp_systolic: '', bp_diastolic: '', blood_sugar: '', weight: '', notes: '' });
      setSuccess('Vitals logged successfully!');
      fetchVitals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save vitals');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = vitals.map((v) => ({
    date: new Date(v.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    'Systolic BP': v.bp_systolic || null,
    'Diastolic BP': v.bp_diastolic || null,
    'Blood Sugar': v.blood_sugar || null,
    'Weight (kg)': v.weight || null
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vitals Log</h1>
        <p className="text-gray-500 text-sm mt-1">Track your blood pressure, sugar levels, and weight</p>
      </div>

      {/* Log form */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Record New Vitals</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Systolic BP (mmHg)</label>
              <input type="number" name="bp_systolic" value={form.bp_systolic} onChange={handleChange}
                className="input-field" placeholder="120" min="50" max="300" />
            </div>
            <div>
              <label className="label">Diastolic BP (mmHg)</label>
              <input type="number" name="bp_diastolic" value={form.bp_diastolic} onChange={handleChange}
                className="input-field" placeholder="80" min="30" max="200" />
            </div>
            <div>
              <label className="label">Blood Sugar (mg/dL)</label>
              <input type="number" name="blood_sugar" value={form.blood_sugar} onChange={handleChange}
                className="input-field" placeholder="100" min="20" max="1000" />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange}
                className="input-field" placeholder="65" min="1" max="500" step="0.1" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes (optional)</label>
              <input type="text" name="notes" value={form.notes} onChange={handleChange}
                className="input-field" placeholder="e.g. fasting, post-meal, feeling dizzy..." />
            </div>
          </div>

          {/* BP reference */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-1">BP Reference Guide</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="text-green-600">✅ Normal: &lt;120/80</span>
              <span className="text-yellow-600">⚠️ Elevated: 120-139/80-89</span>
              <span className="text-red-600">🚨 High: ≥140/90</span>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-4 flex items-center gap-2">
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : 'Save Vitals'}
          </button>
        </form>
      </div>

      {/* Charts */}
      {vitals.length > 0 && (
        <>
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Blood Pressure Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Systolic BP" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Diastolic BP" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Blood Sugar Trend</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Blood Sugar" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Weight Trend</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Weight (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* History table */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Vitals History</h2>
        {vitals.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No vitals recorded yet. Log your first entry above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase pb-2">Date</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase pb-2">BP</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase pb-2">Sugar</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase pb-2">Weight</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase pb-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[...vitals].reverse().map((v) => (
                  <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-700">
                      {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-2.5">
                      {v.bp_systolic ? (
                        <span className={`font-medium ${v.bp_systolic > 140 ? 'text-red-600' : 'text-gray-800'}`}>
                          {v.bp_systolic}/{v.bp_diastolic} mmHg
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5">
                      {v.blood_sugar ? (
                        <span className={`font-medium ${v.blood_sugar > 200 ? 'text-red-600' : v.blood_sugar > 126 ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {v.blood_sugar} mg/dL
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 text-gray-700">{v.weight ? `${v.weight} kg` : '—'}</td>
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

export default Vitals;
