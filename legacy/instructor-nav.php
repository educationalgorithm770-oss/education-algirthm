<?php
/**
 * instructor-nav.php — Minimal Topbar (Faculty Name Only) + Right Slide Drawer
 */
require_once __DIR__ . '/instructor-auth.php';
require_instructor_auth();

$facultyActive = $facultyActive ?? 'dashboard';
$instId = (int)$_SESSION['instructor_id'];
$profile = get_instructor_profile($instId);
$assignedCourses = get_instructor_assigned_courses($instId);

$facultyNavItems = [
    'dashboard'     => ['title' => 'Executive Overview', 'icon' => '📊', 'url' => 'instructor-dashboard.php'],
    'profile'       => ['title' => 'Faculty Profile & Settings', 'icon' => '👤', 'url' => 'instructor-profile.php'],
    'content'       => ['title' => 'Curriculum & 3-Mode Video Studio', 'icon' => '📹', 'url' => 'instructor-content.php'],
    'quiz'          => ['title' => 'AI Quiz & Cohort Gradebook', 'icon' => '🤖', 'url' => 'instructor-quizzes.php'],
    'assignments'   => ['title' => 'Assignment Code Reviews', 'icon' => '📝', 'url' => 'instructor-assignments.php'],
    'live-classes'  => ['title' => 'Live Mentorship Masterclasses', 'icon' => '🔴', 'url' => 'instructor-live.php'],
    'doubts'        => ['title' => '1-on-1 Student Doubts Desk', 'icon' => '💬', 'url' => 'instructor-doubts.php'],
    'announcements' => ['title' => 'Track Cohort Broadcasts', 'icon' => '📢', 'url' => 'instructor-announcements.php'],
];
?>

<style>
/* Modern Premium Dark Topbar */
.faculty-topbar {
    background: #0b0f19;
    border-bottom: 1px solid #1e293b;
    position: sticky;
    top: 0;
    z-index: 999;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    margin-bottom: 2rem;
}
.faculty-topbar-inner {
    max-width: 1550px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.faculty-brand-minimal {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
}
.faculty-avatar-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    color: #ffffff;
}
.faculty-name-title {
    font-size: 0.92rem;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: -0.01em;
}

/* Right Side Trigger Button */
.btn-right-slider {
    background: #1e293b;
    border: 1.5px solid #334155;
    color: #ffffff;
    padding: 0.42rem 0.85rem;
    border-radius: 8px;
    font-size: 0.80rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.btn-right-slider:hover {
    background: #334155;
    border-color: #6366f1;
    transform: translateY(-1px);
}

/* Right Slide Drawer */
.faculty-right-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 10000;
}
.faculty-right-backdrop.active { display: block; }
.faculty-right-drawer {
    position: fixed;
    top: 0;
    right: -380px;
    width: 360px;
    height: 100vh;
    background: #0f141f;
    border-left: 1px solid #1e293b;
    z-index: 10001;
    display: flex;
    flex-direction: column;
    padding: 1.75rem;
    box-shadow: -20px 0 50px rgba(0, 0, 0, 0.8);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.faculty-right-drawer.active { transform: translateX(-380px); }
</style>

<header class="faculty-topbar">
    <!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y45hrispgg");
</script>
    <div class="faculty-topbar-inner">
        <!-- LEFT: FACULTY NAME ONLY -->
        <a href="instructor-dashboard.php" class="faculty-brand-minimal">
            <div class="faculty-avatar-icon">👨‍🏫</div>
            <div class="faculty-name-title"><?= htmlspecialchars($profile['name']) ?></div>
        </a>

        <!-- RIGHT: SLIDER TRIGGER BUTTON -->
        <button type="button" class="btn-right-slider" onclick="toggleFacultyRightSlider()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <span>Menu</span>
        </button>
    </div>
</header>

<!-- RIGHT-SIDE SLIDE-OUT DRAWER -->
<div class="faculty-right-backdrop" id="facultyRightBackdrop" onclick="toggleFacultyRightSlider()"></div>
<aside class="faculty-right-drawer" id="facultyRightDrawer">
    <!-- HEADER -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.25rem; border-bottom: 1px solid #1e293b; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; color: #ffffff;">👨‍🏫</div>
            <div>
                <h4 style="font-size: 0.98rem; font-weight: 800; color: #ffffff;">Faculty Portal</h4>
                <span style="font-size: 0.68rem; color: #34d399; font-weight: 700;">● ZERO-TRUST ACTIVE</span>
            </div>
        </div>
        <button type="button" onclick="toggleFacultyRightSlider()" style="background: none; border: none; color: #94a3b8; font-size: 1.4rem; cursor: pointer; padding: 0.2rem;">✕</button>
    </div>

    <!-- PROFILE CHIP -->
    <div style="background: #141b2b; border: 1px solid #1e293b; border-radius: 12px; padding: 0.95rem; margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.88rem; font-weight: 800; color: #ffffff;"><?= htmlspecialchars($profile['name']) ?></div>
            <a href="instructor-profile.php" style="font-size: 0.72rem; color: #818cf8; font-weight: 700; text-decoration: none;">Edit Profile ➔</a>
        </div>
        <div style="font-size: 0.72rem; color: #94a3b8; margin: 0.15rem 0 0.4rem;"><?= htmlspecialchars($profile['email']) ?></div>
        <?php foreach ($assignedCourses as $ac): ?>
            <div style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #c7d2fe; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                🎯 Track #<?= $ac['id'] ?>: <?= htmlspecialchars($ac['title']) ?>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- ALL MODULES LIST -->
    <div style="font-size: 0.72rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em;">Workspaces & Modules</div>
    <nav style="display: flex; flex-direction: column; gap: 0.35rem; flex: 1; overflow-y: auto; padding-right: 0.25rem;">
        <?php foreach ($facultyNavItems as $key => $item): ?>
            <a href="<?= $item['url'] ?>" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0.9rem; color: <?= ($facultyActive === $key) ? '#c7d2fe' : '#94a3b8' ?>; background: <?= ($facultyActive === $key) ? 'rgba(99,102,241,0.15)' : 'transparent' ?>; text-decoration: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; border: 1px solid <?= ($facultyActive === $key) ? 'rgba(99,102,241,0.35)' : 'transparent' ?>; transition: all 0.15s;">
                <span style="font-size: 1.1rem;"><?= $item['icon'] ?></span>
                <span><?= $item['title'] ?></span>
            </a>
        <?php endforeach; ?>
    </nav>

    <!-- SIGN OUT -->
    <div style="padding-top: 1.25rem; border-top: 1px solid #1e293b;">
        <a href="instructor-logout.php" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #f43f5e; padding: 0.75rem; border-radius: 10px; font-weight: 700; font-size: 0.88rem; text-decoration: none;">
            🚪 Secure Sign Out
        </a>
    </div>
</aside>

<script>
function toggleFacultyRightSlider() {
    var drawer = document.getElementById('facultyRightDrawer');
    var backdrop = document.getElementById('facultyRightBackdrop');
    if (drawer && backdrop) {
        drawer.classList.toggle('active');
        backdrop.classList.toggle('active');
    }
}
</script>