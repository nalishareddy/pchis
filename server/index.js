const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect DB on each request in serverless (cached after first call)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/nurse', require('./routes/nurse'));
app.use('/api/doctor', require('./routes/doctor'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PCHIS API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Local dev server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`PCHIS Server running on http://localhost:${PORT}`));
}

module.exports = app;
