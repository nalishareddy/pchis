import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const StatCard = ({ label, value, unit, icon, color }) => (
  <div className="card flex items-start gap-4">
    <div className={`p-3 rounded-xl text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">
        {value ?? '—'}
        {value && unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

const PatientDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/patient/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const toggleMed = async (medId) => {
    setToggling(medId);
    try {
      await api.patch(`/patient/medications/${medId}/toggle`);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const { risk, vitals, medications, appointments } = data || {};

  const chartData = (vitals || []).map((v) => ({
    date: new Date(v.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    BP: v.bp_systolic || null,
    Sugar: v.blood_sugar || null,
    Weight: v.weight || null
  }));

  const takenCount = medications?.filter((m) => m.takenToday).length || 0;
  const totalMeds = medications?.length || 0;
  const adherencePct = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0;

  const riskColors = { High: 'bg-red-50 border-red-200', Medium: 'bg-yellow-50 border-yellow-200', Low: 'bg-green-50 border-green-200' };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/patient/vitals" className="btn-primary text-sm">+ Log Vitals</Link>
      </div>

      {/* Risk Banner */}
      {risk && (
        <div className={`rounded-xl border p-5 ${riskColors[risk.level]}`}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <RiskBadge level={risk.level} size="lg" />
                <span className="text-sm text-gray-600">Risk Score: <strong>{risk.score}</strong>/100</span>
              </div>
              <ul className="space-y-1">
                {risk.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span>{risk.level === 'High' ? '⚠️' : risk.level === 'Medium' ? '📌' : '✅'}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            {risk.lastVitals && (
              <div className="text-sm text-gray-600 bg-white bg-opacity-60 rounded-lg p-3">
                <p className="font-semibold mb-1">Last Recorded Vitals</p>
                {risk.lastVitals.bp && <p>BP: <strong>{risk.lastVitals.bp}</strong> mmHg</p>}
                {risk.lastVitals.blood_sugar && <p>Sugar: <strong>{risk.lastVitals.blood_sugar}</strong> mg/dL</p>}
                {risk.lastVitals.weight && <p>Weight: <strong>{risk.lastVitals.weight}</strong> kg</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(risk.lastVitals.date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Meds Today" value={`${takenCount}/${totalMeds}`} icon="💊" color="bg-blue-50" />
        <StatCard label="Adherence" value={adherencePct} unit="%" icon="📊" color="bg-green-50" />
        <StatCard label="Last BP" value={risk?.lastVitals?.bp} unit="mmHg" icon="❤️" color="bg-red-50" />
        <StatCard label="Last Sugar" value={risk?.lastVitals?.blood_sugar} unit="mg/dL" icon="🩸" color="bg-yellow-50" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medications */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Today's Medications</h2>
            <Link to="/patient/medications" className="text-primary-600 text-xs hover:underline font-medium">Manage →</Link>
          </div>
          {medications?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No medications added yet</p>
          ) : (
            <div className="space-y-3">
              {medications?.map((med) => (
                <div key={med._id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    med.takenToday ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => toggleMed(med._id)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    med.takenToday ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                    {toggling === med._id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : med.takenToday ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${med.takenToday ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {med.name}
                    </p>
                    <p className="text-xs text-gray-400">{med.dosage} · {med.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${adherencePct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">{adherencePct}% complete today</p>
        </div>

        {/* Vitals chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Vitals Trend (Last 7 Days)</h2>
            <Link to="/patient/vitals" className="text-primary-600 text-xs hover:underline font-medium">Log Vitals →</Link>
          </div>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-4xl mb-2">📈</span>
              <p className="text-sm">No vitals recorded yet</p>
              <Link to="/patient/vitals" className="btn-primary text-xs mt-3">Record First Entry</Link>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Upcoming appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Upcoming Appointments</h2>
          <Link to="/patient/appointments" className="btn-primary text-xs">Book Appointment</Link>
        </div>
        {appointments?.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No upcoming appointments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {appointments?.map((appt) => (
              <div key={appt._id} className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{appt.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    appt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{appt.paymentStatus}</span>
                </div>
                <p className="font-semibold text-gray-900">{appt.doctor?.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  📅 {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {appt.time}
                </p>
                {appt.reason && <p className="text-xs text-gray-400 mt-1 truncate">{appt.reason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default PatientDashboard;
