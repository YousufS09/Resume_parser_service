const express = require('express');
const cors = require('cors');
require('dotenv').config();

const parseRoutes = require('./routes/parseRoutes');

const app = express();

// Middlewares
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log("Allowed Origins:", allowedOrigins);

function isLocalDevOrigin(origin) {
  try {
    const parsedOrigin = new URL(origin);
    return (
      process.env.NODE_ENV !== 'production' &&
      (parsedOrigin.hostname === 'localhost' || parsedOrigin.hostname === '127.0.0.1')
    );
  } catch (error) {
    return false;
  }
}

function isNetlifyOrigin(origin) {
  try {
    const parsedOrigin = new URL(origin);
    return process.env.NODE_ENV === 'production' && parsedOrigin.hostname.endsWith('.netlify.app');
  } catch (error) {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin) || isNetlifyOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/parse', parseRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Resume Parsing Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

module.exports = app;
