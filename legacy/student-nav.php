<?php
// Student Navigation Component with Right-Side Slide-Out Drawer
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$studentName = $_SESSION["student_name"] ?? 'Student';
$studentId = $_SESSION["student_id"] ?? 0;

// Count unread notifications
$unreadNotifs = 0;
if ($studentId) {
    try {
        $stmtCount = $pdo->prepare("
            SELECT COUNT(*) 
            FROM notifications n
            LEFT JOIN student_notifications sn ON n.id = sn.notification_id AND sn.student_id = ?
            WHERE sn.is_read IS NULL OR sn.is_read = 0
        ");
        $stmtCount->execute([$studentId]);
        $unreadNotifs = (int)$stmtCount->fetchColumn();
    } catch (Exception $e) {
        $unreadNotifs = 0;
    }
}

$isGuestSession = (empty($_SESSION['student_id']) || !empty($_SESSION['guest_code_arena']));

if ($isGuestSession) {
    $studentNavItems = [
        'code-arena' => ['title' => 'Code Arena & Studio', 'icon' => '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', 'url' => 'code-arena.php?from=home', 'badge' => '✓ UNLOCKED', 'badge_class' => 'style="background:rgba(16,185,129,0.2);color:#34d399;border:1px solid #10b981;"'],
        'dashboard' => ['title' => 'Curriculum', 'icon' => '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>', 'url' => 'enroll.php?feature=curriculum&source=code_arena', 'badge' => '🔒 UNLOCK', 'locked' => true],
        'doubts' => ['title' => '1-on-1 Doubt Desk', 'icon' => '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 'url' => 'enroll.php?feature=doubts&source=code_arena', 'badge' => '🔒 PRO', 'locked' => true],
        'flashcards' => ['title' => 'Study Flashcards', 'icon' => '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12.01" y2="21"/>', 'url' => 'enroll.php?feature=flashcards&source=code_arena', 'badge' => '🔒 UNLOCK', 'locked' => true],
        'certificates' => ['title' => 'Verified Certificates', 'icon' => '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>', 'url' => 'enroll.php?feature=certificates&source=code_arena', 'badge' => '🔒 PRO', 'locked' => true],
        'profile' => ['title' => 'Profile Settings', 'icon' => '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', 'url' => 'enroll.php?feature=profile&source=code_arena', 'badge' => '🔒 UNLOCK', 'locked' => true],
        'support' => ['title' => 'Helpdesk', 'icon' => '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', 'url' => 'enroll.php?feature=support&source=code_arena', 'badge' => '🔒 UNLOCK', 'locked' => true],
    ];
} else {
    $studentNavItems = [
        'dashboard' => ['title' => 'Curriculum', 'icon' => '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>', 'url' => 'dashboard', 'badge' => 0],
        'code-arena' => ['title' => 'Code Arena & Studio', 'icon' => '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>', 'url' => 'code-arena', 'badge' => '⚡ PRO'],
        'doubts' => ['title' => '1-on-1 Doubt Desk', 'icon' => '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 'url' => 'student-doubts.php', 'badge' => '💬 LIVE'],
        'flashcards' => ['title' => 'Study Flashcards', 'icon' => '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12.01" y2="21"/>', 'url' => 'flashcards', 'badge' => '🧠 NEW'],
        'certificates' => ['title' => 'Verified Certificates', 'icon' => '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>', 'url' => 'certificates', 'badge' => 0],
        'notifications' => ['title' => 'Updates', 'icon' => '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>', 'url' => 'notifications', 'badge' => $unreadNotifs],
        'profile' => ['title' => 'Profile Settings', 'icon' => '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', 'url' => 'profile', 'badge' => 0],
        'support' => ['title' => 'Helpdesk', 'icon' => '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>', 'url' => 'support', 'badge' => 0],
    ];
}
?>

<style>
/* Self-contained Right-Side Slide-Out Drawer Styles */
.drawer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 10, 25, 0.75);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 9998;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.28s ease, visibility 0.28s ease;
}
.drawer-backdrop.active {
    opacity: 1;
    visibility: visible;
}
.right-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    max-width: 88vw;
    height: 100%;
    height: 100dvh;
    max-height: 100dvh;
    background: #0d0d20;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: -12px 0 40px rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
.right-drawer.open {
    transform: translateX(0);
}
.drawer-header {
    padding: 1.15rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.03);
    flex-shrink: 0;
}
.drawer-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.drawer-user-name {
    font-size: 0.92rem;
    font-weight: 700;
    color: #ffffff;
}
.drawer-user-role {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.5);
}
.drawer-close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}
.drawer-close-btn:hover {
    background: #ef4444;
    color: #fff;
    transform: rotate(90deg);
}
.drawer-nav {
    flex: 1;
    padding: 1.25rem 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}
