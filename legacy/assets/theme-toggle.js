(function() {
    // 1. Check stored theme or system preference
    const storedTheme = localStorage.getItem('ea_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', initialTheme);
    if (document.body) document.body.setAttribute('data-theme', initialTheme);

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (document.body) document.body.setAttribute('data-theme', theme);
        localStorage.setItem('ea_theme', theme);

        const btns = document.querySelectorAll('.ea-theme-toggle');
        btns.forEach(btn => {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        });
    }

    window.toggleTheme = function() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    };

    // Auto-inject Theme Toggle into header navigation on DOMContentLoaded
    window.addEventListener('DOMContentLoaded', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        
        // Find suitable header containers in public site and LMS portals
        const targets = document.querySelectorAll('.nav-actions, .header-right, .app-header-right, .drawer-footer');
        
        targets.forEach(target => {
            if (!target.querySelector('.ea-theme-toggle')) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ea-theme-toggle';
                btn.innerHTML = current === 'dark' ? '☀️' : '🌙';
                btn.title = current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
                btn.onclick = window.toggleTheme;
                target.appendChild(btn);
            }
        });
    });
})();
