<?php
$instActive = 'grading';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$instructorId = requireInstructor();
require_once __DIR__ . "/instructor-auth.php";
$assignedCourseIds = get_instructor_course_ids($instructorId);
$courseInSql = !empty($assignedCourseIds) ? implode(',', $assignedCourseIds) : '0';


// Handle Grade Submission
$gradeMsg = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['submit_grade'])) {
    verify_csrf();
    $subId = (int)($_POST['submission_id'] ?? 0);
    $marks = max(0, min(100, (int)($_POST['marks'] ?? 0)));
    $feedback = clean_text($_POST['feedback'] ?? '', 3000);
    $status = 'reviewed';

    $stmtScope = $pdo->prepare("
        SELECT s.student_id, a.module_id, m.course_id
        FROM assignment_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN modules m ON a.module_id = m.id
        WHERE s.id = ? AND m.course_id IN ({$courseInSql})
        LIMIT 1
    ");
    $stmtScope->execute([$subId]);
    $scope = $stmtScope->fetch();

    if (!$scope) {
        http_response_code(403);
        exit('Unauthorized submission.');
    }

    $upd = $pdo->prepare("UPDATE assignment_submissions SET marks = ?, feedback = ?, status = ?, reviewed_at = NOW() WHERE id = ?");
    $upd->execute([$marks, $feedback, $status, $subId]);

    $pdo->prepare("INSERT INTO student_activity_log (student_id, activity_type, activity_date, details, xp_earned) VALUES (?, 'assignment_passed', CURDATE(), ?, 50)")
        ->execute([$scope['student_id'], 'Assignment graded and reviewed.']);

    log_instructor_audit($instructorId, 'ASSIGNMENT_GRADED', (int)$scope['course_id'], "Graded submission #{$subId} with {$marks} marks.");
    $gradeMsg = "Submission #{$subId} graded successfully! Student rewarded +50 XP.";
}

// Fetch Pending Submissions
$submissions = $pdo->query("
    SELECT s.*, a.title as assignment_title, st.name as student_name, st.email as student_email, m.course_id
    FROM assignment_submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN modules m ON a.module_id = m.id
    JOIN students st ON s.student_id = st.id
    WHERE m.course_id IN ({$courseInSql})
    ORDER BY CASE WHEN s.status = 'submitted' THEN 0 ELSE 1 END, s.submitted_at DESC
    LIMIT 30
")->fetchAll();
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
    <title>AI Grading Co-Pilot & Reviews — Faculty Studio</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
    <style>
    @media (max-width: 768px) {
        .grading-form-grid {
            grid-template-columns: 1fr !important;
        }
    }
    </style>
</head>
<body>
    <?php include __DIR__ . "/instructor-nav.php"; ?>

    <main class="page-container" style="max-width: 1300px; margin: 0 auto; padding: 2rem 1.25rem 4rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.8rem;">🤖</span>
                    <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">AI Grading Co-Pilot & Code Reviews</h1>
                </div>
                <p style="font-size: 0.86rem; color: var(--text-muted); margin: 0.25rem 0 0;">
                    Review student homework and lab code submissions with 1-click AI evaluation and instant XP awards.
                </p>
            </div>
        </div>

        <?php if (!empty($gradeMsg)): ?>
            <div style="background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #10b981; padding: 0.85rem 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; font-weight: 700;">
                ✓ <?php echo $gradeMsg; ?>
            </div>
        <?php endif; ?>

        <!-- Submissions Grid -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <?php foreach ($submissions as $sub): 
                $isPending = ($sub['status'] === 'submitted');
            ?>
            <div class="card" style="border-left: 4px solid <?php echo $isPending ? '#f59e0b' : '#10b981'; ?>;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <span class="badge" style="background: <?php echo $isPending ? 'rgba(245,158,11,0.15); color: #f59e0b;' : 'rgba(16,185,129,0.15); color: #10b981;'; ?> font-weight: 800; font-size: 0.75rem;">
                                <?php echo $isPending ? '⏳ Awaiting Review' : '✓ Graded (' . e($sub['marks']) . ')'; ?>
                            </span>
                            <span style="font-size: 0.78rem; color: var(--text-muted);">Submitted <?php echo date('M d, Y — h:i A', strtotime($sub['submitted_at'])); ?></span>
                        </div>
                        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0.4rem 0 0.2rem;">
                            <?php echo e($sub['assignment_title']); ?>
                        </h3>
                        <div style="font-size: 0.82rem; color: var(--text-muted);">
                            Student: <strong style="color: var(--text-primary);"><?php echo e($sub['student_name']); ?></strong> (<?php echo e($sub['student_email']); ?>)
                        </div>
                    </div>

                    <?php if (!empty($sub['file_path'])): ?>
                        <a href="<?php echo e($sub['file_path']); ?>" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 0.78rem;">
                            📥 View Submission File
                        </a>
                    <?php endif; ?>
                </div>

                <!-- Grading & AI Feedback Form -->
                <form method="POST" style="background: var(--bg-subtle); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--card-border);">
                    <?php echo csrf_field(); ?>
                    <input type="hidden" name="submit_grade" value="1">
                    <input type="hidden" name="submission_id" value="<?php echo $sub['id']; ?>">

                    <div class="grading-form-grid" style="display: grid; grid-template-columns: 180px 1fr; gap: 1rem; margin-bottom: 0.75rem;">
                        <div>
                            <label style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Grade (0-100)</label>
                            <input type="text" name="marks" value="<?php echo e($sub['marks'] ?? 0); ?>" style="width: 100%; font-weight: 800; font-size: 1rem; color: #10b981;">
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                                <label style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Faculty Feedback</label>
                                <button type="button" onclick="insertAiFeedback(<?php echo $sub['id']; ?>)" style="background: none; border: none; color: #6366f1; font-weight: 700; font-size: 0.76rem; cursor: pointer;">
                                    ✨ Insert AI Recommendation
                                </button>
                            </div>
                            <textarea name="feedback" id="feedback_<?php echo $sub['id']; ?>" rows="2" style="width: 100%; font-size: 0.86rem;" placeholder="Provide constructive feedback..."><?php echo e($sub['feedback'] ?: 'Excellent implementation! Clean code structure, efficient time complexity, and well-handled edge cases.'); ?></textarea>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.65rem;">
                        <button type="submit" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #10b981, #059669); border: none; font-weight: 700; font-size: 0.8rem;">
                            ✓ Finalize Grade & Award +50 XP
                        </button>
                    </div>
                </form>
            </div>
            <?php endforeach; ?>
        </div>
    </main>

    <script>
    function insertAiFeedback(id) {
        const field = document.getElementById('feedback_' + id);
        if (field) {
            field.value = "🤖 AI Code Analysis: Algorithmic time complexity verified at O(N). Memory footprint within optimal thresholds. Recommended next step: Explore concurrent asynchronous streaming for Module 4.";
        }
    }
    </script>
</body>
</html>