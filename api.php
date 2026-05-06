<?php
header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? 'health';
$scoresFile = __DIR__ . '/scores.json';
$achievementsFile = __DIR__ . '/achievements.json';

if (!file_exists($scoresFile)) {
    file_put_contents($scoresFile, json_encode([], JSON_PRETTY_PRINT));
}
if (!file_exists($achievementsFile)) {
    file_put_contents($achievementsFile, json_encode([
        'first_flight' => ['name' => 'First Flight', 'desc' => 'Submit your first score', 'unlocked' => false],
        'high_flyer' => ['name' => 'High Flyer', 'desc' => 'Score 1000+ points', 'unlocked' => false],
        'survivor' => ['name' => 'Survivor', 'desc' => 'Survive 10 levels', 'unlocked' => false],
    ], JSON_PRETTY_PRINT));
}

function readData(string $file): array {
    $json = file_get_contents($file);
    return json_decode($json, true) ?? [];
}

function writeData(string $file, array $data): void {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

function getLevel(int $score): int {
    return min(10, floor($score / 100) + 1); // Levels 1-10 based on score
}

function checkAchievements(array $userAchievements, int $score, int $level, int $coins, array $unlockedAchievements): array {
    $newlyUnlocked = [];
    
    // Define achievement conditions
    $achievementConditions = [
        'first_flight' => $score > 0,
        'coin_collector' => $coins >= 100,
        'high_flyer' => $score >= 5000,
        'survivor' => $level >= 5,
        'cosmic_explorer' => $level >= 10,
        'perfect_run' => in_array('perfect_run', $unlockedAchievements),
        'power_master' => in_array('power_master', $unlockedAchievements),
        'speed_demon' => in_array('speed_demon', $unlockedAchievements)
    ];
    
    foreach ($achievementConditions as $achievementId => $condition) {
        if ($condition && !isset($userAchievements[$achievementId]['unlocked'])) {
            $newlyUnlocked[] = $achievementId;
        }
    }
    
    return $newlyUnlocked;
}

switch ($action) {
    case 'health':
        echo json_encode(['status' => 'ok']);
        break;

    case 'scores':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $scores = readData($scoresFile);
            usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
            echo json_encode(array_slice($scores, 0, 10));
            break;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $payload = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $name = trim($payload['name'] ?? '');
            $score = intval($payload['score'] ?? 0);
            $level = intval($payload['level'] ?? 1);
            $coins = intval($payload['coins'] ?? 0);
            $achievements = $payload['achievements'] ?? [];

            if ($name === '' || $score < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid input']);
                break;
            }

            $scores = readData($scoresFile);
            $userAchievements = readData($achievementsFile);
            $newlyUnlocked = checkAchievements($userAchievements, $score, $level, $coins, $achievements);

            // Update achievements
            foreach ($newlyUnlocked as $achievementId) {
                if (isset($userAchievements[$achievementId])) {
                    $userAchievements[$achievementId]['unlocked'] = true;
                }
            }
            writeData($achievementsFile, $userAchievements);

            $scores[] = [
                'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
                'score' => $score,
                'level' => $level,
                'coins' => $coins,
                'achievements' => $achievements,
                'date' => date('c'),
            ];
            usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
            writeData($scoresFile, $scores);

            http_response_code(201);
            echo json_encode([
                'top_scores' => array_slice($scores, 0, 10), 
                'newly_unlocked_achievements' => $newlyUnlocked
            ]);
            break;
        }

        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;

    case 'achievements':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            echo json_encode(readData($achievementsFile));
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
