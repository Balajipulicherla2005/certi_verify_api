const XLSX = require('xlsx');
const studentsService = require('./students.service');
const response = require('../../utils/response');
const { asyncHandler } = require('../../utils/helpers');

// GET /api/students — list all (admin)
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = '' } = req.query;
  const result = await studentsService.getAll({ page: parseInt(page), limit: parseInt(limit), search });
  return response.success(res, result, 'Students retrieved');
});

// GET /api/students/stats — dashboard stats (admin)
const getStats = asyncHandler(async (req, res) => {
  const stats = await studentsService.getStats();
  return response.success(res, stats, 'Stats retrieved');
});

// GET /api/students/verify/:certId — public certificate lookup (user)
const verify = asyncHandler(async (req, res) => {
  const { certId } = req.params;
  const student = await studentsService.searchByCertificateId(certId);
  return response.success(res, student, 'Certificate found');
});

// GET /api/students/:id — single student (admin)
const getOne = asyncHandler(async (req, res) => {
  const student = await studentsService.getById(req.params.id);
  return response.success(res, student, 'Student retrieved');
});

// POST /api/students — add single student (admin)
const createOne = asyncHandler(async (req, res) => {
  // Fix: use req.user.id (not _id — that was a MongoDB-ism)
  const student = await studentsService.createOne(req.body, req.user.id);
  return response.created(res, student, 'Student added successfully');
});

// POST /api/students/bulk — upload Excel (admin)
const bulkUpload = asyncHandler(async (req, res) => {
  if (!req.file) return response.badRequest(res, 'No file uploaded');

  let rows;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet);
  } catch (err) {
    return response.badRequest(res, 'Failed to parse Excel/CSV file');
  }

  if (!rows || rows.length === 0) return response.badRequest(res, 'Excel file is empty');

  // Validate & normalize rows
  const validRows = [];
  const validationErrors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const name        = String(row['Student Name'] || row['student_name'] || row['Name'] || row['name'] || '').trim();
    const email       = String(row['Email'] || row['email'] || '').trim();
    const domain      = String(row['Domain'] || row['domain'] || row['Internship Domain'] || '').trim();
    const startDate   = String(row['Start Date'] || row['start_date'] || row['Internship Start Date'] || '').trim();
    const endDate     = String(row['End Date'] || row['end_date'] || row['Internship End Date'] || '').trim();
    const certId      = String(row['Certificate ID'] || row['certificate_id'] || '').trim();

    const errs = [];
    if (!name)       errs.push('Student Name is required');
    if (!email)      errs.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Invalid email');
    if (!domain)     errs.push('Domain is required');
    if (!startDate)  errs.push('Start Date is required');
    if (!endDate)    errs.push('End Date is required');
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      errs.push('Start date must be before end date');

    if (errs.length > 0) {
      validationErrors.push({ row: rowNum, errors: errs });
    } else {
      validRows.push({
        studentName: name,
        email,
        domain,
        internshipStartDate: startDate,
        internshipEndDate: endDate,
        certificateId: certId || null,
        issuedDate: new Date().toISOString().split('T')[0],
      });
    }
  });

  // Fix: use req.user.id (not _id)
  const results = await studentsService.bulkCreate(validRows, req.user.id);
  results.validationErrors = validationErrors;
  results.invalidRows = validationErrors.length;

  return response.success(res, results, `Upload complete: ${results.added} added, ${results.duplicates} duplicates, ${validationErrors.length} invalid rows`);
});

// PATCH /api/students/:id — update student (admin)
const updateOne = asyncHandler(async (req, res) => {
  const student = await studentsService.updateOne(req.params.id, req.body);
  return response.success(res, student, 'Student updated');
});

// DELETE /api/students/:id — delete student (admin)
const deleteOne = asyncHandler(async (req, res) => {
  await studentsService.deleteOne(req.params.id);
  return response.success(res, null, 'Student deleted successfully');
});

module.exports = { getAll, getStats, getOne, verify, createOne, bulkUpload, updateOne, deleteOne };
