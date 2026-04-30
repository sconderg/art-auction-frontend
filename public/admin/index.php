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
