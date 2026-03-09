const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool } = require('../../config/database');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Public registration — always creates a 'user' role account.
 * Admin accounts can only be created by existing admins via createAdmin().
 */
const register = async ({ name, email, password }) => {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
  const id = require('crypto').randomUUID();
  // Force role = 'user' for public registration
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, name.trim(), email.toLowerCase().trim(), passwordHash, 'user']
  );

  const [newUser] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [id]
  );
  const token = generateToken(id);
  return { user: newUser[0], token };
};

/**
 * Admin-only: create another admin account.
 * Called by an authenticated admin.
 */
const createAdmin = async ({ name, email, password }) => {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
  const id = require('crypto').randomUUID();
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, name.trim(), email.toLowerCase().trim(), passwordHash, 'admin']
  );

  const [newUser] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [id]
  );
  return newUser[0];
};

const login = async (email, password) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
    [email.toLowerCase().trim()]
  );
  if (!rows.length) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = generateToken(user.id);
  const { password_hash, ...userData } = user;
  return { user: userData, token };
};

const getMe = async (userId) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!rows.length) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const getUsers = async () => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

const updateUserStatus = async (userId, isActive) => {
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, userId]);
  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (!rows.length) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  return rows[0];
};

module.exports = { register, createAdmin, login, getMe, getUsers, updateUserStatus };
