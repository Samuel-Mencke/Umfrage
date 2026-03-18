<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/middleware/admin_auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['passwort'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Passwort erforderlich']);
        exit;
    }
    
    // Admin aus Datenbank laden
    $stmt = $pdo->prepare('SELECT * FROM admins WHERE username = ?');
    $stmt->execute(['admin']);
    $admin = $stmt->fetch();
    
    if ($admin && password_verify($input['passwort'], $admin['password_hash'])) {
        // Sicheren Token generieren
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        
        // Token hash in Datenbank speichern mit Ablaufzeit
        $expiresAt = (new DateTime())->modify('+7 days')->format('Y-m-d H:i:s');
        $stmt = $pdo->prepare('INSERT INTO admin_tokens (token_hash, expires_at, created_at) VALUES (?, ?, NOW())');
        $stmt->execute([$tokenHash, $expiresAt]);
        
        // Token als HttpOnly, Secure Cookie setzen
        setcookie('admin_token', $token, [
            'expires' => time() + (86400 * 7),
            'path' => '/',
            'httponly' => true,
            'secure' => true,   // Nur über HTTPS (in Entwicklung auf false setzen, in Produktion auf true)
            'samesite' => 'Strict'
        ]);
        
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Falsches Passwort']);
    }
} elseif ($method === 'DELETE') {
    // Logout funktioniert wie bisher aber mit Token-Invalidierung
    $token = $_COOKIE['admin_token'] ?? '';
    if ($token) {
        $tokenHash = hash('sha256', $token);
        $stmt = $pdo->prepare('DELETE FROM admin_tokens WHERE token_hash = ?');
        $stmt->execute([$tokenHash]);
    }
    setcookie('admin_token', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'secure' => true,
        'samesite' => 'Strict'
    ]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Methode nicht erlaubt']);
}