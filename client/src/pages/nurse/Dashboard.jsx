import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const NurseDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/nurse/patients')
      .then((res) => setPatients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.risk.level === filter;
    return matchSearch && matchFilter;
  });

  const highRisk = patients.filter((p) => p.risk.level === 'High');
  const mediumRisk = patients.filter((p) => p.risk.level === 'Medium');
  const lowRisk = patients.filter((p) => p.risk.level === 'Low');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nurse Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome, {user?.name}. Monitor and care for your patients.</p>
      </div>

      {highRisk.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-red-800">High-Risk Alert</p>
              <p className="text-red-700 text-sm">
                {highRisk.length} patient{highRisk.length > 1 ? 's' : ''} need{highRisk.length === 1 ? 's' : ''} immediate attention:{' '}
                <strong>{highRisk.map((p) => p.name).join(', ')}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Total Patients</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{highRisk.length}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">High Risk</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{mediumRisk.length}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Medium Risk</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{lowRisk.length}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Low Risk</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-64"
          placeholder="🔍 Search patients..."
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'High', 'Medium', 'Low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filter === f
                  ? f === 'High' ? 'bg-red-500 text-white border-red-500'
                  : f === 'Medium' ? 'bg-yellow-500 text-white border-yellow-500'
                  : f === 'Low' ? 'bg-green-500 text-white border-green-500'
                  : 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              {f === 'all' ? 'All Patients' : f + ' Risk'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500">
            {patients.length === 0 ? 'No patients registered in the system yet.' : 'No patients match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient) => (
            <div
              key={patient._id}
              onClick={() => navigate(`/nurse/patient/${patient._id}`)}
              className={`card border-2 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 ${
                patient.risk.level === 'High'
                  ? 'border-red-200 hover:border-red-300'
                  : patient.risk.level === 'Medium'
                  ? 'border-yellow-200 hover:border-yellow-300'
                  : 'border-green-100 hover:border-green-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    patient.risk.level === 'High' ? 'bg-red-500' :
                    patient.risk.level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-400">{patient.email}</p>
                  </div>
                </div>
                <RiskBadge level={patient.risk.level} />
              </div>

              {patient.phone && (
                <p className="text-xs text-gray-500 mb-2">📞 {patient.phone}</p>
              )}

              <div className="space-y-1.5">
                {patient.risk.reasons.slice(0, 2).map((r, i) => (
                  <p key={i} className="text-gray-500 text-xs flex items-center gap-1">
                    <span>{patient.risk.level === 'High' ? '⚠️' : patient.risk.level === 'Medium' ? '📌' : '✅'}</span>
                    {r}
                  </p>
                ))}
              </div>

              {patient.risk.lastVitals && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  Last vitals: {new Date(patient.risk.lastVitals.date).toLocaleDateString('en-IN')}
                  {patient.risk.lastVitals.bp && ` · BP ${patient.risk.lastVitals.bp}`}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <span className="text-primary-600 text-xs font-medium">View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseDashboard;
