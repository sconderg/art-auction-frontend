# Hospital Network Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PHP/MySQL hospital management web app demonstrating salt+hash password security, session-based authentication, RBAC, and runtime user-permissions management for a Network Security university project.

**Architecture:** Flat PHP files with shared includes for auth/CSRF/layout. PDO + prepared statements. Bootstrap 5 via CDN. Sessions with anti-cache headers and post-logout URL-bypass protection.

**Tech Stack:** PHP 8+, MySQL 5.7+/MariaDB, Bootstrap 5 (CDN), XAMPP for local hosting.

**Spec:** [docs/superpowers/specs/2026-05-01-hospital-network-security-design.md](../specs/2026-05-01-hospital-network-security-design.md)

**Testing approach:** This is a PHP web project demoed manually. Each task includes either a small standalone PHP script in `tests/` (for security helper functions) or explicit manual verification steps (URL + action + expected result) for pages.

---

## Task 1: Initialize project + git

**Files:**
- Create: `.gitignore`
- Create: `README.md` (placeholder; finalized in last task)

- [ ] **Step 1: Initialize git repository**

```bash
cd /Users/sconder/workstation/personal/project-universty
git init
git branch -M main
```

- [ ] **Step 2: Create `.gitignore`**

```
# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Secrets / local config
config/db.local.php

# Logs
*.log
```

- [ ] **Step 3: Create placeholder README**

```markdown
# Hospital Management — Network Security Project

Setup and demo instructions are at the end of this README (filled in after implementation).
```

- [ ] **Step 4: First commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initial commit with spec and plan"
```

---

## Task 2: Database schema + seed data

**Files:**
- Create: `sql/schema.sql`
- Create: `sql/generate_admin_seed.php` (one-time helper to generate the seeded admin's salt and hash)

- [ ] **Step 1: Write `sql/schema.sql` with all tables**

```sql
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
  '__PLACEHOLDER_SALT__',
  '__PLACEHOLDER_HASH__',
  (SELECT id FROM roles WHERE name='admin'),
  'System Administrator'
);
```

- [ ] **Step 2: Write `sql/generate_admin_seed.php` to compute the seed values**

```php
<?php
// Run once: php sql/generate_admin_seed.php
// Generates the salt+hash for the bootstrap admin and patches schema.sql.
$password = 'Admin@123';
$salt     = bin2hex(random_bytes(16));
$hash     = hash('sha256', $salt . $password);

$schemaPath = __DIR__ . '/schema.sql';
$contents   = file_get_contents($schemaPath);
$contents   = str_replace('__PLACEHOLDER_SALT__', $salt, $contents);
$contents   = str_replace('__PLACEHOLDER_HASH__', $hash, $contents);
file_put_contents($schemaPath, $contents);

echo "Patched schema.sql\n";
echo "Salt: $salt\n";
echo "Hash: $hash\n";
```

- [ ] **Step 3: Run the seed generator**

Run: `php sql/generate_admin_seed.php`
Expected: prints salt + hash, schema.sql now has real values where the placeholders were.

- [ ] **Step 4: Verify placeholders are gone**

Run: `grep PLACEHOLDER sql/schema.sql`
Expected: no output (exit code 1).

- [ ] **Step 5: Commit**

```bash
git add sql/
git commit -m "feat: database schema with seed roles/permissions and bootstrap admin"
```

---

## Task 3: Database connection helper

**Files:**
- Create: `config/db.php`

- [ ] **Step 1: Write `config/db.php`**

```php
<?php
// PDO connection. Edit these constants for your local MySQL setup.
const DB_HOST = '127.0.0.1';
const DB_NAME = 'hospital_security';
const DB_USER = 'root';
const DB_PASS = '';   // XAMPP default is empty; change for your setup
const DB_PORT = 3306;

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            DB_HOST, DB_PORT, DB_NAME
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}
```

- [ ] **Step 2: Smoke-test the connection**

Create a temp file `tests/test_db.php`:

```php
<?php
require __DIR__ . '/../config/db.php';
$row = db()->query('SELECT COUNT(*) AS c FROM roles')->fetch();
echo "Roles in DB: " . $row['c'] . "\n";
```

Run: `php tests/test_db.php`
Expected: `Roles in DB: 3`

- [ ] **Step 3: Commit**

```bash
git add config/db.php tests/test_db.php
git commit -m "feat: PDO database connection helper"
```

---

## Task 4: Password hash + verify helpers (with tests)

**Files:**
- Create: `includes/auth.php` (initial: just hash helpers)
- Create: `tests/test_password.php`

- [ ] **Step 1: Write the failing test first**

Create `tests/test_password.php`:

```php
<?php
require __DIR__ . '/../includes/auth.php';

// Test 1: hash_password returns array with salt + hash
$result = hash_password('Hello@123');
assert(isset($result['salt']),    'expected salt key');
assert(isset($result['hash']),    'expected hash key');
assert(strlen($result['salt']) === 32, 'salt should be 32 hex chars');
assert(strlen($result['hash']) === 64, 'hash should be 64 hex chars (sha256)');

// Test 2: verify_password matches
$h = hash_password('mypass');
assert(verify_password('mypass', $h['salt'], $h['hash']) === true,  'correct password should verify');
assert(verify_password('wrong',  $h['salt'], $h['hash']) === false, 'wrong password should fail');

// Test 3: same password produces different hashes (because of unique salt)
$a = hash_password('same_password');
$b = hash_password('same_password');
assert($a['salt'] !== $b['salt'], 'salts should differ');
assert($a['hash'] !== $b['hash'], 'hashes should differ even with same password');

echo "All password tests passed\n";
```

- [ ] **Step 2: Run the test, watch it fail**

Run: `php tests/test_password.php`
Expected: PHP error/notice that `hash_password` is not defined.

- [ ] **Step 3: Implement hash_password + verify_password**

Create `includes/auth.php`:

```php
<?php
// Network-Security project — security helpers.

function hash_password(string $password): array {
    $salt = bin2hex(random_bytes(16));
    $hash = hash('sha256', $salt . $password);
    return ['salt' => $salt, 'hash' => $hash];
}

function verify_password(string $password, string $salt, string $expected_hash): bool {
    $computed = hash('sha256', $salt . $password);
    return hash_equals($expected_hash, $computed);
}
```

- [ ] **Step 4: Run test, expect pass**

Run: `php tests/test_password.php`
Expected: `All password tests passed`

- [ ] **Step 5: Commit**

```bash
git add includes/auth.php tests/test_password.php
git commit -m "feat: password salt+hash helpers with tests"
```

---

## Task 5: Session + RBAC helpers

**Files:**
- Modify: `includes/auth.php` (append session/RBAC functions)

- [ ] **Step 1: Append session helpers to `includes/auth.php`**

Append (after `verify_password`):

```php
function start_secure_session(): void {
    if (session_status() !== PHP_SESSION_NONE) return;
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Strict',
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_start();
}

