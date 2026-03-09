const authService = require('./auth.service');
const response = require('../../utils/response');
const { asyncHandler } = require('../../utils/helpers');

// POST /api/auth/register — public signup (creates 'user' role only)
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.register({ name, email, password });
  return response.created(res, result, 'Account created successfully');
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return response.success(res, result, 'Login successful');
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return response.success(res, user, 'Profile retrieved');
});

// GET /api/auth/users — admin only
const getUsers = asyncHandler(async (req, res) => {
  const users = await authService.getUsers();
  return response.success(res, users, 'Users retrieved');
});

// POST /api/auth/admin/create — admin creates another admin (admin only)
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.createAdmin({ name, email, password });
  return response.created(res, user, 'Admin account created successfully');
});

// PATCH /api/auth/users/:id/status — toggle active/inactive (admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await authService.updateUserStatus(req.params.id, isActive);
  return response.success(res, user, 'User status updated');
});

module.exports = { register, login, getMe, getUsers, createAdmin, updateUserStatus };
