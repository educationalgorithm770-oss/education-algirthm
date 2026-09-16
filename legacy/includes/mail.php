<?php
// includes/mail.php — High-Performance Transactional Email Dispatcher for Education Algorithm

function send_system_email($toEmail, $toName, $subject, $htmlBody, $plainText = '') {
    $host = defined('SMTP_HOST') ? SMTP_HOST : (function_exists('env') ? env('SMTP_HOST') : '');
    $port = defined('SMTP_PORT') ? (int)SMTP_PORT : (function_exists('env') ? (int)env('SMTP_PORT', 587) : 587);
    $user = defined('SMTP_USER') ? SMTP_USER : (function_exists('env') ? env('SMTP_USER') : '');
    $pass = defined('SMTP_PASS') ? SMTP_PASS : (function_exists('env') ? env('SMTP_PASS') : '');
    $fromEmail = defined('SMTP_FROM') && !empty(SMTP_FROM) ? SMTP_FROM : (function_exists('env') && env('SMTP_FROM') ? env('SMTP_FROM') : 'educationalgorithm770@gmail.com');
    $fromName = defined('SMTP_FROM_NAME') && !empty(SMTP_FROM_NAME) ? SMTP_FROM_NAME : 'Education Algorithm';

    if (empty($plainText)) {
        $plainText = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $htmlBody));
    }

    // ── METHOD 1: SendGrid HTTPS REST API (Fastest, Bypasses all Port/Socket Blocks) ──
    if (!empty($pass) && (str_starts_with($pass, 'SG.') || $host === 'smtp.sendgrid.net')) {
        try {
            $payload = [
                "personalizations" => [
                    [
                        "to" => [
                            [
                                "email" => $toEmail,
                                "name"  => !empty($toName) ? $toName : 'Student'
                            ]
                        ],
                        "subject" => $subject
                    ]
                ],
                "from" => [
                    "email" => $fromEmail,
                    "name"  => $fromName
                ],
                "content" => [
                    [
                        "type"  => "text/plain",
                        "value" => $plainText
                    ],
                    [
                        "type"  => "text/html",
                        "value" => $htmlBody
                    ]
                ]
            ];

            $ch = curl_init("https://api.sendgrid.com/v3/mail/send");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_HTTPHEADER     => [
                    "Authorization: Bearer " . $pass,
                    "Content-Type: application/json"
                ],
                CURLOPT_TIMEOUT        => 5
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                return true;
            }
            error_log("SendGrid REST API Error (HTTP {$httpCode}): " . $response);
        } catch (Throwable $e) {
            error_log("SendGrid REST API Exception: " . $e->getMessage());
        }
    }

    // ── METHOD 2: Direct Socket SMTP (Fallback) ──
    if (!empty($host) && !empty($user) && !empty($pass)) {
        try {
            $isSSL = ($port === 465);
            $protocol = $isSSL ? 'ssl://' : '';
            $timeout = 4;
            $socket = @fsockopen($protocol . $host, $port, $errno, $errstr, $timeout);
            
            if ($socket) {
                $read = function() use ($socket) {
                    $data = "";
                    while ($str = fgets($socket, 515)) {
                        $data .= $str;
                        if (substr($str, 3, 1) === " ") break;
                    }
                    return $data;
                };

                $write = function($cmd) use ($socket) {
                    fputs($socket, $cmd . "\r\n");
                };

                $read(); // Read greeting
                $write("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
                $read();

                if ($port === 587) {
                    $write("STARTTLS");
                    $tlsRes = $read();
                    if (str_starts_with($tlsRes, '220')) {
                        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                        $write("EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
                        $read();
                    }
                }

                $write("AUTH LOGIN");
                $read();
                $write(base64_encode($user));
                $read();
                $write(base64_encode($pass));
                $authRes = $read();

                if (str_starts_with($authRes, '235')) {
                    $write("MAIL FROM: <{$fromEmail}>");
                    $read();
                    $write("RCPT TO: <{$toEmail}>");
                    $read();
                    $write("DATA");
                    $read();

                    $boundary = "=_EA_Mail_" . md5(uniqid(microtime(true)));
                    $mimeHeaders  = "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <{$fromEmail}>\r\n";
                    $mimeHeaders .= "To: " . (!empty($toName) ? "=?UTF-8?B?" . base64_encode($toName) . "?= " : "") . "<{$toEmail}>\r\n";
                    $mimeHeaders .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
                    $mimeHeaders .= "Date: " . date('r') . "\r\n";
                    $mimeHeaders .= "MIME-Version: 1.0\r\n";
                    $mimeHeaders .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

                    $messageBody  = "--{$boundary}\r\n";
                    $messageBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
                    $messageBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                    $messageBody .= $plainText . "\r\n\r\n";

                    $messageBody .= "--{$boundary}\r\n";
                    $messageBody .= "Content-Type: text/html; charset=UTF-8\r\n";
                    $messageBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
                    $messageBody .= $htmlBody . "\r\n\r\n";
                    $messageBody .= "--{$boundary}--\r\n.";

                    $write($mimeHeaders . "\r\n" . $messageBody);
                    $read();
                    $write("QUIT");
                    fclose($socket);
                    return true;
                }
                fclose($socket);
            }
        } catch (Throwable $e) {
            error_log("Socket SMTP Exception: " . $e->getMessage());
        }
    }

    // ── METHOD 3: PHP mail() Fallback ──
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
    return @mail($toEmail, $subject, $htmlBody, $headers);
}
