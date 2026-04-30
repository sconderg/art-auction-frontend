DROP DATABASE IF EXISTS hospital_security;
CREATE DATABASE hospital_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_security;

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role_id INT NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('male','female') NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Seed roles
INSERT INTO roles (name, description) VALUES
  ('admin',   'Full system access'),
  ('manager', 'Doctor: manages patients and appointments'),
  ('user',    'Patient: views own appointments');

-- Seed permissions
INSERT INTO permissions (name, description) VALUES
  ('manage_users',         'Create, read, update, delete users'),
  ('manage_roles',         'Create, read, update, delete roles'),
  ('manage_permissions',   'Assign permissions to roles'),
  ('manage_patients',      'CRUD patients'),
  ('manage_appointments',  'CRUD appointments'),
  ('view_own_appointments','View own appointments only');

-- Default role-permission assignments
-- admin: all six
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name='admin';

-- manager: manage_patients, manage_appointments
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name='manager' AND p.name IN ('manage_patients','manage_appointments');

-- user: view_own_appointments
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name='user' AND p.name='view_own_appointments';

-- Bootstrap admin (salt + hash filled in by Task 2 step 2)
-- username: admin, password: Admin@123
INSERT INTO users (username, email, salt, password_hash, role_id, full_name) VALUES (
  'admin',
  'admin@hospital.local',
  '7493b27e4ac53f9f6451fd87440cd366',
  'd43b1260bc0ac4998cbfe6943ed0b85a5aad9344f8c3ed2c555d650270ddfffd',
  (SELECT id FROM roles WHERE name='admin'),
  'System Administrator'
);
