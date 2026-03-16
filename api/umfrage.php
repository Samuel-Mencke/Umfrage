<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

function requireAdmin() {
    global $admin_password;
    $token = $_COOKIE['admin_token'] ?? '';
    
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht autorisiert']);
        exit;
    }
    
    $expected = hash('sha256', $admin_password . 'umfrage_admin_salt');
    if (!hash_equals($expected, $token)) {
        http_response_code(401);
        echo json_encode(['error' => 'Nicht autorisiert']);
        exit;
    }
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                ladeUmfragePerId($pdo, $_GET['id']);
            } else {
                ladeAlleUmfragen($pdo);
            }
            break;

        case 'POST':
            requireAdmin();
            erstelleUmfrage($pdo);
            break;

        case 'PUT':
            requireAdmin();
            aktualisiereUmfrage($pdo);
            break;

        case 'DELETE':
            requireAdmin();
            loescheUmfrage($pdo);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Methode nicht erlaubt']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function ladeAlleUmfragen($pdo) {
    $stmt = $pdo->query('SELECT * FROM umfragen ORDER BY erstellt_am DESC');
    $umfragen = [];

    while ($row = $stmt->fetch()) {
        $umfragen[] = ladeUmfrageMitFragen($pdo, $row['id']);
    }

    echo json_encode($umfragen);
}

function ladeUmfragePerId($pdo, $id) {
    $umfrage = ladeUmfrageMitFragen($pdo, $id);

    if (!$umfrage) {
        http_response_code(404);
        echo json_encode(['error' => 'Umfrage nicht gefunden']);
        return;
    }

    echo json_encode($umfrage);
}

function ladeUmfrageMitFragen($pdo, $umfrageId) {
    $stmt = $pdo->prepare('SELECT * FROM umfragen WHERE id = ?');
    $stmt->execute([$umfrageId]);
    $umfrage = $stmt->fetch();

    if (!$umfrage) {
        return null;
    }

    $umfrage['fragen'] = [];

    $stmt = $pdo->prepare('SELECT * FROM fragen WHERE umfrage_id = ? ORDER BY position ASC');
    $stmt->execute([$umfrageId]);
    $fragen = $stmt->fetchAll();

    foreach ($fragen as $frage) {
        $frage['antworten'] = [];

        if ($frage['typ'] === 'radio' || $frage['typ'] === 'checkbox') {
            $stmt2 = $pdo->prepare('SELECT * FROM antwort_optionen WHERE frage_id = ? ORDER BY position ASC');
            $stmt2->execute([$frage['id']]);
            $antwortOptionen = $stmt2->fetchAll();

            foreach ($antwortOptionen as $opt) {
                $frage['antworten'][] = $opt['antwort'];
            }
        }

        $umfrage['fragen'][] = $frage;
    }

    return $umfrage;
}

function erstelleUmfrage($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['titel'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Titel ist erforderlich']);
        return;
    }

    if (!isset($input['fragen']) || empty($input['fragen'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Mindestens eine Frage ist erforderlich']);
        return;
    }

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare('INSERT INTO umfragen (titel, beschreibung, status) VALUES (?, ?, ?)');
        $stmt->execute([
            $input['titel'],
            $input['beschreibung'] ?? '',
            'aktiv'
        ]);

        $umfrageId = $pdo->lastInsertId();

        foreach ($input['fragen'] as $index => $frage) {
            $stmt = $pdo->prepare('INSERT INTO fragen (umfrage_id, frage, typ, position) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $umfrageId,
                $frage['frage'],
                $frage['typ'],
                $index
            ]);

            $frageId = $pdo->lastInsertId();

            if (($frage['typ'] === 'radio' || $frage['typ'] === 'checkbox') && isset($frage['antworten'])) {
                foreach ($frage['antworten'] as $antwortIndex => $antwort) {
                    $stmt = $pdo->prepare('INSERT INTO antwort_optionen (frage_id, antwort, position) VALUES (?, ?, ?)');
                    $stmt->execute([
                        $frageId,
                        $antwort,
                        $antwortIndex
                    ]);
                }
            }
        }

        $pdo->commit();

        echo json_encode(['id' => $umfrageId]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function aktualisiereUmfrage($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID ist erforderlich']);
        return;
    }

    if (!isset($input['aktion'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Aktion ist erforderlich']);
        return;
    }

    if ($input['aktion'] === 'beenden') {
        $stmt = $pdo->prepare('UPDATE umfragen SET status = ?, beendet_am = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute(['beendet', $input['id']]);
    } elseif ($input['aktion'] === 'aktivieren') {
        $stmt = $pdo->prepare('UPDATE umfragen SET status = ?, beendet_am = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute(['aktiv', $input['id']]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Ungültige Aktion']);
        return;
    }

    echo json_encode(['success' => true]);
}

function loescheUmfrage($pdo) {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID ist erforderlich']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM umfragen WHERE id = ?');
    $stmt->execute([$_GET['id']]);

    echo json_encode(['success' => true]);
}
