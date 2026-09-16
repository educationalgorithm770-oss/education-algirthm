<?php
function check_rate_limit(PDO $pdo, string $key, string $action, int $maxRequests, int $windowSeconds): bool {
    $started = false;
    try {
        if (!$pdo->inTransaction()) { $pdo->beginTransaction(); $started = true; }
        $now = date('Y-m-d H:i:s'); $cutoff = time() - $windowSeconds;
        $stmt = $pdo->prepare("SELECT id, request_count, window_start FROM rate_limits WHERE rate_key = ? AND action = ? FOR UPDATE");
        $stmt->execute([$key, $action]); $record = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($record) {
            if (strtotime($record['window_start']) <= $cutoff) { $pdo->prepare("UPDATE rate_limits SET request_count=1, window_start=? WHERE id=?")->execute([$now,$record['id']]); $allowed=true; }
            elseif ((int)$record['request_count'] >= $maxRequests) $allowed=false;
            else { $pdo->prepare("UPDATE rate_limits SET request_count=request_count+1 WHERE id=?")->execute([$record['id']]); $allowed=true; }
        } else { $pdo->prepare("INSERT INTO rate_limits (rate_key, action, request_count, window_start) VALUES (?, ?, 1, ?)")->execute([$key,$action,$now]); $allowed=true; }
        if ($started) $pdo->commit(); 

        // Probabilistic Garbage Collection (1 in 50 execution chance to clean expired records)
        if (random_int(1, 50) === 1) {
            try {
                $pdo->prepare("DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 DAY)")->execute();
            } catch (Throwable $e) {}
        }

        return $allowed;
    } catch (Throwable $e) { if ($started && $pdo->inTransaction()) $pdo->rollBack(); error_log('Rate limiter error: '.$e->getMessage()); return false; }
}
