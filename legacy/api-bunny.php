<?php
/**
 * api-bunny.php — Bunny.net Stream CDN Integration
 * Handles: Upload to Bunny, Status Check, Signed Embed URL, Delete
 *
 * Setup: Add to your .env file:
 *   BUNNY_LIBRARY_ID=your_library_id
 *   BUNNY_API_KEY=your_api_key
 *   BUNNY_CDN_HOSTNAME=iframe.mediadelivery.net
 *   BUNNY_STREAM_HOST=video.bunnycdn.com
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');

try {
// Only authenticated admins or instructors can use this API.
// Do not call redirecting auth guards here because they terminate the request.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$adminId = (int)($_SESSION['admin_id'] ?? 0);
$instructorId = (int)($_SESSION['instructor_id'] ?? 0);
if ($adminId <= 0 && $instructorId <= 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Bunny.net Credentials from .env
$BUNNY_LIBRARY_ID   = env('BUNNY_LIBRARY_ID', '');
$BUNNY_API_KEY      = env('BUNNY_API_KEY', '');
$BUNNY_CDN_HOST     = env('BUNNY_CDN_HOSTNAME', 'iframe.mediadelivery.net');
$BUNNY_STREAM_HOST  = env('BUNNY_STREAM_HOST', 'video.bunnycdn.com');

if (empty($BUNNY_LIBRARY_ID) || empty($BUNNY_API_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'Bunny.net credentials not configured. Add BUNNY_LIBRARY_ID and BUNNY_API_KEY to your .env file.']);
    exit;
}

$isMultipart = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;
$input = $isMultipart ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);
$action = trim($input['action'] ?? $_GET['action'] ?? '');
if (in_array($action, ['create_video','upload_video','save_to_db','delete_video'], true)) {
    verify_csrf();
}

// ─────────────────────────────────────────────────────────────────
// ACTION: create_video — Create video entry in Bunny, return upload URL
// ─────────────────────────────────────────────────────────────────
if ($action === 'create_video') {
    if ($instructorId <= 0 && $adminId <= 0) {
        http_response_code(403);
        echo json_encode(['error'=>'Unauthorized.']);
        exit;
    }
    $title = clean_text($input['title'] ?? 'Untitled Lecture', 150);
    if ($title === '') {
        http_response_code(400);
        echo json_encode(['error'=>'Video title is required.']);
        exit;
    }

    $ch = curl_init("https://{$BUNNY_STREAM_HOST}/library/{$BUNNY_LIBRARY_ID}/videos");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['title'=>$title]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json','AccessKey: '.$BUNNY_API_KEY],
        CURLOPT_TIMEOUT => 20
    ]);
    $resp=curl_exec($ch); $code=curl_getinfo($ch,CURLINFO_HTTP_CODE); $err=curl_error($ch); curl_close($ch);
    $data=json_decode($resp,true) ?: [];
    if ($code !== 200 || empty($data['guid'])) {
        error_log("Bunny create_video failed: ".($err ?: $resp));
        http_response_code(502);
        echo json_encode(['error'=>'Failed to create video on Bunny.net.']);
        exit;
    }

    echo json_encode([
        'bunny_video_id'=>$data['guid'],
        'title'=>$data['title'] ?? $title
    ]);
    exit;
}

 // ACTION: upload_video — browser uploads to LMS; LMS uploads to Bunny
if ($action === 'upload_video') {
    if (empty($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error'=>'Video upload was not received.']);
        exit;
    }
    $moduleId=(int)($input['module_id'] ?? 0);
    $title=clean_text($input['title'] ?? 'Untitled Lecture',150);
    $order=(int)($input['order'] ?? 0);
    if ($moduleId<=0 || $title==='') { http_response_code(400); echo json_encode(['error'=>'Module and title are required.']); exit; }

    $stmt=$pdo->prepare("SELECT course_id FROM modules WHERE id=? LIMIT 1");
    $stmt->execute([$moduleId]);
    $courseId=(int)$stmt->fetchColumn();
    if ($courseId<=0) { http_response_code(404); echo json_encode(['error'=>'Module not found.']); exit; }
    if ($instructorId>0) {
        require_once __DIR__.'/instructor-auth.php';
        enforce_instructor_course_scope($instructorId,$courseId);
    }

    $file=$_FILES['video'];
    if ($file['size'] > 5120*1024*1024) { http_response_code(413); echo json_encode(['error'=>'Video exceeds 5GB.']); exit; }
    $mime=mime_content_type($file['tmp_name']) ?: '';
    $allowed=['video/mp4','video/webm','video/quicktime','video/x-matroska'];
    if (!in_array($mime,$allowed,true)) { http_response_code(400); echo json_encode(['error'=>'Unsupported video file type.']); exit; }

    $ext=strtolower(pathinfo($file['name'],PATHINFO_EXTENSION));
    if (!in_array($ext,['mp4','webm','mov','mkv'],true)) { http_response_code(400); echo json_encode(['error'=>'Unsupported video extension.']); exit; }

    $ch=curl_init("https://{$BUNNY_STREAM_HOST}/library/{$BUNNY_LIBRARY_ID}/videos");
    curl_setopt_array($ch,[
        CURLOPT_RETURNTRANSFER=>true, CURLOPT_POST=>true,
        CURLOPT_POSTFIELDS=>json_encode(['title'=>$title]),
        CURLOPT_HTTPHEADER=>['Content-Type: application/json','AccessKey: '.$BUNNY_API_KEY],
        CURLOPT_TIMEOUT=>20
    ]);
    $resp=curl_exec($ch); $code=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
    $created=json_decode($resp,true) ?: [];
    if ($code!==200 || empty($created['guid'])) { http_response_code(502); echo json_encode(['error'=>'Unable to create Bunny video.']); exit; }

    $guid=$created['guid'];
    $fh=fopen($file['tmp_name'],'rb');
    $uploadUrl="https://{$BUNNY_STREAM_HOST}/library/{$BUNNY_LIBRARY_ID}/videos/{$guid}";
    $ch=curl_init($uploadUrl);
    curl_setopt_array($ch,[
        CURLOPT_UPLOAD=>true, CURLOPT_INFILE=>$fh, CURLOPT_INFILESIZE=>$file['size'],
        CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>['Content-Type: application/octet-stream','AccessKey: '.$BUNNY_API_KEY],
        CURLOPT_TIMEOUT=>600
    ]);
    $uploadResp=curl_exec($ch); $uploadCode=curl_getinfo($ch,CURLINFO_HTTP_CODE); $uploadErr=curl_error($ch); curl_close($ch); fclose($fh);

    if ($uploadCode<200 || $uploadCode>=300) {
        error_log("Bunny upload failed: ".$uploadErr." ".$uploadResp);
        http_response_code(502);
        echo json_encode(['error'=>'Cloud upload failed.']);
        exit;
    }

    $stmt=$pdo->prepare("INSERT INTO videos (module_id,title,file_path,bunny_video_id,duration,sort_order) VALUES (?,?, '', ?, NULL, ?)");
    $stmt->execute([$moduleId,$title,$guid,$order]);
    echo json_encode(['success'=>true,'bunny_video_id'=>$guid,'title'=>$title]);
    exit;
}

// Resolve Bunny video ownership/scope against local DB.
function enforceBunnyVideoScope(PDO $pdo, string $bunnyVideoId, int $adminId, int $instructorId): array {
    $stmt=$pdo->prepare("SELECT v.id, v.module_id, m.course_id FROM videos v JOIN modules m ON v.module_id=m.id WHERE v.bunny_video_id=? LIMIT 1");
    $stmt->execute([$bunnyVideoId]);
    $row=$stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Video is not registered in the LMS.']);
        exit;
    }
    if ($adminId>0) return $row;
    require_once __DIR__.'/instructor-auth.php';
    if (!is_course_assigned_to_instructor($instructorId,(int)$row['course_id'])) {
        http_response_code(403);
        echo json_encode(['error'=>'Forbidden: video is outside your assigned course scope.']);
        exit;
    }
    return $row;
}

// ─────────────────────────────────────────────────────────────────
// ACTION: get_status — Get video encoding/processing status
// ─────────────────────────────────────────────────────────────────
if ($action === 'get_status') {
    $bunnyVideoId = trim($input['bunny_video_id'] ?? $_GET['bunny_video_id'] ?? '');
    if (!$bunnyVideoId) {
        echo json_encode(['error' => 'bunny_video_id is required']);
        exit;
    }

    enforceBunnyVideoScope($pdo,$bunnyVideoId,$adminId,$instructorId);
    $ch = curl_init("https://{$BUNNY_STREAM_HOST}/library/{$BUNNY_LIBRARY_ID}/videos/{$bunnyVideoId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['AccessKey: ' . $BUNNY_API_KEY],
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($resp, true);

    /*
     * Bunny status codes:
     * 0 = Created, 1 = Uploaded, 2 = Processing, 3 = Transcoding
     * 4 = Finished, 5 = Error, 6 = UploadFailed
     */
    $statusLabels = [
        0 => 'Created',
        1 => 'Uploaded',
        2 => 'Processing',
        3 => 'Transcoding',
        4 => 'Ready',
        5 => 'Error',
        6 => 'Upload Failed'
    ];

    $statusCode = (int)($data['status'] ?? 0);
    echo json_encode([
        'bunny_video_id' => $bunnyVideoId,
        'status_code'    => $statusCode,
        'status_label'   => $statusLabels[$statusCode] ?? 'Unknown',
        'ready'          => ($statusCode === 4),
        'thumbnail'      => $data['thumbnailFileName'] ?? null,
        'duration'       => $data['length'] ?? null,
        'resolution'     => ($data['width'] ?? 0) . 'x' . ($data['height'] ?? 0),
    ]);
    exit;
}