.drawer-section-title {
    font-family: monospace;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.08em;
    padding: 0.4rem 0.5rem 0.2rem;
    text-transform: uppercase;
}
.drawer-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}
.drawer-link:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
}
.drawer-link.active {
    color: #ffffff;
    background: rgba(108, 92, 231, 0.35);
    border-color: rgba(108, 92, 231, 0.7);
    box-shadow: 0 4px 16px rgba(108, 92, 231, 0.25);
    font-weight: 600;
}
.drawer-link .nav-badge {
    margin-left: auto;
}
.drawer-footer {
    padding: 1rem 1rem;
    padding-bottom: max(1.15rem, env(safe-area-inset-bottom));
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.3);
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-shrink: 0;
}
.snav-container {
    width: 100%;
    max-width: 1300px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 1.25rem;
    box-sizing: border-box;
}
.snav-brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-decoration: none;
    color: #ffffff;
    font-weight: 800;
    font-size: 1.08rem;
    flex-shrink: 0;
    white-space: nowrap;
}
.snav-brand span {
    white-space: nowrap;
    font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
}
.snav-right {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
    margin-left: auto;
}
.btn-spotlight-search {
    height: 36px;
    padding: 0 0.65rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.8rem;
    font-weight: 500;
    flex-shrink: 0;
    transition: all 0.2s ease;
}
.btn-spotlight-search:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.25);
}
.spotlight-kbd {
    font-family: monospace;
    font-size: 0.65rem;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 0.1rem 0.3rem;
    color: rgba(255, 255, 255, 0.7);
}
.snav-notif-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    position: relative;
    flex-shrink: 0;
    transition: all 0.2s ease;
}
.snav-notif-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}
.snav-notif-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ff6b4a;
    box-shadow: 0 0 6px #ff6b4a;
}
.btn-drawer-toggle {
    height: 36px;
    padding: 0 0.75rem;
    border-radius: 8px;
    background: #23224b;
    border: 1px solid #4f46e5;
    color: #ffffff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    font-weight: 700;
    flex-shrink: 0;
    transition: all 0.2s ease;
}
.btn-drawer-toggle:hover {
    background: #3730a3;
    border-color: #6366f1;
    box-shadow: 0 0 12px rgba(79, 70, 229, 0.5);
    transform: translateY(-1px);
}
@media (max-width: 640px) {
    .snav-container {
        padding: 0.55rem 0.65rem;
    }
    .brand-badge {
        display: none !important;
    }
    .snav-brand {
        font-size: 0.95rem;
        gap: 0.45rem;
    }
    .brand-logo-svg {
        width: 28px;
        height: 28px;
    }
    .spotlight-kbd, .spotlight-btn-text {
        display: none !important;
    }
    .btn-spotlight-search {
        padding: 0 0.5rem;
        width: 34px;
        height: 34px;
        justify-content: center;
    }
    .snav-notif-btn {
        width: 34px;
        height: 34px;
    }
    .btn-drawer-toggle {
        padding: 0 0.55rem;
        height: 34px;
        font-size: 0.78rem;
        gap: 0.25rem;
    }
}
@media (max-width: 420px) {
    .snav-brand span {
        font-size: 0.88rem;
    }
    .snav-right {
        gap: 0.25rem;
    }
}
</style>

<link rel="stylesheet" href="assets/command-palette.css?v=2.0">

<!-- Top Sticky Navbar -->
<nav class="student-navbar" id="studentNavbar">
    <div class="snav-container">
        <a href="<?php echo $isGuestSession ? 'enroll.php?feature=curriculum&source=code_arena' : 'dashboard'; ?>" class="snav-brand">
            <svg class="brand-logo-svg" width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6C5CE7" />
                  <stop offset="100%" stop-color="#FF6B4A" />
                </linearGradient>
              </defs>
              <path d="M16 4L28 10L16 16L4 10L16 4Z" fill="url(#capGrad)" />
              <path d="M7 13.5V19.5C7 22.5 11 25 16 25C21 25 25 22.5 25 19.5V13.5" stroke="#6C5CE7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M16 10L24 14.5V20.5" stroke="#FFD23F" stroke-width="2" stroke-linecap="round" />
              <circle class="logo-node-pulse" cx="24" cy="21.5" r="3.5" fill="#FFD23F" />
              <circle class="logo-node-pulse" cx="16" cy="10" r="2.5" fill="#00D9C0" />
            </svg>
            <span>Education Algorithm</span>
            <span class="brand-badge">STUDENT</span>
        </a>

        <div class="snav-right">

            <!-- Notification Updates Link -->
            <a href="<?php echo $isGuestSession ? 'enroll.php?feature=notifications&source=code_arena' : 'notifications'; ?>" class="snav-notif-btn" title="Updates">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <?php if ($unreadNotifs > 0): ?>
                    <span class="snav-notif-dot"></span>
                <?php endif; ?>
            </a>

            <!-- 3-Lines Right Toggle Button -->
            <button type="button" class="btn-drawer-toggle" id="studentDrawerToggleBtn" onclick="toggleStudentDrawer(true)" aria-label="Open Navigation Menu" title="Open Menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                <span>Menu</span>
            </button>
        </div>
    </div>
