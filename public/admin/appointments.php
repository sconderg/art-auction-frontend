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