function login_user(array $user, string $role_name, array $permissions): void {
    start_secure_session();
    session_regenerate_id(true);
    $_SESSION['user_id']     = (int) $user['id'];
    $_SESSION['username']    = $user['username'];
    $_SESSION['full_name']   = $user['full_name'] ?? $user['username'];
    $_SESSION['role']        = $role_name;
    $_SESSION['permissions'] = $permissions;
    $_SESSION['user_agent']  = $_SERVER['HTTP_USER_AGENT'] ?? '';
}

function logout_user(): void {
    start_secure_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
}

function require_login(): void {
    start_secure_session();
    // Anti-cache headers — required for the post-logout URL-bypass test.
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    if (!isset($_SESSION['user_id'])) {
        header('Location: /hospital-security/public/login.php');
        exit;
    }
    // Bind session to user agent (basic hijack mitigation)
    if (($_SESSION['user_agent'] ?? '') !== ($_SERVER['HTTP_USER_AGENT'] ?? '')) {
        logout_user();
        header('Location: /hospital-security/public/login.php');
        exit;
    }
}

function require_role(array $allowed_roles): void {
    require_login();
    if (!in_array($_SESSION['role'] ?? '', $allowed_roles, true)) {
        header('Location: /hospital-security/public/403.php');
        exit;
    }
}

function require_permission(string $permission): void {
    require_login();
    if (!in_array($permission, $_SESSION['permissions'] ?? [], true)) {
        header('Location: /hospital-security/public/403.php');
        exit;
    }
}

function has_permission(string $permission): bool {
    return isset($_SESSION['permissions'])
        && in_array($permission, $_SESSION['permissions'], true);
}

function current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function load_permissions_for_role(int $role_id): array {
    $stmt = db()->prepare(
        'SELECT p.name FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = ?'
    );
    $stmt->execute([$role_id]);
    return array_column($stmt->fetchAll(), 'name');
}
```

- [ ] **Step 2: Add `require __DIR__ . '/../config/db.php';` at the top of `includes/auth.php`**

Edit `includes/auth.php` — change the opening to:

```php
<?php
require_once __DIR__ . '/../config/db.php';
```

- [ ] **Step 3: Smoke-test in CLI**

Append to `tests/test_db.php`:

```php
require __DIR__ . '/../includes/auth.php';
$perms = load_permissions_for_role(1);
echo "Admin role permissions: " . implode(', ', $perms) . "\n";
```

Run: `php tests/test_db.php`
Expected: lists all 6 permissions for the admin role.

- [ ] **Step 4: Commit**

```bash
git add includes/auth.php tests/test_db.php
git commit -m "feat: session and RBAC helpers"
```

---

## Task 6: CSRF token helper

**Files:**
- Create: `includes/csrf.php`

- [ ] **Step 1: Write `includes/csrf.php`**

```php
<?php
require_once __DIR__ . '/auth.php';

function csrf_token(): string {
    start_secure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') . '">';
}

function require_csrf(): void {
    start_secure_session();
    $sent = $_POST['csrf_token'] ?? '';
    if (!is_string($sent) || !hash_equals($_SESSION['csrf_token'] ?? '', $sent)) {
        http_response_code(400);
        die('CSRF token validation failed.');
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add includes/csrf.php
git commit -m "feat: CSRF token helpers"
```

---

## Task 7: Layout (header + footer with role-aware nav)

**Files:**
- Create: `includes/header.php`
- Create: `includes/footer.php`

- [ ] **Step 1: Write `includes/header.php`**

```php
<?php
require_once __DIR__ . '/auth.php';
$BASE = '/hospital-security/public';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($PAGE_TITLE ?? 'Hospital Security', ENT_QUOTES, 'UTF-8') ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container">
    <a class="navbar-brand" href="<?= $BASE ?>/dashboard.php">Hospital Security</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav me-auto">
        <?php if (isset($_SESSION['user_id'])): ?>
          <?php if (has_permission('manage_users')): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/admin/users.php">Users</a></li>
          <?php endif; ?>
          <?php if (has_permission('manage_roles')): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/admin/roles.php">Roles</a></li>
          <?php endif; ?>
          <?php if (has_permission('manage_permissions')): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/admin/permissions.php">Permissions</a></li>
          <?php endif; ?>
          <?php if (has_permission('manage_patients')): ?>
            <li class="nav-item">
              <a class="nav-link" href="<?= $BASE ?>/<?= $_SESSION['role'] ?>/patients.php">Patients</a>
            </li>
          <?php endif; ?>
          <?php if (has_permission('manage_appointments')): ?>
            <li class="nav-item">
              <a class="nav-link" href="<?= $BASE ?>/<?= $_SESSION['role'] ?>/appointments.php">Appointments</a>
            </li>
          <?php endif; ?>
          <?php if (has_permission('view_own_appointments') && $_SESSION['role'] === 'user'): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/user/appointments.php">My Appointments</a></li>
          <?php endif; ?>
        <?php endif; ?>
      </ul>
      <ul class="navbar-nav">
        <?php if (isset($_SESSION['user_id'])): ?>
          <li class="nav-item">
            <span class="navbar-text text-white-50 me-3">
              <?= htmlspecialchars($_SESSION['full_name'] ?? '', ENT_QUOTES, 'UTF-8') ?>
              <span class="badge bg-warning text-dark"><?= htmlspecialchars($_SESSION['role'], ENT_QUOTES, 'UTF-8') ?></span>
            </span>
          </li>
          <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/logout.php">Logout</a></li>
        <?php else: ?>
          <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/login.php">Login</a></li>
          <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/register.php">Register</a></li>
        <?php endif; ?>
      </ul>
    </div>
  </div>
</nav>
<main class="container py-4">
```

- [ ] **Step 2: Write `includes/footer.php`**

```php
</main>
<footer class="text-center text-muted py-3 mt-5 small">
  Network Security Project — Hospital Management
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add includes/
git commit -m "feat: bootstrap layout with role-aware navigation"
```

---

## Task 8: Login page

**Files:**
- Create: `public/login.php`

- [ ] **Step 1: Write `public/login.php`**

```php
<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';
start_secure_session();

if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Username and password are required.';
    } else {
        $stmt = db()->prepare(
            'SELECT u.*, r.name AS role_name, r.id AS role_id
             FROM users u JOIN roles r ON r.id = u.role_id
             WHERE u.username = ?'
        );
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && verify_password($password, $user['salt'], $user['password_hash'])) {
            $perms = load_permissions_for_role((int) $user['role_id']);
            login_user($user, $user['role_name'], $perms);
            header('Location: dashboard.php');
            exit;
        }
        $error = 'Invalid username or password.';
    }
}

$PAGE_TITLE = 'Login';
require __DIR__ . '/../includes/header.php';
?>
<div class="row justify-content-center">
  <div class="col-md-5">
    <div class="card shadow-sm">
      <div class="card-body">
        <h3 class="card-title mb-3">Login</h3>
        <?php if ($error): ?>
          <div class="alert alert-danger"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <form method="post">
          <?= csrf_field() ?>
          <div class="mb-3">
            <label class="form-label">Username</label>
            <input type="text" name="username" class="form-control" required autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-control" required>
          </div>
          <button class="btn btn-primary w-100" type="submit">Login</button>
        </form>
        <p class="mt-3 text-center small">
          No account? <a href="register.php">Register here</a>
        </p>
      </div>
    </div>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

