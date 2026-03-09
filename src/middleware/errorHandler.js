const { validationResult } = require('express-validator');
const response = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', { message: err.message, path: req.path, method: req.method });

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return response.conflict(res, 'A record with this value already exists');
  }
  if (err.name === 'JsonWebTokenError') return response.unauthorized(res, 'Invalid token');
  if (err.name === 'TokenExpiredError')  return response.unauthorized(res, 'Token expired');
  if (err instanceof SyntaxError && err.status === 400) return response.badRequest(res, 'Invalid JSON in request body');
  if (err.status) return response.error(res, err.message, err.status);

  return response.error(res, 'Internal Server Error', 500);
};

const notFoundHandler = (req, res) =>
  response.notFound(res, `Route '${req.method} ${req.originalUrl}' not found`);

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return response.badRequest(res, 'Validation failed', errors.array());
  next();
};

module.exports = { errorHandler, notFoundHandler, validateRequest };
