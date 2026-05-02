import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import RiskBadge from '../../components/RiskBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/doctor/patients')
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

  const high = patients.filter((p) => p.risk.level === 'High').length;
  const medium = patients.filter((p) => p.risk.level === 'Medium').length;
  const low = patients.filter((p) => p.risk.level === 'Low').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Dr. {user?.name} — Patients sorted by risk level</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Total Patients</p>
        </div>
        <div className="card text-center border-l-4 border-red-400">
          <p className="text-3xl font-bold text-red-600">{high}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">High Risk</p>
        </div>
        <div className="card text-center border-l-4 border-yellow-400">
          <p className="text-3xl font-bold text-yellow-600">{medium}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Medium Risk</p>
        </div>
        <div className="card text-center border-l-4 border-green-400">
          <p className="text-3xl font-bold text-green-600">{low}</p>
          <p className="text-xs text-gray-500 font-medium uppercase mt-1">Low Risk</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-72"
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
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f + ' Risk'}
            </button>
          ))}
        </div>
      </div>

      {/* Patient table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🏥</p>
          <p className="text-gray-500">
            {patients.length === 0 ? 'No patients in the system yet.' : 'No patients match your search.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase px-6 py-3">Patient</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase px-4 py-3">Risk</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase px-4 py-3">Last BP</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase px-4 py-3">Sugar</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase px-4 py-3">Last Vitals</th>
                  <th className="text-left text-xs text-gray-500 font-semibold uppercase px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
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
                    </td>
                    <td className="px-4 py-4">
                      <RiskBadge level={patient.risk.level} />
                    </td>
                    <td className="px-4 py-4">
                      {patient.lastVitals?.bp ? (
                        <span className={`font-medium ${
                          patient.lastVitals.bp.split('/')[0] > 140 ? 'text-red-600' : 'text-gray-800'
                        }`}>
                          {patient.lastVitals.bp} mmHg
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {patient.lastVitals?.blood_sugar ? (
                        <span className={`font-medium ${
                          patient.lastVitals.blood_sugar > 200 ? 'text-red-600' :
                          patient.lastVitals.blood_sugar > 126 ? 'text-yellow-600' : 'text-gray-800'
                        }`}>
                          {patient.lastVitals.blood_sugar} mg/dL
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs">
                      {patient.lastVitals?.date
                        ? new Date(patient.lastVitals.date).toLocaleDateString('en-IN')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/doctor/patient/${patient._id}`)}
                        className="text-primary-600 font-semibold text-xs hover:underline"
                      >
                        View Full History →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
