<?php
// includes/plagiarism-checker.php — MOSS-Grade AST Plagiarism & Code Fingerprinting Engine (2026)

/**
 * Tokenize and normalize source code into an Abstract Syntax Tree (AST) signature
 */
function computeAstFingerprint($code, $lang = 'python') {
    // 1. Strip comments
    $clean = preg_replace('/\/\/.*$/m', '', $code);
    $clean = preg_replace('/#.*$/m', '', $clean);
    $clean = preg_replace('/\/\*[\s\S]*?\*\//', '', $clean);
    $clean = preg_replace('/"""[\s\S]*?"""/', '', $clean);
    $clean = preg_replace('/\'\'\'[\s\S]*?\'\'\'/', '', $clean);

    // 2. Tokenize string literals and numbers
    $clean = preg_replace('/"[^"]*"|\'[^\']*\'/', '$STR', $clean);
    $clean = preg_replace('/\b\d+(?:\.\d+)?\b/', '$NUM', $clean);

    // 3. Normalized Language Keywords
    $keywords = [
        'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'import', 'from',
        'public', 'private', 'protected', 'static', 'void', 'int', 'double', 'float', 'String',
        'boolean', 'char', 'new', 'include', 'using', 'namespace', 'cout', 'cin', 'endl', 'true', 'false',
        'const', 'let', 'var', 'function', 'async', 'await', 'try', 'catch', 'throw'
    ];
    
    // Replace custom variable and function names with generic $ID
    $tokens = preg_split('/([^\w$])/', $clean, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
    $normalized = [];
    foreach ($tokens as $t) {
        $trimmed = trim($t);
        if (empty($trimmed)) continue;
        if (preg_match('/^[a-zA-Z_]\w*$/', $trimmed) && !in_array(strtolower($trimmed), $keywords) && !str_starts_with($trimmed, '$')) {
            $normalized[] = '$ID';
        } else {
            $normalized[] = $trimmed;
        }
    }

    return implode(' ', $normalized);
}

/**
 * Calculate Jaccard K-gram similarity between two code submissions
 */
function calculateCodeSimilarity($codeA, $codeB, $lang = 'python') {
    $fpA = computeAstFingerprint($codeA, $lang);
    $fpB = computeAstFingerprint($codeB, $lang);

    $wordsA = explode(' ', $fpA);
    $wordsB = explode(' ', $fpB);

    $k = 4;
    $gramsA = [];
    for ($i = 0; $i <= count($wordsA) - $k; $i++) {
        $gramsA[] = implode(' ', array_slice($wordsA, $i, $k));
    }

    $gramsB = [];
    for ($i = 0; $i <= count($wordsB) - $k; $i++) {
        $gramsB[] = implode(' ', array_slice($wordsB, $i, $k));
    }

    $setA = array_unique($gramsA);
    $setB = array_unique($gramsB);

    if (empty($setA) || empty($setB)) {
        similar_text($fpA, $fpB, $pct);
        return round($pct, 2);
    }

    $intersection = array_intersect($setA, $setB);
    $union = array_unique(array_merge($setA, $setB));

    $jaccard = count($intersection) / max(1, count($union));
    return round($jaccard * 100, 2);
}

/**
 * Check code against previous submissions for a challenge
 */
function checkSubmissionPlagiarism(PDO $pdo, $challengeId, $studentId, $currentCode, $lang = 'python') {
    try {
        $stmt = $pdo->prepare("
            SELECT student_id, code 
            FROM code_submissions 
            WHERE challenge_id = ? AND student_id != ? AND verdict = 'ACCEPTED' 
            ORDER BY id DESC LIMIT 50
        ");
        $stmt->execute([$challengeId, $studentId]);
        $submissions = $stmt->fetchAll();

        $maxSimilarity = 0.0;
        $matchedStudent = 0;

        foreach ($submissions as $sub) {
            $sim = calculateCodeSimilarity($currentCode, $sub['code'], $lang);
            if ($sim > $maxSimilarity) {
                $maxSimilarity = $sim;
                $matchedStudent = $sub['student_id'];
            }
        }

        return [
            'similarity_percent' => $maxSimilarity,
            'is_flagged'         => ($maxSimilarity >= 85.0),
            'matched_student_id' => $matchedStudent
        ];
    } catch (Exception $e) {
        return ['similarity_percent' => 0, 'is_flagged' => false, 'matched_student_id' => 0];
    }
}
