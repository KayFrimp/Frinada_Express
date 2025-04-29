const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const { connectMongoDB } = require('./config/mongodb');
const { pool } = require('./config/database');

// Load env vars
require('dotenv').config();

// Connect to MongoDB
connectMongoDB();

// Connect to MySQL
pool.getConnection()
  .then(connection => {
    console.log('MySQL Connected...');
    connection.release();
  })
  .catch(err => {
    console.error('MySQL connection error:', err);
    process.exit(1);
  });

const app = express();

// Enable CORS first
app.use(cors());

// Body parser - IMPORTANT: This must come before any routes that use req.body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet());

// XSS Protection middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  if (req.query) {
    for (let key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key]);
      }
    }
  }
  if (req.params) {
    for (let key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = xss(req.params[key]);
      }
    }
  }
  next();
});

// Prevent http param pollution
app.use(hpp({
  whitelist: [
    'status',
    'role',
    'orderId',
    'riderId',
    'userId'
  ]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/riders', require('./routes/riderRoutes'));
app.use('/api/tracking', require('./routes/tracking'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 