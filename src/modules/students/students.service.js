
const { pool } = require('../../config/database');
const { generateCertificateId } = require('../../utils/helpers');

const getAll = async ({ page = 1, limit = 50, search = '' }) => {
  const offset = (page - 1) * limit;
  let whereClause = '';
  let params = [];

  if (search) {
    whereClause = `WHERE student_name LIKE ? OR email LIKE ? OR certificate_id LIKE ? OR domain LIKE ?`;
    const s = `%${search}%`;
    params = [s, s, s, s];
  }

  const [students] = await pool.query(
    `SELECT * FROM students ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM students ${whereClause}`,
    params
  );

  return {
    students,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
  if (!rows.length) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const searchByCertificateId = async (certId) => {
  const [rows] = await pool.query(
    'SELECT * FROM students WHERE certificate_id = ?',
    [certId.toUpperCase().trim()]
  );
  if (!rows.length) {
    const err = new Error('Certificate not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
};

const createOne = async (data, createdBy) => {
  const certId = (data.certificateId || generateCertificateId()).toUpperCase().trim();

  const [existing] = await pool.query(
    'SELECT id FROM students WHERE certificate_id = ?', [certId]
  );
  if (existing.length) {
    const err = new Error(`Certificate ID ${certId} already exists`);
    err.status = 409;
    throw err;
  }

  const id = require('crypto').randomUUID();
  const issuedDate = data.issuedDate || new Date().toISOString().split('T')[0];

  await pool.query(
    `INSERT INTO students (id, certificate_id, student_name, email, domain, internship_start_date, internship_end_date, issued_date, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    [id, certId, data.studentName.trim(), data.email.trim().toLowerCase(), data.domain.trim(),
     data.internshipStartDate, data.internshipEndDate, issuedDate, createdBy || null]
  );

  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
  return rows[0];
};

const bulkCreate = async (rows, createdBy) => {
  const results = { added: 0, duplicates: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const certId = (row.certificateId || generateCertificateId()).toUpperCase().trim();
      const [existing] = await pool.query(
        'SELECT id FROM students WHERE certificate_id = ?', [certId]
      );
      if (existing.length) {
        results.duplicates++;
        continue;
      }

      const id = require('crypto').randomUUID();
      const issuedDate = row.issuedDate || new Date().toISOString().split('T')[0];
      await pool.query(
        `INSERT INTO students (id, certificate_id, student_name, email, domain, internship_start_date, internship_end_date, issued_date, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [id, certId, row.studentName.trim(), row.email.trim().toLowerCase(), row.domain.trim(),
         row.internshipStartDate, row.internshipEndDate, issuedDate, createdBy || null]
      );
      results.added++;
    } catch (err) {
      results.errors.push({ row: i + 2, message: err.message });
    }
  }

  return results;
};

const updateOne = async (id, data) => {
  const [exists] = await pool.query('SELECT id FROM students WHERE id = ?', [id]);
  if (!exists.length) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }

  const allowed = ['studentName', 'email', 'domain', 'internshipStartDate', 'internshipEndDate', 'status', 'issuedDate'];
  const colMap = {
    studentName: 'student_name', email: 'email', domain: 'domain',
    internshipStartDate: 'internship_start_date', internshipEndDate: 'internship_end_date',
    status: 'status', issuedDate: 'issued_date',
  };

  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      setClauses.push(`${colMap[key]} = ?`);
      values.push(data[key]);
    }
  }
  if (!setClauses.length) {
    const err = new Error('No valid fields to update');
    err.status = 400;
    throw err;
  }

  values.push(id);
  await pool.query(`UPDATE students SET ${setClauses.join(', ')} WHERE id = ?`, values);

  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
  return rows[0];
};

const deleteOne = async (id) => {
  const [exists] = await pool.query('SELECT id FROM students WHERE id = ?', [id]);
  if (!exists.length) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }
  await pool.query('DELETE FROM students WHERE id = ?', [id]);
};

const getStats = async () => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM students');
  const [[{ active }]] = await pool.query("SELECT COUNT(*) AS active FROM students WHERE status='active'");
  const [[{ revoked }]] = await pool.query("SELECT COUNT(*) AS revoked FROM students WHERE status='revoked'");
  return { total, active, revoked };
};

module.exports = { getAll, getById, searchByCertificateId, createOne, bulkCreate, updateOne, deleteOne, getStats };
