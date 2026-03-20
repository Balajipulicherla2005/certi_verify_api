const express = require("express");
const router = express.Router();

const ctrl = require("./students.controller");
const { authenticate, adminOnly } = require("../../middleware/auth");

/* ───────── PUBLIC ROUTE ───────── */

router.get("/verify/:certId", ctrl.verify);

/* ───────── ADMIN ROUTES ───────── */

router.get("/", authenticate, adminOnly, ctrl.getAll);

router.get("/stats", authenticate, adminOnly, ctrl.getStats);

router.get("/:id", authenticate, adminOnly, ctrl.getOne);

router.post("/", authenticate, adminOnly, ctrl.createOne);

router.post("/bulk", authenticate, adminOnly, ctrl.bulkUpload);

router.patch("/:id", authenticate, adminOnly, ctrl.updateOne);

router.delete("/:id", authenticate, adminOnly, ctrl.deleteOne);

module.exports = router;