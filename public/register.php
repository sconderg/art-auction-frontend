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
