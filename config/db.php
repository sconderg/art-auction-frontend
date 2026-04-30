<?php
// PDO connection. Edit these constants for your local MySQL setup.
const DB_HOST = '127.0.0.1';
const DB_NAME = 'hospital_security';
const DB_USER = 'root';
const DB_PASS = '';   // XAMPP default is empty; change for your setup
const DB_PORT = 3306;

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            DB_HOST, DB_PORT, DB_NAME
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}
