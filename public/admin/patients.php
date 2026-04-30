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
