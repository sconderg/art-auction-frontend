<?php
require_once __DIR__ . '/../includes/auth.php';
start_secure_session();
http_response_code(403);
$PAGE_TITLE = 'Access Denied';
require __DIR__ . '/../includes/header.php';
?>
<div class="row justify-content-center">
  <div class="col-md-6 text-center">
    <div class="card shadow-sm border-danger">
      <div class="card-body">
        <h1 class="display-1 text-danger">403</h1>
        <h3>Access Denied</h3>
        <p>You do not have permission to view this page.</p>
        <a href="dashboard.php" class="btn btn-primary">Back to dashboard</a>
      </div>
    </div>
  </div>
</div>
<?php require __DIR__ . '/../includes/footer.php'; ?>
