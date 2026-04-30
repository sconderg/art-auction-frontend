<?php
require_once __DIR__ . '/../config/db.php';
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

function start_secure_session(): void {
    if (session_status() !== PHP_SESSION_NONE) return;
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Strict',
        'secure'   => !empty($_SERVER['HTTPS']),
    ]);
    session_start();
}

function login_user(array $user, string $role_name, array $permissions): void {
    start_secure_session();
    session_regenerate_id(true);
    $_SESSION['user_id']     = (int) $user['id'];
    $_SESSION['username']    = $user['username'];
    $_SESSION['full_name']   = $user['full_name'] ?? $user['username'];
    $_SESSION['role']        = $role_name;
    $_SESSION['permissions'] = $permissions;
    $_SESSION['user_agent']  = $_SERVER['HTTP_USER_AGENT'] ?? '';
}

function logout_user(): void {
    start_secure_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
}

function require_login(): void {
    start_secure_session();
    // Anti-cache headers — required for the post-logout URL-bypass test.
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    if (!isset($_SESSION['user_id'])) {
        header('Location: /hospital-security/public/login.php');
        exit;
    }
    // Bind session to user agent (basic hijack mitigation)
    if (($_SESSION['user_agent'] ?? '') !== ($_SERVER['HTTP_USER_AGENT'] ?? '')) {
        logout_user();
        header('Location: /hospital-security/public/login.php');
        exit;
    }
}

function require_role(array $allowed_roles): void {
    require_login();
    if (!in_array($_SESSION['role'] ?? '', $allowed_roles, true)) {
        header('Location: /hospital-security/public/403.php');
        exit;
    }
}

function require_permission(string $permission): void {
    require_login();
    if (!in_array($permission, $_SESSION['permissions'] ?? [], true)) {
        header('Location: /hospital-security/public/403.php');
        exit;
    }
}

function has_permission(string $permission): bool {
    return isset($_SESSION['permissions'])
        && in_array($permission, $_SESSION['permissions'], true);
}

function current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function load_permissions_for_role(int $role_id): array {
    $stmt = db()->prepare(
        'SELECT p.name FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         WHERE rp.role_id = ?'
    );
    $stmt->execute([$role_id]);
    return array_column($stmt->fetchAll(), 'name');
}
