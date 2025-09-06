require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const chatRoutes = require('./routes/chat'); 
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');

// Import database initialization
const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------- Security Middleware -------------------
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

// ------------------- Body Parsing -------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ------------------- Static Files -------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------- Database Init -------------------
initDatabase().catch(console.error);

// ------------------- API Routes -------------------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// ------------------- Health Check -------------------
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EcoFinds Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// ------------------- Error Handling -------------------
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ------------------- 404 Handler -------------------
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// ------------------- Start Server -------------------
app.listen(PORT, () => {
  console.log(`🚀 EcoFinds Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
