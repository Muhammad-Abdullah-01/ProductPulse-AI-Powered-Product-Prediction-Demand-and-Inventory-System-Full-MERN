/**
 * Global error handler — always returns JSON.
 * Handles Mongoose, JWT, and Multer errors consistently.
 */
module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message    = `An account with this ${field} already exists.`;
    statusCode  = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message    = Object.values(err.errors).map(e => e.message).join('. ');
    statusCode  = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message    = `Invalid ID: ${err.value}`;
    statusCode  = 400;
  }

  // Multer file size
  if (err.code === 'LIMIT_FILE_SIZE') {
    message    = `File too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB || 50} MB.`;
    statusCode  = 413;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('💥 ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
