<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

switch ($_SESSION['role']) {
    case 'admin':   header('Location: admin/index.php'); exit;
    case 'manager': header('Location: manager/index.php'); exit;
    case 'user':    header('Location: user/index.php'); exit;
    default:        header('Location: 403.php'); exit;
}
