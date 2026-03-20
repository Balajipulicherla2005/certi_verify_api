const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const ctrl = require("./auth.controller");
const { authenticate, adminOnly } = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/errorHandler");

/* ===============================
   PUBLIC ROUTES
================================ */

// User Signup
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validateRequest,
  ],
  ctrl.register
);

// User Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  ctrl.login
);

/* ===============================
   AUTHENTICATED USER
================================ */

router.get("/me", authenticate, ctrl.getMe);

/* ===============================
   ADMIN ROUTES
================================ */

router.get("/users", authenticate, adminOnly, ctrl.getUsers);

router.post(
  "/admin/create",
  authenticate,
  adminOnly,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    validateRequest,
  ],
  ctrl.createAdmin
);

router.patch(
  "/users/:id/status",
  authenticate,
  adminOnly,
  [
    body("isActive").isBoolean().withMessage("isActive must be boolean"),
    validateRequest,
  ],
  ctrl.updateUserStatus
);

module.exports = router;