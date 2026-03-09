const mysql = require('mysql2/promise');
require('dotenv').config();

const runMigrations = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  try {
    console.log('🚀 Starting database migration...');

    // Create DB if not exists
    try {
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } catch (e) { /* managed DB — ignore */ }
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    // ── USERS ──────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           VARCHAR(36)  PRIMARY KEY,
        name         VARCHAR(255) NOT NULL,
        email        VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role         ENUM('admin','user') NOT NULL DEFAULT 'user',
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role  (role)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table users created/verified');

    // ── STUDENTS ───────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id                    VARCHAR(36)  PRIMARY KEY,
        certificate_id        VARCHAR(50)  NOT NULL UNIQUE,
        student_name          VARCHAR(255) NOT NULL,
        email                 VARCHAR(255) NOT NULL,
        domain                VARCHAR(255) NOT NULL,
        internship_start_date VARCHAR(50)  NOT NULL,
        internship_end_date   VARCHAR(50)  NOT NULL,
        issued_date           VARCHAR(50),
        status                ENUM('active','revoked') NOT NULL DEFAULT 'active',
        created_by            VARCHAR(36),
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_cert_id (certificate_id),
        INDEX idx_status  (status),
        INDEX idx_email   (email)
      ) ENGINE=InnoDB
    `);
    console.log('✅ Table students created/verified');

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await connection.end();
  }
};

runMigrations().catch(console.error);
