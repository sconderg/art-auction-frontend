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
