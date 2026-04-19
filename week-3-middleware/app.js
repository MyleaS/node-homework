const express = require('express');
const path = require('path');
const dogsRouter = require('./routes/dogs');
const app = express();

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 1. Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateId();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// 2. Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 3. Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

// 4. JSON body parsing with size limit
app.use(express.json({ limit: '1mb' }));

// 5. Static files
app.use(express.static(path.join(__dirname, '../public')));

// 6. Content-Type validation for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(400).json({
      error: 'Content-Type must be application/json',
      requestId: req.requestId
    });
  }
  next();
});

app.use('/', dogsRouter); // Do not remove this line

// 7. 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId
  });
});

// 8. Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    console.error(`ERROR: ${err.constructor.name}: ${err.message}`);
    return res.status(statusCode).json({
      error: 'Internal Server Error',
      requestId: req.requestId
    });
  } else {
    console.warn(`WARN: ${err.constructor.name}: ${err.message}`);
    return res.status(statusCode).json({
      error: err.message,
      requestId: req.requestId
    });
  }
});

const server = app.listen(3000, () => console.log("Server listening on port 3000"));
module.exports = server;