// ─────────────────────────────────────────────────────────────────
// ACTION: get_embed_url — Build secure signed embed URL for watch.php
// ─────────────────────────────────────────────────────────────────
if ($action === 'get_embed_url') {
    $bunnyVideoId = trim($input['bunny_video_id'] ?? $_GET['bunny_video_id'] ?? '');
    if (!$bunnyVideoId) {
        echo json_encode(['error' => 'bunny_video_id is required']);
        exit;
    }

    enforceBunnyVideoScope($pdo,$bunnyVideoId,$adminId,$instructorId);

    // Signed URL — expires in 4 hours, locked to student's IP
    $expires    = time() + (4 * 3600);
    $studentIp  = $_SERVER['REMOTE_ADDR'] ?? '';
    $tokenRaw   = $BUNNY_API_KEY . $BUNNY_LIBRARY_ID . $expires . $studentIp;
    $token      = hash('sha256', $tokenRaw);

    $embedUrl = "https://{$BUNNY_CDN_HOST}/embed/{$BUNNY_LIBRARY_ID}/{$bunnyVideoId}";
    $embedUrl .= "?token={$token}&expires={$expires}&captions=false&preload=true";

    echo json_encode([
        'embed_url'      => $embedUrl,
        'bunny_video_id' => $bunnyVideoId,
        'expires_at'     => date('Y-m-d H:i:s', $expires),
    ]);
    exit;
}

