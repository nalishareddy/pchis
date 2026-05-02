# PCHIS – Setup & Run Guide

## Prerequisites

Install these before running:

1. **Node.js** (v18+) – https://nodejs.org
2. **MongoDB Community Server** – https://www.mongodb.com/try/download/community
   - During install, choose "Install MongoDB as a Service" ✅
   - MongoDB will auto-start on boot

## Step 1 – Clone / Open the Project

Open the folder `C:\Users\nalis\Desktop\health` in your terminal.

## Step 2 – Configure Environment Variables

**Server** (`server/.env`):
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pchis
JWT_SECRET=pchis_super_secret_jwt_key_change_in_production_2024
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

**Client** (`client/.env`):
```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

> For Razorpay test keys: sign up free at https://razorpay.com → Dashboard → Settings → API Keys → Generate Test Key

## Step 3 – Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

## Step 4 – Start MongoDB

MongoDB should run automatically as a Windows service after installation.

To start manually (in an admin PowerShell):
```powershell
Start-Service MongoDB
```

Or run MongoDB directly:
```bash
mongod --dbpath C:\data\db
```

## Step 5 – Start the Backend

```bash
cd server
npm run dev
```

✅ You should see:
```
PCHIS Server running on http://localhost:5000
MongoDB Connected: 127.0.0.1
```

## Step 6 – Start the Frontend

In a new terminal:
```bash
cd client
npm run dev
```

✅ You should see:
```
VITE ready on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Step 7 – Test the Application

### Create accounts (register 3 types):

1. Register a **Doctor**:
   - Name, Email, Password, Role = Doctor

2. Register an **ASHA Worker**:
   - Name, Email, Password, Role = ASHA

3. Register a **Patient**:
   - Name, Email, Password, Role = Patient

### Test Patient Features:
- Log vitals (BP, sugar, weight) → see charts update
- Toggle medications as taken → see adherence %
- Book appointment with the doctor → pay via Razorpay
- Open GPS Map → allow location → see hospitals on Leaflet map

### Test ASHA Features:
- Login as ASHA worker
- See all patients with risk badges (High/Medium/Low)
- Click a patient → record vitals on their behalf

### Test Doctor Features:
- Login as Doctor
- See all patients sorted High→Low risk
- Click patient → full history (vitals, meds, appointments, payments)
- Confirm/Cancel/Complete appointments

### Test Payment (Razorpay Test Mode):
Use these test card details in the Razorpay popup:
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g. 12/26)
CVV: Any 3 digits (e.g. 123)
Name: Any name
OTP: 1234 (if asked)
```

## Project Structure

```
health/
├── server/                  # Node.js + Express backend
│   ├── config/db.js         # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── role.js          # Role-based access control
│   ├── models/
│   │   ├── User.js          # Patient / ASHA / Doctor
│   │   ├── Vitals.js        # BP, sugar, weight records
│   │   ├── Medication.js    # Medication checklist with taken dates
│   │   ├── Appointment.js   # Doctor appointments
│   │   └── Payment.js       # Razorpay payment records
│   ├── routes/
│   │   ├── auth.js          # POST /register, POST /login, GET /me
│   │   ├── patient.js       # Patient APIs
│   │   ├── asha.js          # ASHA Worker APIs
│   │   └── doctor.js        # Doctor APIs
│   ├── utils/riskEngine.js  # AI risk calculation logic
│   └── index.js             # Express app entry point
│
└── client/                  # React + Vite frontend
    └── src/
        ├── api/axios.js     # Axios with JWT interceptor
        ├── contexts/
        │   └── AuthContext.jsx   # Login/logout state
        ├── components/
        │   ├── Layout.jsx        # Nav + footer
        │   ├── PrivateRoute.jsx  # Route protection
        │   └── RiskBadge.jsx     # High/Medium/Low badge
        └── pages/
            ├── Login.jsx / Register.jsx
            ├── patient/   Dashboard, Vitals, Medications, Appointments, GPSMap
            ├── asha/      Dashboard, PatientDetail
            └── doctor/    Dashboard, PatientDetail, Appointments
```

## Risk Engine Logic

The AI risk score is calculated in real-time from:

| Condition | Points |
|-----------|--------|
| No vitals recorded | +30 |
| No vitals in 3 days | +20 |
| Systolic BP > 140 or Diastolic > 90 | +30 |
| Systolic BP < 90 or Diastolic < 60 | +20 |
| Blood sugar > 200 mg/dL | +25 |
| Blood sugar > 126 mg/dL | +15 |
| >2 medications missed this week | +25 |
| 1-2 medications missed | +10 |

**Score ≥ 50 → High Risk 🔴**
**Score 25-49 → Medium Risk 🟡**
**Score < 25 → Low Risk 🟢**

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/patient/dashboard
POST   /api/patient/vitals
GET    /api/patient/vitals
GET    /api/patient/medications
POST   /api/patient/medications
PATCH  /api/patient/medications/:id/toggle
DELETE /api/patient/medications/:id
GET    /api/patient/doctors
GET    /api/patient/appointments
POST   /api/patient/appointments
POST   /api/patient/payment/order
POST   /api/patient/payment/verify

GET    /api/asha/patients
GET    /api/asha/patient/:id
POST   /api/asha/patient/:id/vitals

GET    /api/doctor/patients
GET    /api/doctor/patient/:id
GET    /api/doctor/appointments
PATCH  /api/doctor/appointments/:id
```
