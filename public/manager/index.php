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
