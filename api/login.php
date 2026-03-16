<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['passwort']) && $input['passwort'] === $admin_password) {
        $token = hash('sha256', $admin_password . 'umfrage_admin_salt');
        setcookie('admin_token', $token, [
            'expires' => time() + (86400 * 7),
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Falsches Passwort']);
    }
} elseif ($method === 'DELETE') {
    setcookie('admin_token', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Methode nicht erlaubt']);
}
