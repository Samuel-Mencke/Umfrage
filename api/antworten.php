<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['pruefen']) && $_GET['pruefen'] === '1') {
                pruefeObTeilgenommen($pdo);
            } else {
                ladeAntworten($pdo);
            }
            break;

        case 'POST':
            if (isset($_GET['loeschen']) && $_GET['loeschen'] === '1') {
                loescheAntwort($pdo);
            } else {
                speichereAntworten($pdo);
            }
            break;

        case 'PUT':
            loescheAntwort($pdo);
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

function ladeAntworten($pdo) {
    if (!isset($_GET['umfrage_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'umfrage_id ist erforderlich']);
        return;
    }

    $teilnehmerId = $_GET['teilnehmer_id'] ?? '';
    $auswertung = isset($_GET['auswertung']) && $_GET['auswertung'] === '1';

    if (!empty($teilnehmerId)) {
        $stmt = $pdo->prepare('SELECT id, antworten, zeitstempel, teilnehmer_id FROM teilnehmer_antworten WHERE umfrage_id = ? AND teilnehmer_id = ? ORDER BY zeitstempel DESC LIMIT 1');
        $stmt->execute([$_GET['umfrage_id'], $teilnehmerId]);
        $antwort = $stmt->fetch();

        if ($antwort) {
            if (isset($antwort['antworten']) && is_string($antwort['antworten'])) {
                $antwort['antworten'] = json_decode($antwort['antworten'], true);
            }
            echo json_encode([$antwort]);
        } else {
            echo json_encode([]);
        }
        return;
    }

    if ($auswertung) {
        requireAdmin();
        
        $stmt = $pdo->prepare('SELECT id, antworten, zeitstempel, teilnehmer_id FROM teilnehmer_antworten WHERE umfrage_id = ? ORDER BY zeitstempel ASC');
        $stmt->execute([$_GET['umfrage_id']]);
        $antworten = $stmt->fetchAll();

        foreach ($antworten as &$antwort) {
            if (isset($antwort['antworten']) && is_string($antwort['antworten'])) {
                $antwort['antworten'] = json_decode($antwort['antworten'], true);
            }
        }

        echo json_encode($antworten);
        return;
    }

    echo json_encode(['error' => 'teilnehmer_id oder auswertung=1 erforderlich']);
}

function pruefeObTeilgenommen($pdo) {
    if (!isset($_GET['umfrage_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'umfrage_id ist erforderlich']);
        return;
    }

    $teilnehmerId = $_GET['teilnehmer_id'] ?? '';

    if (empty($teilnehmerId)) {
        echo json_encode(['hatTeilgenommen' => false, 'antwortId' => null]);
        return;
    }

    $stmt = $pdo->prepare('SELECT id, zeitstempel FROM teilnehmer_antworten WHERE umfrage_id = ? AND teilnehmer_id = ? ORDER BY zeitstempel DESC LIMIT 1');
    $stmt->execute([$_GET['umfrage_id'], $teilnehmerId]);
    $antwort = $stmt->fetch();

    echo json_encode(['hatTeilgenommen' => $antwort !== false, 'antwortId' => $antwort ? $antwort['id'] : null]);
}

function loescheAntwort($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['umfrageId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'umfrageId ist erforderlich']);
        return;
    }

    $teilnehmerId = $input['teilnehmer_id'] ?? '';

    if (empty($teilnehmerId)) {
        echo json_encode(['error' => 'teilnehmer_id ist erforderlich']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM teilnehmer_antworten WHERE umfrage_id = ? AND teilnehmer_id = ?');
    $stmt->execute([$input['umfrageId'], $teilnehmerId]);

    echo json_encode(['success' => true]);
}

function speichereAntworten($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['umfrageId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'umfrageId ist erforderlich']);
        return;
    }

    if (!isset($input['antworten']) || !is_array($input['antworten'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Antworten sind erforderlich']);
        return;
    }

    $teilnehmerId = $input['teilnehmer_id'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    if (empty($teilnehmerId)) {
        echo json_encode(['error' => 'teilnehmer_id ist erforderlich']);
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO teilnehmer_antworten (umfrage_id, antworten, teilnehmer_id, ip) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $input['umfrageId'],
        json_encode($input['antworten']),
        $teilnehmerId,
        $ip
    ]);

    echo json_encode(['success' => true]);
}
