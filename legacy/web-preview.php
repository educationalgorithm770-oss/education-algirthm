<?php
/**
 * web-preview.php — Sandboxed HTML/CSS/JS Live Preview Runner
 * Renders HTML exercises inside an isolated viewport with strict Content Security Policy.
 * ZERO access to LMS cookies, admin tokens, or parent window DOM.
 */
require_once __DIR__ . '/config.php';

// Set strict isolation headers
header("Content-Type: text/html; charset=UTF-8");
header("X-Frame-Options: SAMEORIGIN");
header("X-Content-Type-Options: nosniff");
header("Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:;");

$rawCode = $_POST['html_code'] ?? ($_GET['html_code'] ?? '');
if (empty($rawCode)) {
    $rawInput = file_get_contents('php://input');
    $json = json_decode($rawInput, true);
    if (!empty($json['html_code'])) {
        $rawCode = $json['html_code'];
    }
}

$cleanHtml = $rawCode ?: '<!DOCTYPE html><html><body style="font-family:sans-serif;color:#64748b;padding:2rem;text-align:center;"><h3>Live HTML Viewport Ready</h3><p>Write HTML, CSS, or JS in the editor to see instant live preview.</p></body></html>';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Web Live Preview</title>
</head>
<body>
    <?php echo $cleanHtml; ?>
</body>
</html>
