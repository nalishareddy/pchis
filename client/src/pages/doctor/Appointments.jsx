import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700'
};

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/doctor/appointments')
      .then((res) => setAppointments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (apptId, status) => {
    setUpdating(apptId);
    try {
      const res = await api.patch(`/doctor/appointments/${apptId}`, { status });
      setAppointments((prev) => prev.map((a) => a._id === apptId ? res.data : a));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-500 text-sm mt-1">Manage patient appointment requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
              filter === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
            }`}
          >
            {key === 'all' ? 'All' : key} ({count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500">No {filter === 'all' ? '' : filter + ' '}appointments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <div key={appt._id} className="card">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[appt.status]}`}>
                      {appt.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      appt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {appt.paymentStatus === 'paid' ? '✓ Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900">{appt.patient?.name}</p>
                  <p className="text-sm text-gray-500">{appt.patient?.email}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    📅 {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {appt.time}
                  </p>
                  {appt.reason && <p className="text-xs text-gray-400 mt-1">{appt.reason}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/doctor/patient/${appt.patient?._id}`)}
                    className="text-xs btn-secondary py-1.5 px-3"
                  >
                    View Patient
                  </button>
                  {appt.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(appt._id, 'confirmed')}
                        disabled={updating === appt._id}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(appt._id, 'cancelled')}
                        disabled={updating === appt._id}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-1.5 px-3 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(appt._id, 'completed')}
                      disabled={updating === appt._id}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-lg transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  {updating === appt._id && (
                    <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
