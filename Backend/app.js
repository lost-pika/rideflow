// app.js (corrected)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const captainRoutes = require('./routes/captain.routes');
const mapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const captainModel = require('./models/captain.model');

const app = express();

// middleware


const allowedOrigins = [
  'http://localhost:5173',
  'https://rideflow-psi.vercel.app'
];

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://rideflow-psi.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use('/users', userRoutes);
app.use('/captains', captainRoutes);
app.use('/maps', mapsRoutes);
app.use('/rides', rideRoutes);

app.get('/', (req, res) => res.send('Hello World'));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Startup: ensure DB connected and index exists
const startApp = async () => {
  try {
    await connectToDb();

    // ensure geospatial index exists (safe to call repeatedly)
    try {
      await captainModel.collection.createIndex({ location: '2dsphere' });
      console.log('Geospatial index created/verified on captains.location');
    } catch (idxErr) {
      console.error('Failed to create geospatial index:', idxErr.message);
    }
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

// call it immediately so index verification runs on startup
startApp();

module.exports = app;
