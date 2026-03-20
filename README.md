CertVerify API

Backend API for the CertVerify Certificate Verification System.
This system allows organizations to create, manage, and verify internship certificates securely.

The API handles:

Admin authentication

Student certificate management

Certificate verification

Excel bulk upload

Certificate status (Active / Revoked)

Tech Stack:

Node.js

Express.js

MySQL

JWT Authentication

XLSX (Excel Upload)

dotenv

Project Structure:

CERTI_VERIFY_API
│
├── src
│   ├── config
│   │   └── database.js
│   │
│   ├── database
│   │   └── migrate.js
│   │
│   ├── middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   │
│   ├── modules
│   │   ├── auth
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── User.model.js
│   │   │
│   │   └── students
│   │       ├── Student.model.js
│   │       ├── students.controller.js
│   │       ├── students.routes.js
│   │       └── students.service.js
│   │
│   ├── utils
│   │   ├── helpers.js
│   │   └── response.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
└── README.md

Features:

Admin authentication (Register / Login)

Create internship certificates

Bulk upload students via Excel

Certificate verification using Certificate ID

Certificate status management (Active / Revoked)

RESTful API structure

Secure environment configuration

Environment Variables


Create a .env file in the root directory.

PORT=5002

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=cert_verify_db

JWT_SECRET=your_secret_key


