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
