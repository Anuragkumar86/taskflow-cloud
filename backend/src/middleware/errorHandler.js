// File: taskflow-cloud/backend/src/middleware/errorHandler.js
// Purpose: Catch all errors and return a clean JSON response
// Why: Without this, Express sends HTML error pages which break the frontend

const errorHandler = (err, req, res, next) => {
  // Log the error for CloudWatch to capture
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
  console.error(err.stack);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific database errors
  if (err.code === '23505') {
    statusCode = 409;
    message = 'This record already exists.';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only show error stack in development (not in production)
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };