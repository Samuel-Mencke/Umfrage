-- Umfrage Tool - Tabellen
-- Kopiere dies in phpMyAdmin und führe es in deiner Datenbank (web50_1) aus

-- Falls die Tabelle schon existiert, führe diesen Befehl zuerst aus:
-- ALTER TABLE teilnehmer_antworten ADD COLUMN teilnehmer_id VARCHAR(64) NULL AFTER antworten;
-- ALTER TABLE teilnehmer_antworten ADD INDEX idx_teilnehmer_id (teilnehmer_id);

-- Tabelle: umfragen
CREATE TABLE IF NOT EXISTS umfragen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    status ENUM('aktiv', 'beendet') DEFAULT 'aktiv',
    beendet_am DATETIME NULL,
    erstellt_am DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelle: fragen
CREATE TABLE IF NOT EXISTS fragen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    umfrage_id INT NOT NULL,
    frage TEXT NOT NULL,
    typ ENUM('radio', 'checkbox', 'text', 'number', 'date', 'email', 'range') NOT NULL,
    position INT DEFAULT 0,
    erstellt_am DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (umfrage_id) REFERENCES umfragen(id) ON DELETE CASCADE,
    INDEX idx_umfrage_id (umfrage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelle: antwort_optionen (für radio/checkbox Fragen)
CREATE TABLE IF NOT EXISTS antwort_optionen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    frage_id INT NOT NULL,
    antwort VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    FOREIGN KEY (frage_id) REFERENCES fragen(id) ON DELETE CASCADE,
    INDEX idx_frage_id (frage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelle: teilnehmer_antworten
CREATE TABLE IF NOT EXISTS teilnehmer_antworten (
    id INT AUTO_INCREMENT PRIMARY KEY,
    umfrage_id INT NOT NULL,
    antworten JSON NOT NULL,
    teilnehmer_id VARCHAR(64) NULL,
    ip VARCHAR(45) NOT NULL,
    zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (umfrage_id) REFERENCES umfragen(id) ON DELETE CASCADE,
    INDEX idx_umfrage_id (umfrage_id),
    INDEX idx_teilnehmer_id (teilnehmer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
