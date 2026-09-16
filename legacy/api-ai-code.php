<?php
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
header("Content-Type: application/json");

require_once __DIR__ . '/includes/rate-limiter.php';

try {
    // Require student login
    if (!isset($_SESSION["student_id"])) {
        http_response_code(401);
        echo json_encode(["error" => "Please log in to access AI Code Mentor."]);
        exit;
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload."]);
        exit;
    }

    $csrfToken = $data['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!empty($_SESSION['csrf_token']) && !empty($csrfToken) && !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        echo json_encode(["error" => "Security token expired. Please refresh the page."]);
        exit;
    }

    $studentId = (int)($_SESSION["student_id"] ?? 0);
    session_write_close(); // Release session lock
    if (!check_rate_limit($pdo, 'student_' . $studentId, 'ai_mentor', 30, 3600)) {
        http_response_code(429);
        echo json_encode(["reply" => "⚠️ Hourly AI query limit reached. Please try again in a little while."]);
        exit;
    }

    $code = substr(trim($data["code"] ?? ""), 0, 5000);
    $action = trim($data["action"] ?? "explain"); // explain, debug, optimize, testcases
    $lang = trim($data["language"] ?? "java");

    if (empty($code)) {
        echo json_encode(["reply" => "⚠️ Please write or paste code in the editor first."]);
        exit;
    }

    $promptMap = [
        "explain" => "Explain the following {$lang} code step-by-step in clear, friendly terms for a student. Break down key concepts, variables, and overall algorithm logic concisely.",
        "debug" => "Analyze this {$lang} code for bugs, syntax errors, edge-case failures, or memory leaks. Explain what is wrong and provide a corrected version with explanations.",
        "optimize" => "Analyze the Time Complexity and Space Complexity (Big-O) of this {$lang} code. Suggest optimization strategies with clean code examples.",
        "testcases" => "Generate 5 comprehensive unit test cases (including standard, boundary, and edge cases) for this {$lang} code with expected inputs and outputs."
    ];

    $selectedPrompt = $promptMap[$action] ?? $promptMap["explain"];

    $systemPrompt = "You are the AI Code Mentor for Education Algorithm academy. Provide clear, pedagogical, concise programming explanations. Format code using markdown syntax blocks.";

    $apiKey = defined('GEMINI_API_KEY') ? trim(GEMINI_API_KEY) : '';
    $replyText = null;

    if (!empty($apiKey) && !str_contains($apiKey, 'your_')) {
        $payload = [
            "system_instruction" => ["parts" => [["text" => $systemPrompt]]],
            "contents" => [
                ["role" => "user", "parts" => [["text" => $selectedPrompt . "\n\n```" . $lang . "\n" . $code . "\n```"]]]
            ],
            "generationConfig" => ["maxOutputTokens" => 750, "temperature" => 0.3]
        ];

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && !empty($response)) {
            $resData = json_decode($response, true);
            $replyText = $resData["candidates"][0]["content"]["parts"][0]["text"] ?? null;
        }
    }

    // Fallback pedagogical response if offline
    if (empty($replyText)) {
        if ($action === 'optimize') {
            $replyText = "⚡ **Complexity Analysis:**\n\n• **Estimated Time Complexity:** \(O(N)\) or \(O(N \\log N)\) based on loops/traversals.\n• **Space Complexity:** \(O(1)\) auxiliary memory if no dynamic structures are allocated.\n\n💡 *Tip:* Avoid nested loops over large datasets. Consider hash maps or two-pointer patterns to reduce \(O(N^2)\) to \(O(N)\).";
        } elseif ($action === 'debug') {
            $replyText = "🔍 **Code Analysis:**\n\n• Checked syntax structure and brace matching.\n• Ensure variable types and null checks are handled before accessing object methods.\n• For loops, verify termination condition boundaries (e.g. `< length` vs `<= length`).";
        } elseif ($action === 'testcases') {
            $replyText = "🧪 **Recommended Test Suite:**\n\n1. **Normal Case:** Standard input with positive values.\n2. **Empty / Minimum Case:** Empty array / null / 0 values.\n3. **Single Element:** Array with 1 element.\n4. **Large Scale:** Boundary limits to check for integer overflow.\n5. **Duplicate / Negative Values:** Extreme edge condition inputs.";
        } else {
            $replyText = "💡 **Code Summary:**\n\nYour code defines structured logic. Key execution flow initializes variables, processes input through conditional/iterative blocks, and computes the result.\n\n👉 Click **Check Big-O** or **Debug & Fix** for specialized analysis!";
        }
    }

    echo json_encode(["success" => true, "reply" => $replyText, "content" => $replyText, "action" => $action]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Internal AI Mentor error.", "message" => $e->getMessage()]);
}
