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
  process.env.FRONTEND_ORIGIN,               // e.g. 'http://localhost:5173' in dev or blank
  'https://rideflow-psi.vercel.app',         // your Vercel frontend
  'https://your-other-preview.vercel.app'    // optional - add preview domains if needed
].filter(Boolean); // removes undefined entries

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed: ' + origin));
  },
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

// Startup: ensure DB connected and index exists
const startApp = async () => {
  try {
    await connectToDb();
    console.log('Connected to DB');

    // ensure geospatial index exists (safe to call repeatedly)
    try {
      await captainModel.collection.createIndex({ location: '2dsphere' });
      console.log('Geospatial index created/verified on captains.location');
    } catch (idxErr) {
      console.error('Failed to create geospatial index:', idxErr);
    }
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    // Depending on your preference, you can exit the process here:
    // process.exit(1);
  }
};

// call it immediately so index verification runs on startup
startApp();

module.exports = app;
