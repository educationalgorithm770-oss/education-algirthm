<?php
require_once __DIR__ . "/config.php";
// Force token generation and cookie setting
csrf_token();
header("Content-Type: application/json");
echo json_encode(["status" => "initialized"]);
