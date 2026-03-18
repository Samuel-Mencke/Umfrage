<?php
function requireAdmin() {
    global $pdo;
    
    $token = $_COOKIE['admin_token'] ?? '';
    
    if (empty($token)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Nicht autorisiert']);
        exit;
    }
    
    $tokenHash = hash('sha256', $token);
    
    // Token validieren und auf Ablauf prüfen
    $stmt = $pdo->prepare('SELECT * FROM admin_tokens WHERE token_hash = ? AND expires_at > NOW()');
    $stmt->execute([$tokenHash]);
    $tokenRecord = $stmt->fetch();
    
    if (!$tokenRecord) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Nicht autorisiert oder Token abgelaufen']);
        exit;
    }
    
    // Optional: Token erneuern bei kurzem Ablauf (Refresh Token Pattern)
    $expiresAt = new DateTime($tokenRecord['expires_at']);
    $now = new DateTime();
    $diff = $expiresAt->getTimestamp() - $now->getTimestamp();
    
    // Wenn weniger als 1 Tag übrig, Token erneuern
    if ($diff < 86400) { // Weniger als 24 Stunden
        $newToken = bin2hex(random_bytes(32));
        $newTokenHash = hash('sha256', $newToken);
        $newExpires = (new DateTime())->modify('+7 days')->format('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare('UPDATE admin_tokens SET token_hash = ?, expires_at = ? WHERE id = ?');
        $stmt->execute([$newTokenHash, $newExpires, $tokenRecord['id']]);
        
        // Neues Token setzen
        setcookie('admin_token', $newToken, [
            'expires' => time() + (86400 * 7),
            'path' => '/',
            'httponly' => true,
            'secure' => true,   // Nur über HTTPS
            'samesite' => 'Strict'
        ]);
    }
}