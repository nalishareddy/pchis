import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = {
  patient: [
    { to: '/patient', label: 'Dashboard', icon: '🏠' },
    { to: '/patient/vitals', label: 'Vitals', icon: '❤️' },
    { to: '/patient/medications', label: 'Medications', icon: '💊' },
    { to: '/patient/appointments', label: 'Appointments', icon: '📅' },
    { to: '/patient/map', label: 'Find Hospital', icon: '🗺️' }
  ],
  nurse: [
    { to: '/nurse', label: 'Dashboard', icon: '🏠' }
  ],
  doctor: [
    { to: '/doctor', label: 'Patients', icon: '🏠' },
    { to: '/doctor/appointments', label: 'Appointments', icon: '📅' }
  ]
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    patient: 'from-primary-600 to-primary-800',
    nurse: 'from-health-teal to-emerald-700',
    doctor: 'from-indigo-600 to-indigo-800'
  };

  const roleLabels = {
    patient: 'Patient Portal',
    nurse: 'Nurse Portal',
    doctor: 'Doctor Portal'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className={`bg-gradient-to-r ${roleColors[user?.role] || roleColors.patient} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="text-white font-bold text-lg leading-tight block">PCHIS</span>
                <span className="text-white text-opacity-80 text-xs">{roleLabels[user?.role]}</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  end={item.to === `/${user?.role}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.to || (item.to !== `/${user?.role}` && location.pathname.startsWith(item.to))
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-white font-semibold text-sm">{user?.name}</p>
                <p className="text-white text-opacity-70 text-xs capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Logout
              </button>
              {/* Mobile menu toggle */}
              <button
                className="md:hidden text-white p-1"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {menuOpen && (
            <nav className="md:hidden pb-3 flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white text-opacity-90 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 bg-white">
        PCHIS – Predictive Community Health Intelligence System © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Layout;
