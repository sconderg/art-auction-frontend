<?php
require __DIR__ . '/../config/db.php';
$row = db()->query('SELECT COUNT(*) AS c FROM roles')->fetch();
echo "Roles in DB: " . $row['c'] . "\n";
require __DIR__ . '/../includes/auth.php';
$perms = load_permissions_for_role(1);
echo "Admin role permissions: " . implode(', ', $perms) . "\n";