// ─────────────────────────────────────────────────────────────────
// ACTION: save_to_db — Save bunny_video_id to videos table
// ─────────────────────────────────────────────────────────────────
if ($action === 'save_to_db') {
    $videoId=(int)($input['video_id'] ?? 0);
    $bunnyVideoId=trim($input['bunny_video_id'] ?? '');
    $duration=trim($input['duration'] ?? '');
    if (!$videoId || !$bunnyVideoId) { http_response_code(400); echo json_encode(['error'=>'video_id and bunny_video_id are required']); exit; }

    $stmt=$pdo->prepare("SELECT v.id, m.course_id FROM videos v JOIN modules m ON v.module_id=m.id WHERE v.id=? LIMIT 1");
    $stmt->execute([$videoId]); $video=$stmt->fetch();
    if (!$video) { http_response_code(404); echo json_encode(['error'=>'Video record not found.']); exit; }
    if ($instructorId>0) {
        require_once __DIR__.'/instructor-auth.php';
        enforce_instructor_course_scope($instructorId,(int)$video['course_id']);
    }
    $stmt=$pdo->prepare("UPDATE videos SET bunny_video_id=?, duration=? WHERE id=?");
    $stmt->execute([$bunnyVideoId,$duration?:null,$videoId]);
    echo json_encode(['success'=>true,'video_id'=>$videoId,'bunny_video_id'=>$bunnyVideoId]);
    exit;
}

// ─────────────────────────────────────────────────────────────────
// ACTION: list_videos — List all videos from Bunny library
// ─────────────────────────────────────────────────────────────────
if ($action === 'list_videos') {
    if ($adminId <= 0) { http_response_code(403); echo json_encode(['error'=>'Administrator access required.']); exit; }
    $ch = curl_init("https://{$BUNNY_STREAM_HOST}/library/{$BUNNY_LIBRARY_ID}/videos?page=1&itemsPerPage=100&orderBy=date");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['AccessKey: ' . $BUNNY_API_KEY],
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($resp, true);
    echo json_encode(['videos' => $data['items'] ?? [], 'total' => $data['totalItems'] ?? 0]);
    exit;
}

// ─────────────────────────────────────────────────────────────────
// ACTION: delete_video — Delete from Bunny.net
// ─────────────────────────────────────────────────────────────────
if ($action === 'delete_video') {
    $bunnyVideoId = trim($input['bunny_video_id'] ?? '');
    if (!$bunnyVideoId) {
        echo json_encode(['error' => 'bunny_video_id is required']);
        exit;
    }

    enforceBunnyVideoScope($pdo,$bunnyVideoId,$adminId,$instructorId);
    $ch = curl_init("https://{$BUNNY_STREAM_HOST}/library/{$BUNNY_LIBRARY_ID}/videos/{$bunnyVideoId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'DELETE',
        CURLOPT_HTTPHEADER     => ['AccessKey: ' . $BUNNY_API_KEY],
    ]);
    curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo json_encode(['success' => ($code === 200), 'http_code' => $code]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action: ' . $action]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal Bunny API error.', 'message' => $e->getMessage()]);
}
