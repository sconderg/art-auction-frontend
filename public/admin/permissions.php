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