Start XAMPP (Apache + MySQL). Place project in `htdocs/hospital-security/`. Import `sql/schema.sql` via phpMyAdmin.

Visit: `http://localhost/hospital-security/public/login.php`
1. Login with `admin` / `Admin@123` → should redirect to dashboard.php (will 404 until Task 10, expected for now).
2. Login with bad password → should show "Invalid username or password."
3. View page source while logged out → confirm CSRF token is in the form.

- [ ] **Step 3: Commit**

```bash
git add public/login.php
git commit -m "feat: login page with CSRF and constant-time password verify"
```

---

## Task 9: Register page

**Files:**
- Create: `public/register.php`

- [ ] **Step 1: Write `public/register.php`**

```php
<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/csrf.php';
start_secure_session();

if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $username  = trim($_POST['username'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $full_name = trim($_POST['full_name'] ?? '');
    $password  = $_POST['password'] ?? '';
    $confirm   = $_POST['confirm'] ?? '';

    if ($username === '' || $email === '' || $password === '') {
        $error = 'Username, email, and password are required.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Invalid email address.';
    } elseif (strlen($password) < 8) {
        $error = 'Password must be at least 8 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        $check = db()->prepare('SELECT COUNT(*) FROM users WHERE username=? OR email=?');
        $check->execute([$username, $email]);
        if ($check->fetchColumn() > 0) {
            $error = 'Username or email already in use.';
        } else {
            $hp = hash_password($password);
            $role = db()->query("SELECT id FROM roles WHERE name='user'")->fetch();
            $insert = db()->prepare(
                'INSERT INTO users (username, email, salt, password_hash, role_id, full_name)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $insert->execute([
                $username, $email, $hp['salt'], $hp['hash'],
                (int) $role['id'], $full_name,
            ]);
            $success = 'Account created. You can now log in.';
        }
    }
}

$PAGE_TITLE = 'Register';
require __DIR__ . '/../includes/header.php';
?>
<div class="row justify-content-center">
  <div class="col-md-6">
    <div class="card shadow-sm">
      <div class="card-body">
        <h3 class="card-title mb-3">Register (Patient Account)</h3>
        <?php if ($error): ?>
          <div class="alert alert-danger"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>
        <?php if ($success): ?>
          <div class="alert alert-success"><?= htmlspecialchars($success, ENT_QUOTES, 'UTF-8') ?>
            <a href="login.php">Login</a>.
          </div>
        <?php endif; ?>
        <form method="post">
          <?= csrf_field() ?>
          <div class="mb-3"><label class="form-label">Username</label>
            <input type="text" name="username" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Full name</label>
            <input type="text" name="full_name" class="form-control"></div>
          <div class="mb-3"><label class="form-label">Email</label>
            <input type="email" name="email" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Password (min 8 chars)</label>
            <input type="password" name="password" class="form-control" required></div>
          <div class="mb-3"><label class="form-label">Confirm password</label>
            <input type="password" name="confirm" class="form-control" required></div>
          <button class="btn btn-success w-100" type="submit">Create account</button>
        </form>
      </div>
    </div>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

Visit: `http://localhost/hospital-security/public/register.php`
1. Submit form with valid data — see success.
2. In phpMyAdmin: open `users` table — confirm new row has unique `salt` (different from admin's salt) and 64-char `password_hash`.
3. Try duplicate username — "already in use".
4. Try mismatched passwords — "do not match".

- [ ] **Step 3: Commit**

```bash
git add public/register.php
git commit -m "feat: register page (creates user role, salts+hashes password)"
```

---

## Task 10: Logout, dashboard router, 403 page

**Files:**
- Create: `public/logout.php`
- Create: `public/dashboard.php`
- Create: `public/403.php`

- [ ] **Step 1: Write `public/logout.php`**

```php
<?php
require_once __DIR__ . '/../includes/auth.php';
logout_user();
header('Location: login.php');
exit;
```

- [ ] **Step 2: Write `public/dashboard.php`**

```php
<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

switch ($_SESSION['role']) {
    case 'admin':   header('Location: admin/index.php'); exit;
    case 'manager': header('Location: manager/index.php'); exit;
    case 'user':    header('Location: user/index.php'); exit;
    default:        header('Location: 403.php'); exit;
}
```

- [ ] **Step 3: Write `public/403.php`**

```php
<?php
require_once __DIR__ . '/../includes/auth.php';
start_secure_session();
http_response_code(403);
$PAGE_TITLE = 'Access Denied';
require __DIR__ . '/../includes/header.php';
?>
<div class="row justify-content-center">
  <div class="col-md-6 text-center">
    <div class="card shadow-sm border-danger">
      <div class="card-body">
        <h1 class="display-1 text-danger">403</h1>
        <h3>Access Denied</h3>
        <p>You do not have permission to view this page.</p>
        <a href="dashboard.php" class="btn btn-primary">Back to dashboard</a>
      </div>
    </div>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
```

- [ ] **Step 4: Manual verification — the URL-bypass test**

1. Login as admin.
2. Visit `http://localhost/hospital-security/public/admin/index.php` (will 404, that's fine — Task 11 creates it). Just confirm dashboard.php redirects you correctly first.
3. Click "Logout" — redirected to login.php.
4. **In a NEW tab**, paste `http://localhost/hospital-security/public/dashboard.php` — expected: redirected back to login.php.
5. Click browser back button — expected: NOT shown the cached dashboard, redirected to login again. (Cache-Control headers prevent caching.)

- [ ] **Step 5: Commit**

```bash
git add public/logout.php public/dashboard.php public/403.php
git commit -m "feat: logout, dashboard router, and 403 page"
```

---

## Task 11: Admin dashboard (index)

**Files:**
- Create: `public/admin/index.php`

- [ ] **Step 1: Write `public/admin/index.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_role(['admin']);

$counts = [
    'users'        => (int) db()->query('SELECT COUNT(*) FROM users')->fetchColumn(),
    'roles'        => (int) db()->query('SELECT COUNT(*) FROM roles')->fetchColumn(),
    'patients'     => (int) db()->query('SELECT COUNT(*) FROM patients')->fetchColumn(),
    'appointments' => (int) db()->query('SELECT COUNT(*) FROM appointments')->fetchColumn(),
];

$PAGE_TITLE = 'Admin Dashboard';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-4">Admin Dashboard</h2>
<div class="row g-3">
  <?php foreach ($counts as $label => $n): ?>
    <div class="col-md-3">
      <div class="card text-center shadow-sm">
        <div class="card-body">
          <h5 class="text-muted text-uppercase small"><?= $label ?></h5>
          <p class="display-5 mb-0"><?= $n ?></p>
        </div>
      </div>
    </div>
  <?php endforeach; ?>
</div>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

1. Login as admin — automatically lands at admin/index.php with stats cards.
2. Login as a regular user — going to admin/index.php directly redirects to /403.php.

- [ ] **Step 3: Commit**

```bash
git add public/admin/index.php
git commit -m "feat: admin dashboard with stats cards"
```

---

## Task 12: Admin — CRUD users

**Files:**
- Create: `public/admin/users.php`

- [ ] **Step 1: Write `public/admin/users.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_permission('manage_users');

$action = $_GET['action'] ?? 'list';
$id     = (int) ($_GET['id'] ?? 0);
$msg    = null;
$err    = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $do = $_POST['do'] ?? '';

    if ($do === 'create' || $do === 'update') {
        $username  = trim($_POST['username'] ?? '');
        $email     = trim($_POST['email'] ?? '');
        $full_name = trim($_POST['full_name'] ?? '');
        $role_id   = (int) ($_POST['role_id'] ?? 0);
        $password  = $_POST['password'] ?? '';

        if ($username === '' || $email === '' || $role_id === 0) {
            $err = 'Username, email, and role are required.';
        } else {
            try {
                if ($do === 'create') {
                    if (strlen($password) < 8) {
                        $err = 'Password must be at least 8 characters.';
                    } else {
                        $hp = hash_password($password);
                        $stmt = db()->prepare(
                            'INSERT INTO users (username, email, salt, password_hash, role_id, full_name)
                             VALUES (?, ?, ?, ?, ?, ?)'
                        );
                        $stmt->execute([$username, $email, $hp['salt'], $hp['hash'], $role_id, $full_name]);
                        $msg = 'User created.';
                    }
                } else {
                    $uid = (int) ($_POST['id'] ?? 0);
                    if ($password !== '') {
                        if (strlen($password) < 8) {
                            $err = 'Password must be at least 8 characters.';
                        } else {
                            $hp = hash_password($password);
                            $stmt = db()->prepare(
                                'UPDATE users SET username=?, email=?, full_name=?, role_id=?, salt=?, password_hash=? WHERE id=?'
                            );
                            $stmt->execute([$username, $email, $full_name, $role_id, $hp['salt'], $hp['hash'], $uid]);
                            $msg = 'User updated (password changed).';
                        }
                    } else {
                        $stmt = db()->prepare(
                            'UPDATE users SET username=?, email=?, full_name=?, role_id=? WHERE id=?'
                        );
                        $stmt->execute([$username, $email, $full_name, $role_id, $uid]);
                        $msg = 'User updated.';
                    }
                }
            } catch (PDOException $e) {
                $err = 'Database error: ' . $e->getMessage();
            }
            $action = 'list';
        }
    } elseif ($do === 'delete') {
        $uid = (int) ($_POST['id'] ?? 0);
        if ($uid === current_user_id()) {
            $err = 'You cannot delete your own account.';
        } else {
            db()->prepare('DELETE FROM users WHERE id=?')->execute([$uid]);
            $msg = 'User deleted.';
        }
        $action = 'list';
    }
}

$roles = db()->query('SELECT * FROM roles ORDER BY id')->fetchAll();

$PAGE_TITLE = 'Manage Users';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-3">Users</h2>
<?php if ($msg): ?><div class="alert alert-success"><?= htmlspecialchars($msg, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<?php if ($err): ?><div class="alert alert-danger"><?= htmlspecialchars($err, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>

<?php if ($action === 'add' || $action === 'edit'):
    $editing = null;
    if ($action === 'edit') {
        $stmt = db()->prepare('SELECT * FROM users WHERE id=?');
        $stmt->execute([$id]);
        $editing = $stmt->fetch();
        if (!$editing) { echo '<div class="alert alert-warning">User not found.</div>'; require __DIR__.'/../../includes/footer.php'; exit; }
    }
?>
  <div class="card"><div class="card-body">
    <h5><?= $action === 'add' ? 'Add user' : 'Edit user' ?></h5>
    <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="do" value="<?= $action === 'add' ? 'create' : 'update' ?>">
      <?php if ($editing): ?><input type="hidden" name="id" value="<?= (int) $editing['id'] ?>"><?php endif; ?>
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Username</label>
          <input name="username" class="form-control" required value="<?= htmlspecialchars($editing['username'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-md-6"><label class="form-label">Email</label>
          <input type="email" name="email" class="form-control" required value="<?= htmlspecialchars($editing['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-md-6"><label class="form-label">Full name</label>
          <input name="full_name" class="form-control" value="<?= htmlspecialchars($editing['full_name'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-md-6"><label class="form-label">Role</label>
          <select name="role_id" class="form-select" required>
            <?php foreach ($roles as $r): ?>
              <option value="<?= (int) $r['id'] ?>" <?= isset($editing) && (int) $editing['role_id'] === (int) $r['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8') ?>
              </option>
            <?php endforeach; ?>
          </select></div>
        <div class="col-md-12"><label class="form-label">
          Password <?= $action === 'edit' ? '<small class="text-muted">(leave blank to keep current)</small>' : '' ?>
        </label>
          <input type="password" name="password" class="form-control" <?= $action === 'add' ? 'required' : '' ?>></div>
      </div>
      <div class="mt-3">
        <button class="btn btn-primary"><?= $action === 'add' ? 'Create' : 'Update' ?></button>
        <a href="users.php" class="btn btn-secondary">Cancel</a>
      </div>
    </form>
  </div></div>

<?php else:
    $rows = db()->query(
        'SELECT u.*, r.name AS role_name FROM users u
         JOIN roles r ON r.id = u.role_id ORDER BY u.id'
    )->fetchAll();
?>
  <a href="users.php?action=add" class="btn btn-success mb-3">+ Add user</a>
  <div class="table-responsive"><table class="table table-striped bg-white">
    <thead><tr><th>ID</th><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Salt (preview)</th><th>Actions</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $u): ?>
      <tr>
        <td><?= (int) $u['id'] ?></td>
        <td><?= htmlspecialchars($u['username'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($u['full_name'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($u['email'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><span class="badge bg-info"><?= htmlspecialchars($u['role_name'], ENT_QUOTES, 'UTF-8') ?></span></td>
        <td><code><?= htmlspecialchars(substr($u['salt'], 0, 12), ENT_QUOTES, 'UTF-8') ?>...</code></td>
        <td>
          <a href="users.php?action=edit&id=<?= (int) $u['id'] ?>" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="post" class="d-inline" onsubmit="return confirm('Delete this user?');">
            <?= csrf_field() ?>
            <input type="hidden" name="do" value="delete">
            <input type="hidden" name="id" value="<?= (int) $u['id'] ?>">
            <button class="btn btn-sm btn-outline-danger">Delete</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table></div>
<?php endif; ?>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

Visit `http://localhost/hospital-security/public/admin/users.php` as admin:
1. List shows admin row + any registered users with role badges.
2. Click "Add user" — fill form — create. Confirm new row appears and `salt` preview is unique.
3. Edit a user (without entering password) — save — confirm fields updated, hash unchanged in DB.
4. Edit a user (with new password) — save — confirm both `salt` and `password_hash` changed in DB.
5. Try deleting yourself — blocked with error.
6. Logout — paste users.php URL — redirected to login.

- [ ] **Step 3: Commit**

```bash
git add public/admin/users.php
git commit -m "feat: admin CRUD for users with salt+hash on password change"
```

---

## Task 13: Admin — CRUD roles

**Files:**
- Create: `public/admin/roles.php`

- [ ] **Step 1: Write `public/admin/roles.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_permission('manage_roles');

$action = $_GET['action'] ?? 'list';
$id     = (int) ($_GET['id'] ?? 0);
$msg = null; $err = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $do = $_POST['do'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $desc = trim($_POST['description'] ?? '');

    try {
        if ($do === 'create') {
            db()->prepare('INSERT INTO roles (name, description) VALUES (?, ?)')->execute([$name, $desc]);
            $msg = 'Role created.';
        } elseif ($do === 'update') {
            $rid = (int) $_POST['id'];
            db()->prepare('UPDATE roles SET name=?, description=? WHERE id=?')->execute([$name, $desc, $rid]);
            $msg = 'Role updated.';
        } elseif ($do === 'delete') {
            $rid = (int) $_POST['id'];
            $inUse = db()->prepare('SELECT COUNT(*) FROM users WHERE role_id=?');
            $inUse->execute([$rid]);
            if ($inUse->fetchColumn() > 0) {
                $err = 'Cannot delete role: users are still assigned to it.';
            } else {
                db()->prepare('DELETE FROM roles WHERE id=?')->execute([$rid]);
                $msg = 'Role deleted.';
            }
        }
    } catch (PDOException $e) {
        $err = 'Database error: ' . $e->getMessage();
    }
    $action = 'list';
}

$PAGE_TITLE = 'Manage Roles';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-3">Roles</h2>
<?php if ($msg): ?><div class="alert alert-success"><?= htmlspecialchars($msg, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<?php if ($err): ?><div class="alert alert-danger"><?= htmlspecialchars($err, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>

<?php if ($action === 'add' || $action === 'edit'):
    $editing = null;
    if ($action === 'edit') {
        $stmt = db()->prepare('SELECT * FROM roles WHERE id=?');
        $stmt->execute([$id]);
        $editing = $stmt->fetch();
        if (!$editing) { echo '<div class="alert alert-warning">Role not found.</div>'; require __DIR__.'/../../includes/footer.php'; exit; }
    }
?>
  <div class="card"><div class="card-body">
    <h5><?= $action === 'add' ? 'Add role' : 'Edit role' ?></h5>
    <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="do" value="<?= $action === 'add' ? 'create' : 'update' ?>">
      <?php if ($editing): ?><input type="hidden" name="id" value="<?= (int) $editing['id'] ?>"><?php endif; ?>
      <div class="mb-3"><label class="form-label">Name</label>
        <input name="name" class="form-control" required value="<?= htmlspecialchars($editing['name'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
      <div class="mb-3"><label class="form-label">Description</label>
        <input name="description" class="form-control" value="<?= htmlspecialchars($editing['description'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
      <button class="btn btn-primary"><?= $action === 'add' ? 'Create' : 'Update' ?></button>
      <a href="roles.php" class="btn btn-secondary">Cancel</a>
    </form>
  </div></div>
<?php else:
    $rows = db()->query('SELECT * FROM roles ORDER BY id')->fetchAll();
?>
  <a href="roles.php?action=add" class="btn btn-success mb-3">+ Add role</a>
  <table class="table table-striped bg-white">
    <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $r): ?>
      <tr>
        <td><?= (int) $r['id'] ?></td>
        <td><?= htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($r['description'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td>
          <a href="roles.php?action=edit&id=<?= (int) $r['id'] ?>" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="post" class="d-inline" onsubmit="return confirm('Delete this role?');">
            <?= csrf_field() ?>
            <input type="hidden" name="do" value="delete">
            <input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
            <button class="btn btn-sm btn-outline-danger">Delete</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

Visit `admin/roles.php`:
1. See three seeded roles.
2. Add a new test role — appears in list.
3. Edit it — name updates.
4. Try to delete `admin` role — blocked (users assigned).
5. Delete the test role — success.

- [ ] **Step 3: Commit**

```bash
git add public/admin/roles.php
git commit -m "feat: admin CRUD for roles"
```

---

## Task 14: Admin — Permissions matrix (User Permissions Management)

**Files:**
- Create: `public/admin/permissions.php`

- [ ] **Step 1: Write `public/admin/permissions.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_permission('manage_permissions');

$msg = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $checked = $_POST['perm'] ?? [];   // perm[role_id][permission_id] = '1'

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('DELETE FROM role_permissions')->execute();
        $stmt = $pdo->prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
        foreach ($checked as $role_id => $perms) {
            foreach ($perms as $permission_id => $_v) {
                $stmt->execute([(int) $role_id, (int) $permission_id]);
            }
        }
        $pdo->commit();
        $msg = 'Permissions updated. Affected users will see changes on next login (or refresh-permissions click below).';

        // Refresh current admin's permissions in the session if applicable
        $role_id_now = (int) db()->query(
            "SELECT id FROM roles WHERE name='" . $_SESSION['role'] . "'"
        )->fetchColumn();
        $_SESSION['permissions'] = load_permissions_for_role($role_id_now);
    } catch (Throwable $e) {
        $pdo->rollBack();
        $msg = 'Error: ' . $e->getMessage();
    }
}

$roles = db()->query('SELECT * FROM roles ORDER BY id')->fetchAll();
$perms = db()->query('SELECT * FROM permissions ORDER BY id')->fetchAll();
$assigned = [];
foreach (db()->query('SELECT role_id, permission_id FROM role_permissions') as $rp) {
    $assigned[$rp['role_id']][$rp['permission_id']] = true;
}

$PAGE_TITLE = 'Manage Permissions';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-3">Permission Matrix</h2>
<p class="text-muted">Check the permissions you want each role to have. Saving rebuilds the role-to-permission table.</p>
<?php if ($msg): ?><div class="alert alert-info"><?= htmlspecialchars($msg, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<form method="post">
  <?= csrf_field() ?>
  <table class="table table-bordered bg-white align-middle">
    <thead class="table-dark">
      <tr>
        <th>Permission</th>
        <?php foreach ($roles as $r): ?>
          <th class="text-center"><?= htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8') ?></th>
        <?php endforeach; ?>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($perms as $p): ?>
        <tr>
          <td>
            <strong><?= htmlspecialchars($p['name'], ENT_QUOTES, 'UTF-8') ?></strong><br>
            <small class="text-muted"><?= htmlspecialchars($p['description'] ?? '', ENT_QUOTES, 'UTF-8') ?></small>
          </td>
          <?php foreach ($roles as $r): ?>
            <td class="text-center">
              <input type="checkbox"
                     class="form-check-input"
                     name="perm[<?= (int) $r['id'] ?>][<?= (int) $p['id'] ?>]"
                     value="1"
                     <?= !empty($assigned[$r['id']][$p['id']]) ? 'checked' : '' ?>>
            </td>
          <?php endforeach; ?>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <button class="btn btn-primary">Save permissions</button>
</form>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification — the permission revoke demo**

1. Open `admin/permissions.php` — see grid with checkboxes pre-filled per defaults.
2. Uncheck `manage_patients` for the `manager` role — save.
3. In another browser/tab, login as a manager (create one via `admin/users.php` first if needed).
4. Confirm "Patients" link is missing from the manager nav.
5. Paste `manager/patients.php` URL — redirected to /403.php.
6. Re-check the box in admin permissions page — manager regains access on next login.

- [ ] **Step 3: Commit**

```bash
git add public/admin/permissions.php
git commit -m "feat: permission matrix UI for runtime role-permission management"
```

---

## Task 15: Admin — CRUD patients

**Files:**
- Create: `public/admin/patients.php`

- [ ] **Step 1: Write `public/admin/patients.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_permission('manage_patients');

$action = $_GET['action'] ?? 'list';
$id     = (int) ($_GET['id'] ?? 0);
$msg = null; $err = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $do = $_POST['do'] ?? '';
    $full_name       = trim($_POST['full_name'] ?? '');
    $age             = (int) ($_POST['age'] ?? 0);
    $gender          = $_POST['gender'] ?? 'male';
    $phone           = trim($_POST['phone'] ?? '');
    $address         = trim($_POST['address'] ?? '');
    $medical_history = trim($_POST['medical_history'] ?? '');

    if (!in_array($gender, ['male', 'female'], true)) { $err = 'Invalid gender.'; }
    elseif ($full_name === '') { $err = 'Full name required.'; }
    else {
        if ($do === 'create') {
            db()->prepare(
                'INSERT INTO patients (full_name, age, gender, phone, address, medical_history)
                 VALUES (?, ?, ?, ?, ?, ?)'
            )->execute([$full_name, $age, $gender, $phone, $address, $medical_history]);
            $msg = 'Patient created.';
        } elseif ($do === 'update') {
            $pid = (int) $_POST['id'];
            db()->prepare(
                'UPDATE patients SET full_name=?, age=?, gender=?, phone=?, address=?, medical_history=? WHERE id=?'
            )->execute([$full_name, $age, $gender, $phone, $address, $medical_history, $pid]);
            $msg = 'Patient updated.';
        }
        $action = 'list';
    }

    if ($do === 'delete') {
        $pid = (int) $_POST['id'];
        db()->prepare('DELETE FROM patients WHERE id=?')->execute([$pid]);
        $msg = 'Patient deleted.';
        $action = 'list';
    }
}

$PAGE_TITLE = 'Manage Patients';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-3">Patients</h2>
<?php if ($msg): ?><div class="alert alert-success"><?= htmlspecialchars($msg, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<?php if ($err): ?><div class="alert alert-danger"><?= htmlspecialchars($err, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>

<?php if ($action === 'add' || $action === 'edit'):
    $editing = null;
    if ($action === 'edit') {
        $stmt = db()->prepare('SELECT * FROM patients WHERE id=?');
        $stmt->execute([$id]);
        $editing = $stmt->fetch();
        if (!$editing) { echo '<div class="alert alert-warning">Patient not found.</div>'; require __DIR__.'/../../includes/footer.php'; exit; }
    }
?>
  <div class="card"><div class="card-body">
    <h5><?= $action === 'add' ? 'Add patient' : 'Edit patient' ?></h5>
    <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="do" value="<?= $action === 'add' ? 'create' : 'update' ?>">
      <?php if ($editing): ?><input type="hidden" name="id" value="<?= (int) $editing['id'] ?>"><?php endif; ?>
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Full name</label>
          <input name="full_name" class="form-control" required value="<?= htmlspecialchars($editing['full_name'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-md-3"><label class="form-label">Age</label>
          <input type="number" name="age" class="form-control" value="<?= (int) ($editing['age'] ?? 0) ?>"></div>
        <div class="col-md-3"><label class="form-label">Gender</label>
          <select name="gender" class="form-select">
            <option value="male"   <?= ($editing['gender'] ?? '') === 'male'   ? 'selected' : '' ?>>Male</option>
            <option value="female" <?= ($editing['gender'] ?? '') === 'female' ? 'selected' : '' ?>>Female</option>
          </select></div>
        <div class="col-md-6"><label class="form-label">Phone</label>
          <input name="phone" class="form-control" value="<?= htmlspecialchars($editing['phone'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-md-6"><label class="form-label">Address</label>
          <input name="address" class="form-control" value="<?= htmlspecialchars($editing['address'] ?? '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-12"><label class="form-label">Medical history</label>
          <textarea name="medical_history" class="form-control" rows="3"><?= htmlspecialchars($editing['medical_history'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea></div>
      </div>
      <div class="mt-3">
        <button class="btn btn-primary"><?= $action === 'add' ? 'Create' : 'Update' ?></button>
        <a href="patients.php" class="btn btn-secondary">Cancel</a>
      </div>
    </form>
  </div></div>
<?php else:
    $rows = db()->query('SELECT * FROM patients ORDER BY id DESC')->fetchAll();
?>
  <a href="patients.php?action=add" class="btn btn-success mb-3">+ Add patient</a>
  <table class="table table-striped bg-white">
    <thead><tr><th>ID</th><th>Full Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Actions</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $p): ?>
      <tr>
        <td><?= (int) $p['id'] ?></td>
        <td><?= htmlspecialchars($p['full_name'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= (int) $p['age'] ?></td>
        <td><?= htmlspecialchars($p['gender'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($p['phone'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td>
          <a href="patients.php?action=edit&id=<?= (int) $p['id'] ?>" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="post" class="d-inline" onsubmit="return confirm('Delete this patient?');">
            <?= csrf_field() ?>
            <input type="hidden" name="do" value="delete">
            <input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
            <button class="btn btn-sm btn-outline-danger">Delete</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

1. Add 2 patients — list shows them.
2. Edit one — values persist.
3. Delete one — gone.
4. As `user` role, try `admin/patients.php` — 403.

- [ ] **Step 3: Commit**

```bash
git add public/admin/patients.php
git commit -m "feat: admin CRUD for patients"
```

---

## Task 16: Admin — CRUD appointments

**Files:**
- Create: `public/admin/appointments.php`

- [ ] **Step 1: Write `public/admin/appointments.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_permission('manage_appointments');

$action = $_GET['action'] ?? 'list';
$id     = (int) ($_GET['id'] ?? 0);
$msg = null; $err = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf();
    $do = $_POST['do'] ?? '';
    $patient_id       = (int) ($_POST['patient_id'] ?? 0);
    $doctor_id        = (int) ($_POST['doctor_id'] ?? 0);
    $appointment_date = trim($_POST['appointment_date'] ?? '');
    $status           = $_POST['status'] ?? 'scheduled';
    $notes            = trim($_POST['notes'] ?? '');

    if (!in_array($status, ['scheduled','completed','cancelled'], true)) { $err = 'Invalid status.'; }
    elseif ($patient_id === 0 || $doctor_id === 0 || $appointment_date === '') { $err = 'Patient, doctor, and date are required.'; }
    else {
        if ($do === 'create') {
            db()->prepare(
                'INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes)
                 VALUES (?, ?, ?, ?, ?)'
            )->execute([$patient_id, $doctor_id, $appointment_date, $status, $notes]);
            $msg = 'Appointment created.';
        } elseif ($do === 'update') {
            $aid = (int) $_POST['id'];
            db()->prepare(
                'UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, status=?, notes=? WHERE id=?'
            )->execute([$patient_id, $doctor_id, $appointment_date, $status, $notes, $aid]);
            $msg = 'Appointment updated.';
        }
        $action = 'list';
    }

    if ($do === 'delete') {
        $aid = (int) $_POST['id'];
        db()->prepare('DELETE FROM appointments WHERE id=?')->execute([$aid]);
        $msg = 'Appointment deleted.';
        $action = 'list';
    }
}

$patients = db()->query('SELECT id, full_name FROM patients ORDER BY full_name')->fetchAll();
$doctors  = db()->query(
    "SELECT u.id, u.full_name, u.username FROM users u
     JOIN roles r ON r.id = u.role_id WHERE r.name='manager' ORDER BY u.full_name"
)->fetchAll();

$PAGE_TITLE = 'Manage Appointments';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-3">Appointments</h2>
<?php if ($msg): ?><div class="alert alert-success"><?= htmlspecialchars($msg, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
<?php if ($err): ?><div class="alert alert-danger"><?= htmlspecialchars($err, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>

<?php if ($action === 'add' || $action === 'edit'):
    $editing = null;
    if ($action === 'edit') {
        $stmt = db()->prepare('SELECT * FROM appointments WHERE id=?');
        $stmt->execute([$id]);
        $editing = $stmt->fetch();
        if (!$editing) { echo '<div class="alert alert-warning">Appointment not found.</div>'; require __DIR__.'/../../includes/footer.php'; exit; }
    }
?>
  <div class="card"><div class="card-body">
    <h5><?= $action === 'add' ? 'Add appointment' : 'Edit appointment' ?></h5>
    <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="do" value="<?= $action === 'add' ? 'create' : 'update' ?>">
      <?php if ($editing): ?><input type="hidden" name="id" value="<?= (int) $editing['id'] ?>"><?php endif; ?>
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Patient</label>
          <select name="patient_id" class="form-select" required>
            <option value="">choose patient</option>
            <?php foreach ($patients as $p): ?>
              <option value="<?= (int) $p['id'] ?>" <?= isset($editing) && (int) $editing['patient_id'] === (int) $p['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($p['full_name'], ENT_QUOTES, 'UTF-8') ?>
              </option>
            <?php endforeach; ?>
          </select></div>
        <div class="col-md-6"><label class="form-label">Doctor (manager)</label>
          <select name="doctor_id" class="form-select" required>
            <option value="">choose doctor</option>
            <?php foreach ($doctors as $d): ?>
              <option value="<?= (int) $d['id'] ?>" <?= isset($editing) && (int) $editing['doctor_id'] === (int) $d['id'] ? 'selected' : '' ?>>
                <?= htmlspecialchars($d['full_name'] ?: $d['username'], ENT_QUOTES, 'UTF-8') ?>
              </option>
            <?php endforeach; ?>
          </select></div>
        <div class="col-md-6"><label class="form-label">Date/time</label>
          <input type="datetime-local" name="appointment_date" class="form-control" required
                 value="<?= htmlspecialchars(isset($editing['appointment_date']) ? str_replace(' ', 'T', $editing['appointment_date']) : '', ENT_QUOTES, 'UTF-8') ?>"></div>
        <div class="col-md-6"><label class="form-label">Status</label>
          <select name="status" class="form-select">
            <?php foreach (['scheduled','completed','cancelled'] as $s): ?>
              <option value="<?= $s ?>" <?= ($editing['status'] ?? '') === $s ? 'selected' : '' ?>><?= $s ?></option>
            <?php endforeach; ?>
          </select></div>
        <div class="col-12"><label class="form-label">Notes</label>
          <textarea name="notes" class="form-control" rows="3"><?= htmlspecialchars($editing['notes'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea></div>
      </div>
      <div class="mt-3">
        <button class="btn btn-primary"><?= $action === 'add' ? 'Create' : 'Update' ?></button>
        <a href="appointments.php" class="btn btn-secondary">Cancel</a>
      </div>
    </form>
  </div></div>
<?php else:
    $rows = db()->query(
        'SELECT a.*, p.full_name AS patient_name, u.full_name AS doctor_name, u.username AS doctor_username
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         JOIN users u ON u.id = a.doctor_id
         ORDER BY a.appointment_date DESC'
    )->fetchAll();
?>
  <a href="appointments.php?action=add" class="btn btn-success mb-3">+ Add appointment</a>
  <table class="table table-striped bg-white">
    <thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $a): ?>
      <tr>
        <td><?= (int) $a['id'] ?></td>
        <td><?= htmlspecialchars($a['patient_name'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($a['doctor_name'] ?: $a['doctor_username'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($a['appointment_date'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><span class="badge bg-secondary"><?= htmlspecialchars($a['status'], ENT_QUOTES, 'UTF-8') ?></span></td>
        <td>
          <a href="appointments.php?action=edit&id=<?= (int) $a['id'] ?>" class="btn btn-sm btn-outline-primary">Edit</a>
          <form method="post" class="d-inline" onsubmit="return confirm('Delete this appointment?');">
            <?= csrf_field() ?>
            <input type="hidden" name="do" value="delete">
            <input type="hidden" name="id" value="<?= (int) $a['id'] ?>">
            <button class="btn btn-sm btn-outline-danger">Delete</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Manual verification**

1. (First, in `admin/users.php`, create a user with role `manager` if you don't have one.)
2. In `admin/appointments.php` — Add appointment — pick patient + doctor — save.
3. Edit + delete work.

- [ ] **Step 3: Commit**

```bash
git add public/admin/appointments.php
git commit -m "feat: admin CRUD for appointments"
```

---

## Task 17: Manager pages

**Files:**
- Create: `public/manager/index.php`
- Create: `public/manager/patients.php`
- Create: `public/manager/appointments.php`

- [ ] **Step 1: Write `public/manager/index.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_role(['manager']);

$my_id = current_user_id();
$patient_count = (int) db()->query('SELECT COUNT(*) FROM patients')->fetchColumn();
$stmt = db()->prepare('SELECT COUNT(*) FROM appointments WHERE doctor_id=?');
$stmt->execute([$my_id]);
$my_appts = (int) $stmt->fetchColumn();

$PAGE_TITLE = 'Manager Dashboard';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-4">Manager Dashboard</h2>
<div class="row g-3">
  <div class="col-md-4"><div class="card text-center shadow-sm"><div class="card-body">
    <h5 class="text-muted text-uppercase small">Patients</h5>
    <p class="display-5 mb-0"><?= $patient_count ?></p>
  </div></div></div>
  <div class="col-md-4"><div class="card text-center shadow-sm"><div class="card-body">
    <h5 class="text-muted text-uppercase small">My appointments</h5>
    <p class="display-5 mb-0"><?= $my_appts ?></p>
  </div></div></div>
</div>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Write `public/manager/patients.php` — copy of admin/patients.php**

The file is identical to `public/admin/patients.php` from Task 15. Copy verbatim:

```bash
cp public/admin/patients.php public/manager/patients.php
```

The `require_permission('manage_patients')` guard already correctly allows both admin and manager (both have that permission by default, and it is revocable per Task 14). Path strings (`__DIR__ . '/../../includes/...'`) still resolve correctly because the file is two levels deep regardless of which role-folder it sits in.

- [ ] **Step 3: Write `public/manager/appointments.php` — copy of admin/appointments.php**

```bash
cp public/admin/appointments.php public/manager/appointments.php
```

Same rationale as patients.php — `require_permission('manage_appointments')` already guards both files.

- [ ] **Step 4: Manual verification**

1. Create a manager user (via admin/users.php) with username `dr_smith` / password `Doctor@123` / role `manager`.
2. Login as `dr_smith` — lands on manager/index.php with stats.
3. Confirm "Users", "Roles", "Permissions" links are NOT in the nav.
4. Click "Patients" — manager/patients.php — CRUD works.
5. Click "Appointments" — manager/appointments.php — CRUD works.
6. Try pasting `admin/users.php` URL — 403.

- [ ] **Step 5: Commit**

```bash
git add public/manager/
git commit -m "feat: manager dashboard, patients, and appointments pages"
```

---

## Task 18: User (patient) pages

**Files:**
- Create: `public/user/index.php`
- Create: `public/user/appointments.php`

- [ ] **Step 1: Write `public/user/index.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_role(['user']);

$stmt = db()->prepare('SELECT * FROM users WHERE id=?');
$stmt->execute([current_user_id()]);
$me = $stmt->fetch();

$PAGE_TITLE = 'My Profile';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-4">Welcome, <?= htmlspecialchars($me['full_name'] ?? $me['username'], ENT_QUOTES, 'UTF-8') ?></h2>
<div class="card shadow-sm" style="max-width: 500px;">
  <div class="card-body">
    <h5 class="card-title">Profile</h5>
    <dl class="row mb-0">
      <dt class="col-sm-4">Username</dt><dd class="col-sm-8"><?= htmlspecialchars($me['username'], ENT_QUOTES, 'UTF-8') ?></dd>
      <dt class="col-sm-4">Email</dt>   <dd class="col-sm-8"><?= htmlspecialchars($me['email'], ENT_QUOTES, 'UTF-8') ?></dd>
      <dt class="col-sm-4">Role</dt>    <dd class="col-sm-8"><?= htmlspecialchars($_SESSION['role'], ENT_QUOTES, 'UTF-8') ?></dd>
    </dl>
  </div>
</div>
<p class="mt-3"><a href="appointments.php" class="btn btn-primary">View my appointments</a></p>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 2: Write `public/user/appointments.php`**

```php
<?php
require_once __DIR__ . '/../../includes/auth.php';
require_permission('view_own_appointments');

// Patients live in `patients` (separate from `users`). For this demo,
// we match the logged-in user's full_name to the patient's full_name.
// This is a simple convention chosen for the project; in production you
// would store a patient_id FK on users.
$me_id = current_user_id();
$stmt = db()->prepare('SELECT * FROM users WHERE id=?');
$stmt->execute([$me_id]);
$me = $stmt->fetch();

$stmt = db()->prepare(
    "SELECT a.*, u.full_name AS doctor_name, u.username AS doctor_username
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users u ON u.id = a.doctor_id
     WHERE LOWER(p.full_name) = LOWER(?)
     ORDER BY a.appointment_date DESC"
);
$stmt->execute([$me['full_name'] ?? $me['username']]);
$rows = $stmt->fetchAll();

$PAGE_TITLE = 'My Appointments';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-3">My Appointments</h2>
<?php if (empty($rows)): ?>
  <div class="alert alert-info">
    No appointments found. (Match is by full name — ensure a patient row with full name
    "<?= htmlspecialchars($me['full_name'] ?? $me['username'], ENT_QUOTES, 'UTF-8') ?>"
    exists and has appointments.)
  </div>
<?php else: ?>
  <table class="table table-striped bg-white">
    <thead><tr><th>Date</th><th>Doctor</th><th>Status</th><th>Notes</th></tr></thead>
    <tbody>
      <?php foreach ($rows as $a): ?>
      <tr>
        <td><?= htmlspecialchars($a['appointment_date'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($a['doctor_name'] ?: $a['doctor_username'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><span class="badge bg-secondary"><?= htmlspecialchars($a['status'], ENT_QUOTES, 'UTF-8') ?></span></td>
        <td><?= htmlspecialchars($a['notes'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
<?php endif; ?>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
```

- [ ] **Step 3: Manual verification**

1. Register a patient account via `register.php` (e.g., username `alice`, full name `Alice Smith`).
2. As admin, in `admin/patients.php`, add a patient row with `full_name = Alice Smith`.
3. As admin, in `admin/appointments.php`, create an appointment for that patient.
4. Logout, login as `alice` — see profile.
5. Click "My Appointments" — see her appointment.
6. As `alice`, paste `admin/users.php` URL — 403.

- [ ] **Step 4: Commit**

```bash
git add public/user/
git commit -m "feat: user (patient) profile and own-appointments pages"
```

---

## Task 19: Final README with setup + demo guide

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with the full guide**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: full setup, demo flow, and security checklist in README"
```

---

## Self-Review

**Spec coverage check:**
- Roles & Permissions matrix (spec section 2): Task 2 (seed) + Task 14 (UI to manage)
- Architecture / folder structure (spec section 3): Task 1 (init) + every subsequent task creates the matching files
- Database schema (spec section 4): Task 2
- Password security (spec section 5.1): Task 4 (with tests)
- Authentication mechanism (spec section 5.2): Task 5 + Task 8 (login) + Task 10 (logout/dashboard)
- RBAC (spec section 5.3): Task 5 (helpers) + every page Task using `require_role`/`require_permission`
- User permissions management (spec section 5.4): Task 14 (matrix) + Task 12 (user role assignment)
- Defense-in-depth: CSRF (Task 6, used in 8/9/12-18), prepared statements everywhere, htmlspecialchars on every echo, cookie flags (Task 5)
- Page access matrix (spec section 6): mirrored in Tasks 8-18 guards
- Demo flow (spec section 7): Task 19 README

**Placeholder scan:** none.

**Type/name consistency:** function names match across tasks (`hash_password`, `verify_password`, `require_login`, `require_role`, `require_permission`, `has_permission`, `current_user_id`, `load_permissions_for_role`, `csrf_token`, `csrf_field`, `require_csrf`, `start_secure_session`, `login_user`, `logout_user`). Form action names (`do`) and field names consistent.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-01-hospital-network-security.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
