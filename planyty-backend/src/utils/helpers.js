const crypto = require('crypto');

// Generate random token for invitations
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Calculate expiry date
const calculateExpiryDate = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

// Response formatter
const responseFormatter = (success, data = null, message = '', error = null) => {
  return {
    success,
    data,
    message,
    error,
    timestamp: new Date().toISOString()
  };
};

// Success response
const successResponse = (res, data = null, message = 'Success', status = 200) => {
  res.status(status).json(responseFormatter(true, data, message));
};

// Error response
const errorResponse = (res, message = 'Error', status = 400, error = null) => {
  res.status(status).json(responseFormatter(false, null, message, error));
};

module.exports = {
  generateToken,
  calculateExpiryDate,
  formatDate,
  paginate,
  successResponse,
  errorResponse,
  responseFormatter
};