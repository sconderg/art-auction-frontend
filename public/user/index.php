<?php
require_once __DIR__ . '/../../includes/auth.php';
require_role(['user']);

$stmt = db()->prepare('SELECT * FROM users WHERE id=?');
$stmt->execute([current_user_id()]);
$me = $stmt->fetch();

$PAGE_TITLE = 'My Profile';
require __DIR__ . '/../../includes/header.php';
?>
<h2 class="mb-4">Welcome, <?= htmlspecialchars($me['full_name'] ?? $me['username'], ENT_QUOTES, 'UTF-8') ?></h2>
<div class="card shadow-sm" style="max-width: 500px;">
  <div class="card-body">
    <h5 class="card-title">Profile</h5>
    <dl class="row mb-0">
      <dt class="col-sm-4">Username</dt><dd class="col-sm-8"><?= htmlspecialchars($me['username'], ENT_QUOTES, 'UTF-8') ?></dd>
      <dt class="col-sm-4">Email</dt>   <dd class="col-sm-8"><?= htmlspecialchars($me['email'], ENT_QUOTES, 'UTF-8') ?></dd>
      <dt class="col-sm-4">Role</dt>    <dd class="col-sm-8"><?= htmlspecialchars($_SESSION['role'], ENT_QUOTES, 'UTF-8') ?></dd>
    </dl>
  </div>
</div>
<p class="mt-3"><a href="appointments.php" class="btn btn-primary">View my appointments</a></p>
<?php require __DIR__ . '/../../includes/footer.php'; ?>
