const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('./auth.controller');
const { authenticate, adminOnly } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/errorHandler');

// Public: user registration (always creates 'user' role)
router.post('/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest,
  ],
  ctrl.register
);

// Public: login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  ctrl.login
);

// Protected: get own profile
router.get('/me', authenticate, ctrl.getMe);

// Admin: list all users
router.get('/users', authenticate, adminOnly, ctrl.getUsers);

// Admin: create another admin account
router.post('/admin/create',
  authenticate, adminOnly,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest,
  ],
  ctrl.createAdmin
);

// Admin: toggle user active status
router.patch('/users/:id/status',
  authenticate, adminOnly,
  [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  ctrl.updateUserStatus
);

module.exports = router;
