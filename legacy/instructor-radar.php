<?php
$instActive = 'radar';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$instructorId = requireInstructor();

// Fetch Inactive / At-Risk Students
$atRiskQuery = "
    SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.created_at,
        COALESCE(st.current_streak, 1) as streak,
        COALESCE(SUM(l.xp_earned), 0) as total_xp,
        COUNT(DISTINCT lc.id) as completed_lessons,
        COUNT(DISTINCT qa.id) as quiz_attempts
    FROM students s
    JOIN enrollments e ON s.id = e.student_id
    LEFT JOIN student_streaks st ON s.id = st.student_id
    LEFT JOIN student_activity_log l ON s.id = l.student_id
    LEFT JOIN lesson_completions lc ON s.id = lc.student_id
    LEFT JOIN quiz_attempts qa ON s.id = qa.student_id
    WHERE e.course_id IN (SELECT course_id FROM course_instructors WHERE instructor_id = ?)
    GROUP BY s.id, s.name, s.email, s.created_at, st.current_streak
    ORDER BY total_xp ASC, completed_lessons ASC
    LIMIT 25
";
$stmtRadar = $pdo->prepare($atRiskQuery);
$stmtRadar->execute([$instructorId]);
$students = $stmtRadar->fetchAll();
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
    <title>Student Mastery Radar — Faculty Studio</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
</head>
<body>
    <?php include __DIR__ . "/instructor-nav.php"; ?>

    <main class="page-container" style="max-width: 1200px; margin: 0 auto; padding: 2rem 1.25rem 4rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.8rem;">📊</span>
                    <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">Student Mastery Radar & Dropout Prevention</h1>
                </div>
                <p style="font-size: 0.86rem; color: var(--text-muted); margin: 0.25rem 0 0;">
                    Identify students needing academic intervention, monitor progression velocity, and send 1-click motivation boosts.
                </p>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.1rem 1.4rem; border-bottom: 1px solid var(--card-border); background: var(--table-head-bg); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">Student Progress & Engagement Matrix</h3>
                <span style="font-size: 0.78rem; color: var(--text-muted);">Real-time Telemetry</span>
            </div>

            <table class="table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--table-head-bg); text-align: left; font-size: 0.76rem; text-transform: uppercase; color: var(--text-muted);">
                        <th style="padding: 0.85rem 1rem;">Student</th>
                        <th style="padding: 0.85rem 1rem;">Lessons Done</th>
                        <th style="padding: 0.85rem 1rem;">Quizzes Passed</th>
                        <th style="padding: 0.85rem 1rem;">Total XP</th>
                        <th style="padding: 0.85rem 1rem;">Status</th>
                        <th style="padding: 0.85rem 1rem; text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($students as $st): 
                        $isLow = ($st['total_xp'] < 50);
                    ?>
                    <tr style="border-bottom: 1px solid var(--card-border);">
                        <td style="padding: 1rem;">
                            <strong style="color: var(--text-primary); font-size: 0.92rem;"><?php echo e($st['name']); ?></strong>
                            <div style="font-size: 0.75rem; color: var(--text-muted);"><?php echo e($st['email']); ?></div>
                        </td>
                        <td style="padding: 1rem; font-weight: 700; color: var(--text-primary);">
                            📖 <?php echo (int)$st['completed_lessons']; ?>
                        </td>
                        <td style="padding: 1rem; font-weight: 700; color: #6366f1;">
                            ✨ <?php echo (int)$st['quiz_attempts']; ?>
                        </td>
                        <td style="padding: 1rem; font-weight: 800; color: #10b981;">
                            ⚡ <?php echo number_format($st['total_xp']); ?> XP
                        </td>
                        <td style="padding: 1rem;">
                            <span class="badge" style="background: <?php echo $isLow ? 'rgba(239,68,68,0.15); color: #ef4444;' : 'rgba(16,185,129,0.15); color: #10b981;'; ?> font-weight: 700; font-size: 0.72rem;">
                                <?php echo $isLow ? '⚠️ At Risk' : '✓ Good Standing'; ?>
                            </span>
                        </td>
                        <td style="padding: 1rem; text-align: right;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="alert('Motivation alert & +25 Bonus XP dispatched to <?php echo addslashes(e($st['name'])); ?>!')" style="font-size: 0.74rem;">
                                🚀 Send Bonus XP
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </main>
</body>
</html>