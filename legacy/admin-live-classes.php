<?php
$adminActive = 'live-classes';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();

// Handle New Class Scheduling
$msg = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['schedule_class'])) {
    verify_csrf();
    $title = clean_text($_POST['title'] ?? '', 255);
    $inst  = clean_text($_POST['instructor_name'] ?? 'Prof. Alan Vance', 150);
    $link  = clean_text($_POST['meet_link'] ?? '', 500);
    $time  = clean_text($_POST['scheduled_at'] ?? '', 50);
    $dur   = (int)($_POST['duration_minutes'] ?? 60);

    if (!empty($title) && !empty($link) && !empty($time)) {
        $ins = $pdo->prepare("INSERT INTO live_classes (title, instructor_name, meet_link, scheduled_at, duration_minutes) VALUES (?, ?, ?, ?, ?)");
        $ins->execute([$title, $inst, $link, $time, $dur]);
        $msg = "Live mentorship session scheduled successfully!";
    }
}

$classesList = $pdo->query("SELECT * FROM live_classes ORDER BY scheduled_at ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y45hrispgg");
</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Mentorship Scheduler — Admin Control Center</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>
        
        <main class="app-container" style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
            <header class="admin-header">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">🎥 Live Mentorship & Class Scheduler</h1>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0;">Schedule weekend interactive workshops, generate Google Meet/Zoom links, and sync calendar reminders.</p>
                </div>
            </header>

            <?php if (!empty($msg)): ?>
                <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-weight: 600;">
                    ✓ <?php echo htmlspecialchars($msg); ?>
                </div>
            <?php endif; ?>

            <div style="display: grid; grid-template-columns: 360px 1fr; gap: 1.5rem;">
                <!-- Schedule Form -->
                <div class="card">
                    <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem;">📅 Schedule Live Workshop</h3>
                    <form method="POST">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="schedule_class" value="1">
                        
                        <div class="form-group">
                            <label>Session Title</label>
                            <input type="text" name="title" placeholder="e.g. Weekend Code-Along: High-Scale Redis Caching" required>
                        </div>

                        <div class="form-group">
                            <label>Lead Instructor / Speaker</label>
                            <input type="text" name="instructor_name" value="Dr. Sarah Mitchell" required>
                        </div>

                        <div class="form-group">
                            <label>Google Meet / Zoom URL</label>
                            <input type="url" name="meet_link" placeholder="https://meet.google.com/..." required>
                        </div>

                        <div class="form-group">
                            <label>Date & Start Time</label>
                            <input type="datetime-local" name="scheduled_at" required>
                        </div>

                        <div class="form-group">
                            <label>Duration (Minutes)</label>
                            <input type="number" name="duration_minutes" value="90" min="15">
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
                            Publish Session
                        </button>
                    </form>
                </div>

                <!-- Upcoming Sessions List -->
                <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px;">
                    <div style="padding: 1.1rem 1.4rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; font-weight: 800; font-size: 0.95rem; color: #0f172a;">
                        Scheduled Mentorship Sessions
                    </div>
                    <table class="table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; font-size: 0.76rem; text-transform: uppercase; color: #64748b;">
                                <th style="padding: 0.85rem 1rem;">Session Details</th>
                                <th style="padding: 0.85rem 1rem;">Instructor</th>
                                <th style="padding: 0.85rem 1rem;">Schedule</th>
                                <th style="padding: 0.85rem 1rem; text-align: right;">Meet Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($classesList as $cl): ?>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 1rem;">
                                    <strong style="color: #0f172a; font-size: 0.92rem;"><?php echo e($cl['title']); ?></strong>
                                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 0.15rem;"><?php echo $cl['duration_minutes']; ?> Minutes Interactive Workshop</div>
                                </td>
                                <td style="padding: 1rem; font-size: 0.85rem; color: #4338ca; font-weight: 700;">
                                    <?php echo e($cl['instructor_name']); ?>
                                </td>
                                <td style="padding: 1rem; font-size: 0.84rem; color: #64748b;">
                                    <?php echo date('D, M d, Y — h:i A', strtotime($cl['scheduled_at'])); ?>
                                </td>
                                <td style="padding: 1rem; text-align: right;">
                                    <a href="<?php echo e($cl['meet_link']); ?>" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="font-size: 0.74rem;">
                                        🔗 Join Stream
                                    </a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</body>
</html>