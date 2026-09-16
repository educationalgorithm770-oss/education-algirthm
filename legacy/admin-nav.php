<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$adminActive = $adminActive ?? 'dashboard';
$adminEmail = $_SESSION['admin_email'] ?? 'admin@example.com';
$adminName = $_SESSION['admin_name'] ?? 'Super Admin';

$adminNavItems = [
    'dashboard'     => ['title' => 'Executive Dashboard', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>', 'url' => 'admin-dashboard.php', 'badge' => 0],
    'instructors'   => ['title' => 'Faculty & Instructors', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', 'url' => 'admin-instructors.php', 'badge' => '👨‍🏫 FACULTY'],
    'students'      => ['title' => 'Student 360° Directory', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', 'url' => 'admin-students.php', 'badge' => '⚡ 360°'],
    'scholarships'  => ['title' => 'Scholarship Holds', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>', 'url' => 'admin-scholarships', 'badge' => '🔒 HELD'],
    'enrollments'   => ['title' => 'Create Enrollment', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>', 'url' => 'admin-create-enrollment.php', 'badge' => '➕ NEW'],
    'content'       => ['title' => 'Curriculum Builder', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', 'url' => 'admin-content.php', 'badge' => 0],
    'ai-studio'     => ['title' => 'AI Curriculum Studio', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', 'url' => 'admin-ai-studio.php', 'badge' => '✨ AI'],
    'finance'       => ['title' => 'Financials & Coupons', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>', 'url' => 'admin-finance.php', 'badge' => 0],
    'live-classes'  => ['title' => 'Live Mentorship Classes', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>', 'url' => 'admin-live-classes.php', 'badge' => '🎥 LIVE'],
    'quiz'          => ['title' => 'Quiz Assessments', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', 'url' => 'admin-quiz.php', 'badge' => 0],
    'assignments'   => ['title' => 'Assignment Reviews', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', 'url' => 'admin-assignments.php', 'badge' => 0],
    'support'       => ['title' => 'Support Helpdesk', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', 'url' => 'admin-support.php', 'badge' => 0],
    'notifications' => ['title' => 'Broadcast Alerts', 'icon' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>', 'url' => 'admin-notifications.php', 'badge' => 0],
];
?>

<style>
/* Enterprise Admin Top Navigation & Right Slide-Out Drawer */
.admin-navbar {
    background: #0f172a;
    border-bottom: 1px solid #1e293b;
    position: sticky;
    top: 0;
    z-index: 999;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.35);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin-bottom: 1.5rem;
}
.admin-nav-inner {
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 1.25rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.admin-nav-brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    text-decoration: none;
    flex-shrink: 0;
}
.admin-nav-brand .brand-badge {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #ffffff;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 1rem;
    box-shadow: 0 0 14px rgba(99, 102, 241, 0.45);
}
.admin-nav-brand .brand-title {
    color: #ffffff;
    font-weight: 800;
    font-size: 1.05rem;
    letter-spacing: -0.02em;
}
.admin-nav-brand .brand-tag {
    font-size: 0.68rem;
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-weight: 700;
    border: 1px solid rgba(99, 102, 241, 0.3);
}

/* Right Nav Controls */
.admin-nav-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    white-space: nowrap;
}
.btn-student-view {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #f8fafc;
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s ease;
}
.btn-student-view:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
}

/* 3-Lines (= / ☰ Menu) Toggle Button */
.btn-admin-drawer-toggle {
    height: 38px;
    padding: 0 0.85rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.84rem;
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
    box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
    transition: all 0.2s ease;
}

@media (max-width: 640px) {
    .btn-student-view span {
        display: none !important;
    }
    .btn-student-view {
        padding: 0.45rem 0.55rem !important;
    }
    .admin-nav-brand .brand-tag {
        display: none !important;
    }
}
.btn-admin-drawer-toggle:hover {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.5);
    transform: translateY(-1px);
}

/* Right-Side Slide-Out Backdrop */
.admin-drawer-backdrop {
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
.admin-drawer-backdrop.active {
    opacity: 1;
    visibility: visible;
}

/* Right-Side Slide-Out Drawer */
.admin-right-drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 330px;
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
.admin-right-drawer.open {
    transform: translateX(0);
}

/* Drawer Header */
.admin-drawer-header {
    padding: 1.15rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.03);
    flex-shrink: 0;
}
.admin-drawer-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.admin-drawer-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
}
.admin-drawer-name {
    font-size: 0.94rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
}
.admin-drawer-role {
    font-size: 0.72rem;
    color: #94a3b8;
    margin-top: 0.1rem;
}
.admin-drawer-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #cbd5e1;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}
.admin-drawer-close:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-color: #ef4444;
}

/* Drawer Navigation Links */
.admin-drawer-nav {
    padding: 0.85rem 0.75rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-grow: 1;
}
.admin-drawer-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.85rem;
    border-radius: 10px;
    color: #cbd5e1;
    text-decoration: none;
    font-size: 0.86rem;
    font-weight: 600;
    transition: all 0.2s ease;
}
.admin-drawer-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    transform: translateX(3px);
}
.admin-drawer-item.active {
    background: #6366f1;
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.admin-drawer-item-left {
    display: flex;
    align-items: center;
    gap: 0.7rem;
}
.admin-drawer-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
}

/* Drawer Footer */
.admin-drawer-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
}
.admin-drawer-signout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.65rem;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    font-size: 0.84rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
}
.admin-drawer-signout:hover {
    background: #ef4444;
    color: #ffffff;
}
</style>

<!-- Top Navbar Header -->
<header class="admin-navbar">
    <!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y45hrispgg");
</script>
    <div class="admin-nav-inner">
        <!-- Brand Logo -->
        <a href="admin-dashboard.php" class="admin-nav-brand">
            <div class="brand-badge">⚡</div>
            <div>
                <span class="brand-title">Admin 4.0</span>
                <span class="brand-tag">CONTROL</span>
            </div>
        </a>

        <!-- Right Action Controls -->
        <div class="admin-nav-right">
            <a href="dashboard.php" target="_blank" rel="noopener noreferrer" class="btn-student-view" title="Open Student Portal in new tab">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Student View</span>
            </a>

            <!-- 3-Lines (= / ☰ Menu) Toggle Button -->
            <button type="button" class="btn-admin-drawer-toggle" onclick="toggleAdminDrawer(true)" aria-label="Open Admin Menu" title="Open Menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                <span>Menu</span>
            </button>
        </div>
    </div>
</header>

<!-- Right-Side Slide-Out Backdrop -->
<div class="admin-drawer-backdrop" id="adminDrawerBackdrop" onclick="toggleAdminDrawer(false)"></div>

<!-- Right-Side Slide-Out Drawer -->
<aside class="admin-right-drawer" id="adminRightDrawer" aria-label="Admin Navigation Drawer">
    <!-- Header -->
    <div class="admin-drawer-header">
        <div class="admin-drawer-user">
            <div class="admin-drawer-avatar">⚡</div>
            <div>
                <div class="admin-drawer-name"><?php echo htmlspecialchars($adminName, ENT_QUOTES, 'UTF-8'); ?></div>
                <div class="admin-drawer-role">System Control • Super Admin</div>
            </div>
        </div>
        <button type="button" class="admin-drawer-close" onclick="toggleAdminDrawer(false)" aria-label="Close Menu">✕</button>
    </div>

    <!-- Navigation List -->
    <nav class="admin-drawer-nav">
        <?php foreach ($adminNavItems as $key => $item): 
            $isActive = ($adminActive === $key);
        ?>
            <a href="<?php echo $item['url']; ?>" class="admin-drawer-item <?php echo $isActive ? 'active' : ''; ?>">
                <div class="admin-drawer-item-left">
                    <?php echo $item['icon']; ?>
                    <span><?php echo htmlspecialchars($item['title'], ENT_QUOTES, 'UTF-8'); ?></span>
                </div>
                <?php if (!empty($item['badge'])): ?>
                    <span class="admin-drawer-badge"><?php echo $item['badge']; ?></span>
                <?php endif; ?>
            </a>
        <?php endforeach; ?>
    </nav>

    <!-- Footer -->
    <div class="admin-drawer-footer">
        <a href="dashboard.php" target="_blank" rel="noopener noreferrer" class="btn-student-view" style="justify-content: center; width: 100%; box-sizing: border-box;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Preview Student Portal</span>
        </a>
        <a href="logout.php" class="admin-drawer-signout">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
        </a>
    </div>
</aside>

<script>
function toggleAdminDrawer(open) {
    const drawer = document.getElementById('adminRightDrawer');
    const backdrop = document.getElementById('adminDrawerBackdrop');
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

// Close drawer on ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        toggleAdminDrawer(false);
    }
});
</script>