# Hospital Management — Network Security Project

PHP/MySQL web app demonstrating salt+hash password security, session-based
authentication, role-based access control, and runtime user-permissions
management.

## Setup (XAMPP)

1. Install XAMPP (Apache + MySQL + PHP 8+).
2. Copy this folder into `XAMPP/htdocs/hospital-security/`.
3. Start Apache and MySQL from the XAMPP control panel.
4. Open phpMyAdmin (`http://localhost/phpmyadmin`), Import, choose
   `sql/schema.sql`, Go.
5. Edit `config/db.php` if your MySQL user/password differs from XAMPP defaults.
6. Visit `http://localhost/hospital-security/public/login.php`.

## Default credentials

- **Admin** — username `admin`, password `Admin@123`
  (change immediately after first login)

## Features mapped to graded sections

| Section (5 pts each)              | Where to look |
|-----------------------------------|---------------|
| Password Security: Salt + Hashing | `includes/auth.php` -> `hash_password()` / `verify_password()`; visible `salt` and `password_hash` columns in DB |
| Authentication Mechanism          | `includes/auth.php` -> `login_user()`, `logout_user()`, `require_login()` with anti-cache headers |
| RBAC                              | `includes/auth.php` -> `require_role()`, `require_permission()`; guards at top of every protected page |
| User Permissions Management       | `public/admin/permissions.php` — runtime checkbox grid for role-permission |

## Demo flow

1. **Show DB:** open `users` table in phpMyAdmin, point at the `salt` column
   (different per user) and `password_hash` column.
2. **Register** two users with the same password, show that the resulting
   hashes differ (because of unique salts).
3. **Login as admin**, demo CRUD on users, roles, patients, and appointments.
4. **The URL-bypass test:**
    - Stay logged in as admin and visit `admin/users.php`.
    - Click Logout, redirected to login page.
    - In a new tab, paste the `admin/users.php` URL, redirected back to login.
    - Press the browser back button, also redirected (Cache-Control headers
      prevent the browser from showing the cached page).
5. **Live permission revoke:**
    - Open `admin/permissions.php`.
    - Uncheck `manage_patients` for the manager role, save.
    - Login as a manager: "Patients" link is gone; pasting the
      `manager/patients.php` URL hits the 403 page.
6. **Role-aware nav:** the same `header.php` is rendered differently for each
   role — admin sees Users/Roles/Permissions/Patients/Appointments; manager
   sees only Patients/Appointments; user sees only "My Appointments."

## Folder layout

- `config/db.php` — PDO connection.
- `includes/` — auth helpers, CSRF helpers, header/footer.
- `public/` — entry pages, organized into `admin/`, `manager/`, `user/`.
- `sql/schema.sql` — DB schema and seed data.
- `tests/` — small PHP scripts that exercise the security helpers.

## Security checklist

- Per-user random salt (`random_bytes(16)`)
- SHA-256 hashing
- Constant-time comparison (`hash_equals`)
- Session regeneration on login (anti-fixation)
- Session bound to user agent (basic anti-hijack)
- HttpOnly + SameSite=Strict cookie flags
- Anti-cache headers on protected pages (post-logout URL-bypass blocked)
- CSRF tokens on every state-changing form
- Prepared statements everywhere (no SQL injection)
- `htmlspecialchars()` on all output (no XSS)
