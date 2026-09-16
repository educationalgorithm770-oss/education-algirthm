<?php
$sql = file_get_contents(__DIR__ . '/../database/migrations/001_initial_schema.sql');
echo 'course_audit_logs in 001: ' . (strpos($sql, 'course_audit_logs') !== false ? 'YES' : 'NO') . PHP_EOL;
echo 'code_submissions in 001: ' . (strpos($sql, 'code_submissions') !== false ? 'YES' : 'NO') . PHP_EOL;
