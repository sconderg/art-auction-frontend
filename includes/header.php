<?php
require_once __DIR__ . '/auth.php';
$BASE = '/hospital-security/public';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($PAGE_TITLE ?? 'Hospital Security', ENT_QUOTES, 'UTF-8') ?></title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
  <div class="container">
    <a class="navbar-brand" href="<?= $BASE ?>/dashboard.php">Hospital Security</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="nav">
      <ul class="navbar-nav me-auto">
        <?php if (isset($_SESSION['user_id'])): ?>
          <?php if (has_permission('manage_users')): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/admin/users.php">Users</a></li>
          <?php endif; ?>
          <?php if (has_permission('manage_roles')): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/admin/roles.php">Roles</a></li>
          <?php endif; ?>
          <?php if (has_permission('manage_permissions')): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/admin/permissions.php">Permissions</a></li>
          <?php endif; ?>
          <?php if (has_permission('manage_patients')): ?>
            <li class="nav-item">
              <a class="nav-link" href="<?= $BASE ?>/<?= $_SESSION['role'] ?>/patients.php">Patients</a>
            </li>
          <?php endif; ?>
          <?php if (has_permission('manage_appointments')): ?>
            <li class="nav-item">
              <a class="nav-link" href="<?= $BASE ?>/<?= $_SESSION['role'] ?>/appointments.php">Appointments</a>
            </li>
          <?php endif; ?>
          <?php if (has_permission('view_own_appointments') && $_SESSION['role'] === 'user'): ?>
            <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/user/appointments.php">My Appointments</a></li>
          <?php endif; ?>
        <?php endif; ?>
      </ul>
      <ul class="navbar-nav">
        <?php if (isset($_SESSION['user_id'])): ?>
          <li class="nav-item">
            <span class="navbar-text text-white-50 me-3">
              <?= htmlspecialchars($_SESSION['full_name'] ?? '', ENT_QUOTES, 'UTF-8') ?>
              <span class="badge bg-warning text-dark"><?= htmlspecialchars($_SESSION['role'], ENT_QUOTES, 'UTF-8') ?></span>
            </span>
          </li>
          <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/logout.php">Logout</a></li>
        <?php else: ?>
          <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/login.php">Login</a></li>
          <li class="nav-item"><a class="nav-link" href="<?= $BASE ?>/register.php">Register</a></li>
        <?php endif; ?>
      </ul>
    </div>
  </div>
</nav>
<main class="container py-4">
