<?php
// Run once: php sql/generate_admin_seed.php
// Generates the salt+hash for the bootstrap admin and patches schema.sql.
$password = 'Admin@123';
$salt     = bin2hex(random_bytes(16));
$hash     = hash('sha256', $salt . $password);

$schemaPath = __DIR__ . '/schema.sql';
$contents   = file_get_contents($schemaPath);
$contents   = str_replace('__PLACEHOLDER_SALT__', $salt, $contents);
$contents   = str_replace('__PLACEHOLDER_HASH__', $hash, $contents);
file_put_contents($schemaPath, $contents);

echo "Patched schema.sql\n";
echo "Salt: $salt\n";
echo "Hash: $hash\n";
