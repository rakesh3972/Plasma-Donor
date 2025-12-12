// Standardized error response helper
const errorResponse = (res, status, message, details = null) => {
  return res.status(status).json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  });
};

// Success response helper
const successResponse = (res, data, message = 'Success') => {
  return res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Validation error helper
const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString()
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorResponse,
  successResponse,
  validationError,
  asyncHandler
}; 