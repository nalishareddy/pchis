import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'Daily' });

  const fetchMeds = async () => {
    try {
      const res = await api.get('/patient/medications');
      setMedications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeds(); }, []);

  const toggleMed = async (id) => {
    setToggling(id);
    try {
      await api.patch(`/patient/medications/${id}/toggle`);
      setMedications((prev) =>
        prev.map((m) => m._id === id ? { ...m, takenToday: !m.takenToday } : m)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  const deleteMed = async (id) => {
    if (!window.confirm('Delete this medication?')) return;
    setDeleting(id);
    try {
      await api.delete(`/patient/medications/${id}`);
      setMedications((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Medication name is required'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/patient/medications', form);
      setMedications((prev) => [...prev, res.data]);
      setForm({ name: '', dosage: '', frequency: 'Daily' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add medication');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const takenCount = medications.filter((m) => m.takenToday).length;
  const adherencePct = medications.length > 0 ? Math.round((takenCount / medications.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medications</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your daily medications</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Add Medication'}
        </button>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900">Today's Progress</h2>
          <span className="text-2xl font-bold text-primary-600">{adherencePct}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${adherencePct === 100 ? 'bg-green-500' : adherencePct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${adherencePct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{takenCount} of {medications.length} medications taken today</p>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card border-2 border-primary-100">
          <h3 className="font-bold text-gray-900 mb-4">Add New Medication</h3>
          {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Medication Name *</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Metformin" required />
            </div>
            <div>
              <label className="label">Dosage</label>
              <input type="text" value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                className="input-field" placeholder="500mg" />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="input-field">
                <option>Daily</option>
                <option>Twice Daily</option>
                <option>Three Times Daily</option>
                <option>Weekly</option>
                <option>As Needed</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding...</> : 'Add Medication'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Medication list */}
      {medications.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">💊</p>
          <p className="text-gray-500">No medications yet. Add your first medication above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => (
            <div key={med._id} className={`card border-2 transition-all ${med.takenToday ? 'border-green-200 bg-green-50' : 'border-transparent'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{med.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{med.dosage} · {med.frequency}</p>
                </div>
                <button
                  onClick={() => deleteMed(med._id)}
                  disabled={deleting === med._id}
                  className="text-gray-300 hover:text-red-400 ml-2 transition-colors"
                  title="Delete"
                >
                  {deleting === med._id ? (
                    <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 7-day calendar */}
              <div className="flex gap-1 mb-3">
                {getLast7Days().map((day, i) => {
                  const taken = med.takenDates?.includes(day);
                  return (
                    <div key={i} title={day}
                      className={`flex-1 h-1.5 rounded-full ${taken ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mb-3">7-day adherence</p>

              <button
                onClick={() => toggleMed(med._id)}
                disabled={toggling === med._id}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  med.takenToday
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {toggling === med._id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : med.takenToday ? (
                  <><span>✓</span> Taken Today</>
                ) : (
                  'Mark as Taken'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};

export default Medications;
