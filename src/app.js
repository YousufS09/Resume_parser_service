const express = require('express');
const cors = require('cors');
require('dotenv').config();

const parseRoutes = require('./routes/parseRoutes');

const app = express();

// Middlewares
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
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
