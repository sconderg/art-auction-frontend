<?php
// Network-Security project — security helpers.

function hash_password(string $password): array {
    $salt = bin2hex(random_bytes(16));
    $hash = hash('sha256', $salt . $password);
    return ['salt' => $salt, 'hash' => $hash];
}

function verify_password(string $password, string $salt, string $expected_hash): bool {
    $computed = hash('sha256', $salt . $password);
    return hash_equals($expected_hash, $computed);
}
