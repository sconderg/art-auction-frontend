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
