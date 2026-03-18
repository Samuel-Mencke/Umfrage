<?php
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/config.php';

try {
    // Admins Tabelle
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    
    // Admin tokens Tabelle
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admin_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    
    // Login attempts Tabelle
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(45) NOT NULL,
            success TINYINT(1) NOT NULL DEFAULT 0,
            attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ip_time (ip_address, attempt_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    
    echo "Tabellen erfolgreich erstellt oder bereits vorhanden.\n";
    
    // Standard-Admin anlegen, falls noch nicht vorhanden
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM admins WHERE username = ?');
    $stmt->execute(['admin']);
    $count = $stmt->fetchColumn();
    
    if ($count == 0) {
        $password = 'admin123'; // Dieses Passwort sollte bei erster Änderung geändert werden
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
        $stmt->execute(['admin', $hash]);
        
        echo "Standard-Administrator angelegt:\n";
        echo "  Benutzername: admin\n";
        echo "  Passwort: admin123\n";
        echo "  WICHTIG: Bitte ändern Sie das Passwort nach der ersten Anmeldung!\n";
    } else {
        echo "Administrator existiert bereits.\n";
    }
    
} catch (PDOException $e) {
    echo "Fehler: " . $e->getMessage() . "\n";
    http_response_code(500);
}
?>