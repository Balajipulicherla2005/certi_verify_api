const XLSX = require("xlsx");
const studentsService = require("./students.service");
const response = require("../../utils/response");
const { asyncHandler } = require("../../utils/helpers");
const { pool } = require("../../config/database");

/* ───────── GET ALL STUDENTS (ADMIN) ───────── */

const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "" } = req.query;

  const result = await studentsService.getAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
  });

  return response.success(res, result, "Students retrieved");
});

/* ───────── GET DASHBOARD STATS ───────── */

const getStats = asyncHandler(async (req, res) => {
  const stats = await studentsService.getStats();
  return response.success(res, stats, "Stats retrieved");
});

/* ───────── VERIFY CERTIFICATE (PUBLIC) ───────── */

const verify = asyncHandler(async (req, res) => {
  const { certId } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM students WHERE certificate_id = ?",
    [certId]
  );

  if (!rows || rows.length === 0) {
    return res.status(404).json({
      message: "Certificate Not Found",
    });
  }

  return response.success(res, rows[0], "Certificate verified successfully");
});

/* ───────── GET SINGLE STUDENT ───────── */

const getOne = asyncHandler(async (req, res) => {
  const student = await studentsService.getById(req.params.id);
  return response.success(res, student, "Student retrieved");
});

/* ───────── CREATE STUDENT ───────── */

const createOne = asyncHandler(async (req, res) => {
  const student = await studentsService.createOne(req.body, req.user.id);
  return response.created(res, student, "Student added successfully");
});

/* ───────── BULK EXCEL UPLOAD ───────── */

const bulkUpload = asyncHandler(async (req, res) => {
  if (!req.file) return response.badRequest(res, "No file uploaded");

  let rows;

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    rows = XLSX.utils.sheet_to_json(sheet);
  } catch (err) {
    return response.badRequest(res, "Failed to parse Excel/CSV file");
  }

  if (!rows || rows.length === 0)
    return response.badRequest(res, "Excel file is empty");

  const validRows = [];
  const validationErrors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    const name = String(
      row["Student Name"] || row["student_name"] || row["Name"] || row["name"] || ""
    ).trim();

    const email = String(row["Email"] || row["email"] || "").trim();
    const domain = String(
      row["Domain"] || row["domain"] || row["Internship Domain"] || ""
    ).trim();

    const startDate = String(
      row["Start Date"] || row["start_date"] || row["Internship Start Date"] || ""
    ).trim();

    const endDate = String(
      row["End Date"] || row["end_date"] || row["Internship End Date"] || ""
    ).trim();

    const certId = String(row["Certificate ID"] || row["certificate_id"] || "").trim();

    const errs = [];

    if (!name) errs.push("Student Name is required");

    if (!email) errs.push("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.push("Invalid email");

    if (!domain) errs.push("Domain is required");

    if (!startDate) errs.push("Start Date is required");
    if (!endDate) errs.push("End Date is required");

    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      errs.push("Start date must be before end date");

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
        issuedDate: new Date().toISOString().split("T")[0],
      });
    }
  });

  const results = await studentsService.bulkCreate(validRows, req.user.id);

  results.validationErrors = validationErrors;
  results.invalidRows = validationErrors.length;

  return response.success(
    res,
    results,
    `Upload complete: ${results.added} added, ${results.duplicates} duplicates, ${validationErrors.length} invalid rows`
  );
});

/* ───────── UPDATE STUDENT ───────── */

const updateOne = asyncHandler(async (req, res) => {
  const student = await studentsService.updateOne(req.params.id, req.body);
  return response.success(res, student, "Student updated");
});

/* ───────── DELETE STUDENT ───────── */

const deleteOne = asyncHandler(async (req, res) => {
  await studentsService.deleteOne(req.params.id);
  return response.success(res, null, "Student deleted successfully");
});

module.exports = {
  getAll,
  getStats,
  getOne,
  verify,
  createOne,
  bulkUpload,
  updateOne,
  deleteOne,
};