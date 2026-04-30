# Hospital Management — Network Security Project (Design)

**Date:** 2026-05-01
**Course:** Network Security
**Project Domain:** Hospital Management System
**Language Used:** PHP 8+ / MySQL / Bootstrap 5

## 1. Goals

Build a small hospital-management web app whose primary purpose is to demonstrate four graded security mechanisms:

1. Password Security using Salt and Hashing (5 pts)
2. Authentication Mechanism (5 pts)
3. Role-Based Access Control / RBAC (5 pts)
4. User Permissions Management (5 pts)

The hospital domain is intentionally minimal — security is the focus.

## 2. Roles & Permissions

Three roles:

- **Admin** — full system access. CRUDs users, roles, permissions, patients, appointments.
- **Manager (Doctor)** — CRUD patients and appointments. Cannot manage users/roles.
- **User (Patient)** — view own profile and own appointments only (read-only).

Permissions are decoupled from roles and stored in DB so the admin can change them at runtime.

| Permission              | Admin | Manager | User |
|-------------------------|:-----:|:-------:|:----:|
| `manage_users`          |  ✅   |   ❌    |  ❌  |
| `manage_roles`          |  ✅   |   ❌    |  ❌  |
| `manage_permissions`    |  ✅   |   ❌    |  ❌  |
| `manage_patients`       |  ✅   |   ✅    |  ❌  |
| `manage_appointments`   |  ✅   |   ✅    |  ❌  |
| `view_own_appointments` |  ❌   |   ❌    |  ✅  |

`view_own_appointments` is granted only to the `user` role; admins and managers already have the broader `manage_appointments` permission, which lets them see all appointments.

## 3. Architecture

Flat PHP files with shared includes. No framework. Apache + MySQL via XAMPP.

```
hospital-security/
├── config/
│   └── db.php                 ← PDO connection
├── includes/
│   ├── auth.php               ← session check + RBAC helpers
│   ├── csrf.php               ← CSRF token helpers
│   ├── header.php             ← Bootstrap nav (role-aware)
│   └── footer.php
├── public/
│   ├── login.php
│   ├── register.php
│   ├── logout.php
│   ├── dashboard.php          ← role-based redirect
│   ├── 403.php
│   ├── admin/
│   │   ├── index.php
│   │   ├── users.php
│   │   ├── roles.php
│   │   ├── permissions.php
│   │   ├── patients.php
│   │   └── appointments.php
│   ├── manager/
│   │   ├── index.php
│   │   ├── patients.php
│   │   └── appointments.php
│   └── user/
│       ├── index.php
│       └── appointments.php
├── sql/
│   └── schema.sql
└── README.md
```

## 4. Database Schema

```sql
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
```

Seed data: three roles (`admin`, `manager`, `user`), six permissions, default role-permission assignments matching the table in section 2, and one bootstrap admin user.

## 5. Security Implementation

### 5.1 Password Security: Salt + Hashing (5 pts)

- Per-user random salt: `bin2hex(random_bytes(16))` — 32 hex chars from CSPRNG.
- Hash: `hash('sha256', $salt . $password)` — 64 hex chars.
- Stored in two separate columns (`salt`, `password_hash`) so the salt is visibly inspectable in phpMyAdmin during the demo.
- Verification uses `hash_equals()` for constant-time comparison (timing-attack safe).

Property to demonstrate: registering two users with the same password produces two different hashes because the salts differ.

### 5.2 Authentication Mechanism (5 pts)

- Session-based (PHP `$_SESSION`).
- On login success:
  - `session_regenerate_id(true)` — prevents session fixation.
  - Store `user_id`, `username`, `role`, `permissions[]`, `user_agent`.
- Every protected page calls `require_login()`, which:
  - Sends `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` and `Pragma: no-cache` (prevents browser cache from showing protected pages after logout).
  - Redirects to `login.php` if no session.
  - Compares stored `user_agent` to current — destroys session if changed (basic hijack mitigation).
- Logout (`logout.php`):
  - `$_SESSION = []`, `session_unset()`, `session_destroy()`.
  - Expires the session cookie via `setcookie()` with past expiry.
- Session cookie flags: `HttpOnly`, `SameSite=Strict`, `Secure` if HTTPS.

