<?php
require __DIR__ . '/../includes/auth.php';

// Test 1: hash_password returns array with salt + hash
$result = hash_password('Hello@123');
assert(isset($result['salt']),    'expected salt key');
assert(isset($result['hash']),    'expected hash key');
assert(strlen($result['salt']) === 32, 'salt should be 32 hex chars');
assert(strlen($result['hash']) === 64, 'hash should be 64 hex chars (sha256)');

// Test 2: verify_password matches
$h = hash_password('mypass');
assert(verify_password('mypass', $h['salt'], $h['hash']) === true,  'correct password should verify');
assert(verify_password('wrong',  $h['salt'], $h['hash']) === false, 'wrong password should fail');

// Test 3: same password produces different hashes (because of unique salt)
$a = hash_password('same_password');
$b = hash_password('same_password');
assert($a['salt'] !== $b['salt'], 'salts should differ');
assert($a['hash'] !== $b['hash'], 'hashes should differ even with same password');

echo "All password tests passed\n";
