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
