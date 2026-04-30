<?php
require __DIR__ . '/../config/db.php';
$row = db()->query('SELECT COUNT(*) AS c FROM roles')->fetch();
echo "Roles in DB: " . $row['c'] . "\n";
