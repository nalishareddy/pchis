import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

import Login from './pages/Login';
import Register from './pages/Register';

import PatientDashboard from './pages/patient/Dashboard';
import PatientVitals from './pages/patient/Vitals';
import PatientMedications from './pages/patient/Medications';
import PatientAppointments from './pages/patient/Appointments';
import PatientGPSMap from './pages/patient/GPSMap';

import NurseDashboard from './pages/nurse/Dashboard';
import NursePatientDetail from './pages/nurse/PatientDetail';

import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorPatientDetail from './pages/doctor/PatientDetail';
import DoctorAppointments from './pages/doctor/Appointments';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

const WithLayout = ({ children }) => <Layout>{children}</Layout>;

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient routes */}
        <Route element={<PrivateRoute allowedRoles={['patient']} />}>
          <Route path="/patient" element={<WithLayout><PatientDashboard /></WithLayout>} />
          <Route path="/patient/vitals" element={<WithLayout><PatientVitals /></WithLayout>} />
          <Route path="/patient/medications" element={<WithLayout><PatientMedications /></WithLayout>} />
          <Route path="/patient/appointments" element={<WithLayout><PatientAppointments /></WithLayout>} />
          <Route path="/patient/map" element={<WithLayout><PatientGPSMap /></WithLayout>} />
        </Route>

        {/* Nurse routes */}
        <Route element={<PrivateRoute allowedRoles={['nurse']} />}>
          <Route path="/nurse" element={<WithLayout><NurseDashboard /></WithLayout>} />
          <Route path="/nurse/patient/:id" element={<WithLayout><NursePatientDetail /></WithLayout>} />
        </Route>

        {/* Doctor routes */}
        <Route element={<PrivateRoute allowedRoles={['doctor']} />}>
          <Route path="/doctor" element={<WithLayout><DoctorDashboard /></WithLayout>} />
          <Route path="/doctor/patient/:id" element={<WithLayout><DoctorPatientDetail /></WithLayout>} />
          <Route path="/doctor/appointments" element={<WithLayout><DoctorAppointments /></WithLayout>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
