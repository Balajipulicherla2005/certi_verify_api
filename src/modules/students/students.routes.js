const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('./students.controller');
const { authenticate, adminOnly } = require('../../middleware/auth');

// Multer: in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  },
});

// Public route - certificate verification (no auth needed)
router.get('/verify/:certId', ctrl.verify);

// Admin routes
router.get('/stats',    authenticate, adminOnly, ctrl.getStats);
router.get('/',         authenticate, adminOnly, ctrl.getAll);
router.get('/:id',      authenticate, adminOnly, ctrl.getOne);
router.post('/',        authenticate, adminOnly, ctrl.createOne);
router.post('/bulk',    authenticate, adminOnly, upload.single('file'), ctrl.bulkUpload);
router.patch('/:id',    authenticate, adminOnly, ctrl.updateOne);
router.delete('/:id',   authenticate, adminOnly, ctrl.deleteOne);

module.exports = router;
