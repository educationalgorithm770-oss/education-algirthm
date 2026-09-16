<?php
/**
 * Education Algorithm LMS — Gamification, Streaks & XP Engine
 */

require_once __DIR__ . '/../config.php';

function ensureGamificationSchema(PDO $pdo) {
    // Schema is maintained via schema.sql and migrate.php (No runtime DDL)
}

/**
 * Record a student learning touchpoint to maintain daily streak
 */
function recordStudentActivity(PDO $pdo, int $studentId): array {
    ensureGamificationSchema($pdo);
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    try {
        $stmt = $pdo->prepare("SELECT * FROM student_streaks WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $streakRow = $stmt->fetch();

        if (!$streakRow) {
            $stmtInsert = $pdo->prepare("
                INSERT INTO student_streaks (student_id, current_streak, longest_streak, last_activity_date)
                VALUES (?, 1, 1, ?)
            ");
            $stmtInsert->execute([$studentId, $today]);
            return ['current_streak' => 1, 'longest_streak' => 1, 'is_new_streak' => true];
        }

        $lastDate = $streakRow['last_activity_date'] ?? $streakRow['last_active_date'] ?? $today;
        $currentStreak = (int)($streakRow['current_streak'] ?? 1);
        $longestStreak = (int)($streakRow['longest_streak'] ?? 1);

        if ($lastDate === $today) {
            // Already logged today
            return ['current_streak' => $currentStreak, 'longest_streak' => $longestStreak, 'is_new_streak' => false];
        } elseif ($lastDate === $yesterday) {
            // Consecutive day streak increment
            $currentStreak++;
            if ($currentStreak > $longestStreak) {
                $longestStreak = $currentStreak;
            }
            $stmtUpd = $pdo->prepare("
                UPDATE student_streaks 
                SET current_streak = ?, longest_streak = ?, last_activity_date = ? 
                WHERE student_id = ?
            ");
            $stmtUpd->execute([$currentStreak, $longestStreak, $today, $studentId]);
            return ['current_streak' => $currentStreak, 'longest_streak' => $longestStreak, 'is_new_streak' => true];
        } else {
            // Streak broken, reset to 1
            $stmtUpd = $pdo->prepare("
                UPDATE student_streaks 
                SET current_streak = 1, last_activity_date = ? 
                WHERE student_id = ?
            ");
            $stmtUpd->execute([$today, $studentId]);
            return ['current_streak' => 1, 'longest_streak' => $longestStreak, 'is_new_streak' => false];
        }
    } catch (Exception $e) {
        return ['current_streak' => 1, 'longest_streak' => 1, 'is_new_streak' => false];
    }
}

/**
 * Calculate comprehensive student gamification stats (XP, level, streak, badges)
 */
function getStudentGamificationStats(PDO $pdo, int $studentId): array {
    ensureGamificationSchema($pdo);
    
    // 1. Get streak
    $stmtStreak = $pdo->prepare("SELECT current_streak, longest_streak FROM student_streaks WHERE student_id = ? LIMIT 1");
    $stmtStreak->execute([$studentId]);
    $storedStreak = $stmtStreak->fetch(PDO::FETCH_ASSOC) ?: [];
    $streakInfo = [
        'current_streak' => (int)($storedStreak['current_streak'] ?? 0),
        'longest_streak' => (int)($storedStreak['longest_streak'] ?? 0)
    ];
    $currentStreak = $streakInfo['current_streak'];
    $longestStreak = $streakInfo['longest_streak'];

    // 2. Count completions
    $lessonsDone = 0;
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM lesson_completions WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $lessonsDone = (int)$stmt->fetchColumn();
    } catch (Exception $e) {}

    // 3. Count passed quizzes
    $quizzesPassed = 0;
    try {
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT quiz_id) FROM quiz_attempts WHERE student_id = ? AND passed = 1");
        $stmt->execute([$studentId]);
        $quizzesPassed = (int)$stmt->fetchColumn();
    } catch (Exception $e) {}

    // 4. Count approved assignments
    $assignmentsDone = 0;
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM assignment_submissions WHERE student_id = ? AND status IN ('reviewed','graded','approved')");
        $stmt->execute([$studentId]);
        $assignmentsDone = (int)$stmt->fetchColumn();
    } catch (Exception $e) {}

    // 5. Total XP Calculation
    // Lesson = 50 XP, Quiz = 100 XP, Assignment = 150 XP, Streak Bonus = Streak * 20 XP
    $totalXp = ($lessonsDone * 50) + ($quizzesPassed * 100) + ($assignmentsDone * 150) + ($currentStreak * 20);

    // 6. Level Calculation (Every 300 XP = 1 Level)
    $level = max(1, (int)floor($totalXp / 300) + 1);
    $xpInCurrentLevel = $totalXp % 300;
    $xpNextLevelPercent = round(($xpInCurrentLevel / 300) * 100);

    $levelTitles = [
        1 => 'Novice Explorer',
        2 => 'Code Apprentice',
        3 => 'Script Craftsman',
        4 => 'Algorithm Specialist',
        5 => 'Full-Stack Developer',
        6 => 'Systems Architect',
        7 => 'Distinguished Fellow'
    ];
    $levelTitle = $levelTitles[min($level, 7)] ?? 'Senior Scholar';

    // 7. Milestone Badges
    $badges = [
        [
            'id' => 'first_step',
            'title' => 'First Step',
            'desc' => 'Completed first lecture',
            'icon' => '🎯',
            'unlocked' => ($lessonsDone >= 1)
        ],
        [
            'id' => 'momentum',
            'title' => 'Speed Learner',
            'desc' => 'Finished 5 lessons',
            'icon' => '⚡',
            'unlocked' => ($lessonsDone >= 5)
        ],
        [
            'id' => 'streak_3',
            'title' => 'On Fire',
            'desc' => '3+ Day Active Learning Streak',
            'icon' => '🔥',
            'unlocked' => ($currentStreak >= 3)
        ],
        [
            'id' => 'quiz_master',
            'title' => 'Quiz Master',
            'desc' => 'Achieved passing score in assessment',
            'icon' => '🏆',
            'unlocked' => ($quizzesPassed >= 1)
        ],
        [
            'id' => 'practitioner',
            'title' => 'Project Builder',
            'desc' => 'Approved coursework assignment',
            'icon' => '🛠️',
            'unlocked' => ($assignmentsDone >= 1)
        ]
    ];

    $unlockedBadgesCount = count(array_filter($badges, fn($b) => $b['unlocked']));

    return [
        'current_streak' => $currentStreak,
        'longest_streak' => $longestStreak,
        'total_xp' => $totalXp,
        'level' => $level,
        'level_title' => $levelTitle,
        'xp_in_level' => $xpInCurrentLevel,
        'xp_level_percent' => $xpNextLevelPercent,
        'lessons_done' => $lessonsDone,
        'quizzes_passed' => $quizzesPassed,
        'assignments_done' => $assignmentsDone,
        'badges' => $badges,
        'unlocked_badges_count' => $unlockedBadgesCount
    ];
}
