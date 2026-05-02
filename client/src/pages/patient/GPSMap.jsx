import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon paths broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const getMockHospitals = (lat, lng) => [
  { id: 1, name: 'City General Hospital', type: 'Government', beds: 450, emergency: true, lat: lat + 0.012, lng: lng + 0.008, distance: '1.3 km', phone: '1800-111-999' },
  { id: 2, name: 'Apollo Health Centre', type: 'Private', beds: 120, emergency: true, lat: lat - 0.009, lng: lng + 0.015, distance: '1.8 km', phone: '044-2829-3333' },
  { id: 3, name: 'Primary Health Centre', type: 'Government', beds: 30, emergency: false, lat: lat + 0.004, lng: lng - 0.012, distance: '2.1 km', phone: '044-2345-6789' },
  { id: 4, name: 'Fortis Clinic', type: 'Private', beds: 80, emergency: true, lat: lat - 0.018, lng: lng - 0.006, distance: '2.9 km', phone: '044-4411-4411' },
  { id: 5, name: 'Community Health Sub-Centre', type: 'Government', beds: 10, emergency: false, lat: lat + 0.022, lng: lng + 0.020, distance: '3.5 km', phone: '1800-180-1104' }
];

const GPSMap = () => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const getLocation = () => {
    setLoading(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setHospitals(getMockHospitals(latitude, longitude));
        setLoading(false);
      },
      (err) => {
        if (err.code === 1) {
          setError('Location access denied. Please allow location access and try again.');
        } else {
          setError('Could not get your location. Please try again.');
        }
        // Fallback to Chennai coordinates for demo
        const demoLat = 13.0827;
        const demoLng = 80.2707;
        setLocation({ lat: demoLat, lng: demoLng });
        setHospitals(getMockHospitals(demoLat, demoLng));
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Nearby Hospitals</h1>
          <p className="text-gray-500 text-sm mt-1">View hospitals and health centres near your location</p>
        </div>
        <button onClick={getLocation} disabled={loading} className="btn-secondary text-sm flex items-center gap-2">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />Locating...</>
          ) : '📍 Refresh Location'}
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm flex items-center gap-2">
          <span>⚠️</span> {error} <span className="text-xs">(Showing demo location — Chennai)</span>
        </div>
      )}

      {location && (
        <>
          {/* Map */}
          <div className="card p-0 overflow-hidden" style={{ height: '420px' }}>
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* User location */}
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <strong>📍 Your Location</strong>
                  <br />
                  Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                </Popup>
              </Marker>
              <Circle
                center={[location.lat, location.lng]}
                radius={3000}
                pathOptions={{ color: '#3b82f6', fillColor: '#bfdbfe', fillOpacity: 0.1 }}
              />
              {/* Hospitals */}
              {hospitals.map((h) => (
                <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                  <Popup>
                    <div className="min-w-max">
                      <p className="font-bold text-gray-900">{h.name}</p>
                      <p className="text-sm text-gray-600">{h.type} · {h.distance} away</p>
                      <p className="text-sm text-gray-600">Beds: {h.beds}</p>
                      {h.emergency && <p className="text-red-600 text-sm font-semibold">🚨 24/7 Emergency</p>}
                      <p className="text-sm text-blue-600 mt-1">📞 {h.phone}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Hospital list */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nearby Facilities ({hospitals.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelected(selected === h.id ? null : h.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selected === h.id ? 'border-primary-400 bg-primary-50' : 'border-gray-100 hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-900 leading-tight">{h.name}</p>
                    {h.emergency && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0">
                        Emergency
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      h.type === 'Government' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{h.type}</span>
                    <span>📍 {h.distance}</span>
                    <span>🛏 {h.beds} beds</span>
                  </div>
                  {selected === h.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a href={`tel:${h.phone}`} className="text-primary-600 font-semibold text-sm hover:underline flex items-center gap-1">
                        📞 Call {h.phone}
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 font-semibold text-sm hover:underline flex items-center gap-1 mt-1"
                      >
                        🗺️ Get Directions
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency numbers */}
          <div className="card bg-red-50 border-red-200">
            <h2 className="text-lg font-bold text-red-800 mb-3">🚨 Emergency Contacts</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Ambulance', number: '108' },
                { label: 'National Health', number: '104' },
                { label: 'Police', number: '100' },
                { label: 'Fire Brigade', number: '101' }
              ].map((c) => (
                <a key={c.label} href={`tel:${c.number}`}
                  className="bg-white border border-red-200 rounded-xl p-3 text-center hover:bg-red-50 transition-colors">
                  <p className="text-2xl font-bold text-red-600">{c.number}</p>
                  <p className="text-xs text-gray-600 mt-1">{c.label}</p>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GPSMap;
