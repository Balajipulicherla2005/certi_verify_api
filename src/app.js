const express = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes     = require('./modules/auth/auth.routes');
const studentRoutes  = require('./modules/students/students.routes');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true, legacyHeaders: false,
}));

// Middleware
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'Certificate Verification API',
  version: '1.0.0',
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

app.get('/api', (req, res) => res.json({
  success: true,
  message: 'Certificate Verification API v1.0.0',
  endpoints: { auth: '/api/auth', students: '/api/students' },
}));

// Routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/students', studentRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
