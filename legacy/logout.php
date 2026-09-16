<?php
require_once __DIR__ . "/config.php";

$isAdmin = !empty($_SESSION["admin_id"]);
$isInstructor = !empty($_SESSION["instructor_id"]);

$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

session_destroy();

// Redirect to main website home page
header("Location: ./");
exit;
