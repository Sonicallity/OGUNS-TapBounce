<?php
header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? 'health';
$scoresFile = __DIR__ . '/scores.json';

if (!file_exists($scoresFile)) {
    file_put_contents($scoresFile, json_encode([], JSON_PRETTY_PRINT));
}

function readScores(string $file): array {
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function writeScores(string $file, array $scores): void {
    file_put_contents($file, json_encode($scores, JSON_PRETTY_PRINT));
}

switch ($action) {
    case 'health':
        echo json_encode(['status' => 'ok']);
        break;

    case 'scores':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $scores = readScores($scoresFile);
            usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
            echo json_encode(array_slice($scores, 0, 10));
            break;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $payload = json_decode(file_get_contents('php://input'), true);
            if (!is_array($payload)) {
                $payload = $_POST;
            }

            $name = trim($payload['name'] ?? '');
            $score = isset($payload['score']) ? intval($payload['score']) : null;

            if ($name === '' || $score === null || $score < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid name or score.']);
                break;
            }

            $scores = readScores($scoresFile);
            $scores[] = [
                'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
                'score' => $score,
                'date' => date('c'),
            ];
            usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
            writeScores($scoresFile, $scores);

            http_response_code(201);
            echo json_encode(array_slice($scores, 0, 10));
            break;
        }

        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Unknown action']);
        break;
}
