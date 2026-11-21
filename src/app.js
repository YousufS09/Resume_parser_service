const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const parseRoutes = require('./routes/parseRoutes');

const app = express();

// Render and similar hosts sit behind one proxy; trust it so req.ip is the real client IP (rate limiting).
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

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

      const error = new Error(`CORS blocked origin: ${origin}`);
      error.status = 403;
      callback(error);
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
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Upload errors (file too large, unexpected field, ...) are client errors, not server failures
  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. The maximum size is 5 MB.' : err.message;
  }

  if (status >= 500) {
    console.error(err.stack);

    // Do not leak database or internal error details to clients in production
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal Server Error';
    }
  }

  res.status(status).json({
    error: {
      message,
    },
  });
});

module.exports = app;