This is what stops the "paste admin URL in another tab after logout" attack: the destroyed session means `require_login()` redirects to login, and Cache-Control headers prevent the browser from rendering a cached copy of the admin page.

### 5.3 RBAC (5 pts)

Three helper functions in `includes/auth.php`:

```php
require_role(array $allowed_roles)       // role-level guard
require_permission(string $permission)   // permission-level guard
has_permission(string $permission): bool // for UI nav rendering
```

Every protected page calls `require_role()` and/or `require_permission()` at the top before any output. The Bootstrap nav uses `has_permission()` to conditionally render links — but UI hiding is cosmetic; server-side guards are the real enforcement.

### 5.4 User Permissions Management (5 pts)

`admin/permissions.php`: a checkbox grid where rows are permissions and columns are roles. Saving rebuilds the affected rows in `role_permissions`. Effect applies to subsequent logins (or refresh-permissions action that re-pulls into session).

`admin/users.php`: edit user form includes a role dropdown to reassign a user's role.

This proves permissions are runtime data, not hardcoded — the admin can demo granting/revoking a permission live.

### 5.5 Defense-in-depth (no extra points but good hygiene)

- **CSRF tokens** on every state-changing form (POST). Token stored in session, validated on submit.
- **Prepared statements** (PDO) everywhere. No string concatenation in SQL.
- **`htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`** on every echoed user-controlled value.
- **Session cookie:** HttpOnly + SameSite=Strict.

## 6. Page Access Matrix

| Page                      | Required Guard                      |
|---------------------------|-------------------------------------|
| `login.php`               | public; if logged in → dashboard    |
| `register.php`            | public                              |
| `logout.php`              | logged in                           |
| `dashboard.php`           | logged in (routes by role)          |
| `403.php`                 | public                              |
| `admin/index.php`         | `require_role(['admin'])`           |
| `admin/users.php`         | `require_permission('manage_users')` |
| `admin/roles.php`         | `require_permission('manage_roles')` |
| `admin/permissions.php`   | `require_permission('manage_permissions')` |
| `admin/patients.php`      | `require_permission('manage_patients')` |
| `admin/appointments.php`  | `require_permission('manage_appointments')` |
| `manager/index.php`       | `require_role(['manager'])`         |
| `manager/patients.php`    | `require_permission('manage_patients')` |
| `manager/appointments.php`| `require_permission('manage_appointments')` |
| `user/index.php`          | `require_role(['user'])`            |
| `user/appointments.php`   | `require_permission('view_own_appointments')` |

## 7. Demo Flow (for grading)

1. **Show DB in phpMyAdmin** — point at `salt` and `password_hash` columns. Register two users with the same password; show that the hashes differ.
2. **Register** a new patient (default role `user`). Show the new row's salt and hash.
3. **Login as the new user.** Land on the user dashboard. Show only allowed nav links.
4. **Logout test** (the URL-bypass scenario the user asked about):
   - Logout.
   - In a new tab, paste `http://localhost/hospital-security/public/admin/users.php` → redirected to login.
   - Press browser back to the cached admin page → also redirected (Cache-Control prevents cache).
5. **Login as admin** — demo CRUD on users, roles, patients, appointments.
6. **Live permission revoke:** in `admin/permissions.php`, uncheck `manage_patients` for the manager role and save. Log in as a manager → "Manage Patients" link is gone; pasting the manager-patients URL hits the 403 page.
7. **Show role-aware nav** — the same `header.php` is rendered differently for each role.

## 8. Out of Scope

- Email verification, password reset flow.
- Multi-factor authentication.
- HTTPS configuration (assumed local XAMPP demo; cookie `Secure` flag set conditionally).
- Audit log of admin actions.
- Patient self-booking flow.

These are noted only so the scope is explicit; they are not part of this project.

## 9. Setup Summary

1. Install XAMPP, start Apache + MySQL.
2. Create DB: import `sql/schema.sql` via phpMyAdmin.
3. Drop the project into `htdocs/hospital-security/`.
4. Edit `config/db.php` with DB credentials.
5. Visit `http://localhost/hospital-security/public/login.php`.
6. Bootstrap admin credentials are seeded in `schema.sql` (default: username `admin`, password `Admin@123` — change after first login).
