const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const response = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return response.unauthorized(res, 'Access token is required');
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return response.unauthorized(
        res,
        err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
      );
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    if (!rows.length) return response.unauthorized(res, 'User not found or inactive');

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return response.error(res, 'Authentication failed');
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) return response.unauthorized(res, 'Not authenticated');
  if (req.user.role !== 'admin') return response.forbidden(res, 'Admin access required');
  next();
};

module.exports = { authenticate, adminOnly };