</nav>

<!-- Right-Side Slide-Out Backdrop -->
<div class="drawer-backdrop" id="studentDrawerBackdrop" onclick="toggleStudentDrawer(false)"></div>

<!-- Right-Side Slide-Out Drawer Component -->
<aside class="right-drawer" id="studentRightDrawer" aria-label="Student Navigation Drawer">
    <div class="drawer-header">
        <div class="drawer-user-info">
            <div class="user-avatar" style="width: 34px; height: 34px; font-size: 0.95rem; background: var(--purple); color: #fff; font-weight: 800;"><?php echo strtoupper(substr($studentName, 0, 1)); ?></div>
            <div>
                <div class="drawer-user-name"><?php echo e($studentName); ?></div>
                <div class="drawer-user-role"><?php echo $isGuestSession ? 'Guest Preview' : 'Enrolled Student'; ?></div>
            </div>
        </div>
        <button type="button" class="drawer-close-btn" onclick="toggleStudentDrawer(false)" aria-label="Close Menu">✕</button>
    </div>

    <!-- Quick Spotlight Search inside Drawer -->
    <div style="padding: 0.85rem 1.25rem 0.25rem;">
        <button type="button" onclick="toggleStudentDrawer(false); openCommandPalette();" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; border-radius: 10px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: rgba(255, 255, 255, 0.85); cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.2s;">
            <div style="display: flex; align-items: center; gap: 0.55rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>Spotlight Search</span>
            </div>
            <kbd style="font-family: monospace; font-size: 0.65rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 0.1rem 0.35rem; color: #cbd5e1;">⌘K</kbd>
        </button>
    </div>

    <nav class="drawer-nav-list" aria-label="Drawer Navigation Links" style="margin-top: 0.35rem;">
        <?php foreach ($studentNavItems as $key => $item): 
            $isActive = ($activePage === $key);
        ?>
        <a href="<?php echo $item['url']; ?>" class="drawer-link <?php echo $isActive ? 'active' : ''; ?>">
            <div class="drawer-link-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><?php echo $item['icon']; ?></svg>
            </div>
            <span class="drawer-link-label"><?php echo $item['title']; ?></span>
            <?php if (!empty($item['badge'])): ?>
                <span class="drawer-badge" <?php echo !empty($item['badge_class']) ? $item['badge_class'] : ''; ?>><?php echo $item['badge']; ?></span>
            <?php endif; ?>
        </a>
        <?php endforeach; ?>
    </nav>

    <?php require_once __DIR__ . '/includes/feature-unlock-modal.php'; ?>

    <!-- Theme Selection Row inside Drawer -->
    <div style="padding: 0.85rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: rgba(255,255,255,0.7);">
        <span>Appearance / Theme</span>
        <button type="button" onclick="toggleLmsTheme()" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
            <span id="drawerThemeIcon">🌙</span>
            <span id="drawerThemeText">Dark Mode</span>
        </button>
    </div>

    <div class="drawer-footer">
        <form method="POST" action="logout" style="margin: 0; width: 100%;">
            <?php echo csrf_field(); ?>
            <button type="submit" class="btn-logout" style="width: 100%; justify-content: center; padding: 0.6rem 1rem;" title="Sign Out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Sign Out</span>
            </button>
        </form>
    </div>
</aside>

<script src="assets/command-palette.js?v=2.0" defer></script>
<script>
// Theme Management Engine
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) document.body.setAttribute('data-theme', theme);
    localStorage.setItem('ea_theme', theme);
    localStorage.setItem('lms_theme', theme);
    const themeIcon = document.getElementById('themeIcon');
    const drawerThemeIcon = document.getElementById('drawerThemeIcon');
    const drawerThemeText = document.getElementById('drawerThemeText');
    if (theme === 'dark') {
        if (themeIcon) themeIcon.textContent = '☀️';
        if (drawerThemeIcon) drawerThemeIcon.textContent = '☀️';
        if (drawerThemeText) drawerThemeText.textContent = 'Light Mode';
    } else {
        if (themeIcon) themeIcon.textContent = '🌙';
        if (drawerThemeIcon) drawerThemeIcon.textContent = '🌙';
        if (drawerThemeText) drawerThemeText.textContent = 'Dark Mode';
    }
}

function toggleLmsTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    if (window.showToast) {
        window.showToast('info', next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled', 1500);
    }
}

// Initialize theme immediately on page load
(function() {
    const saved = localStorage.getItem('ea_theme') || localStorage.getItem('lms_theme') || 'light';
    applyTheme(saved);
})();

function toggleStudentDrawer(open) {
    const drawer = document.getElementById('studentRightDrawer');
    const backdrop = document.getElementById('studentDrawerBackdrop');
    if (!drawer || !backdrop) return;
    if (open) {
        drawer.classList.add('open');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('open');
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        toggleStudentDrawer(false);
    }
});
</script>
