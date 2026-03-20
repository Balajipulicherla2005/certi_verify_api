const authService = require("./auth.service");
const response = require("../../utils/response");
const { asyncHandler } = require("../../utils/helpers");

/* ───────── USER SIGNUP ─────────
   POST /api/auth/signup
*/
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register({
    name,
    email,
    password,
  });

  return response.created(res, result, "Account created successfully");
});

/* ───────── USER LOGIN ─────────
   POST /api/auth/login
*/
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  return response.success(res, result, "Login successful");
});

/* ───────── GET CURRENT USER ─────────
   GET /api/auth/me
*/
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  return response.success(res, user, "Profile retrieved");
});

/* ───────── ADMIN: GET USERS ─────────
   GET /api/auth/users
*/
const getUsers = asyncHandler(async (req, res) => {
  const users = await authService.getUsers();

  return response.success(res, users, "Users retrieved");
});

/* ───────── ADMIN: CREATE ADMIN ─────────
   POST /api/auth/admin/create
*/
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.createAdmin({
    name,
    email,
    password,
  });

  return response.created(res, user, "Admin account created successfully");
});

/* ───────── ADMIN: UPDATE USER STATUS ─────────
   PATCH /api/auth/users/:id/status
*/
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await authService.updateUserStatus(req.params.id, isActive);

  return response.success(res, user, "User status updated");
});

module.exports = {
  register,
  login,
  getMe,
  getUsers,
  createAdmin,
  updateUserStatus,
};