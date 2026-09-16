(function() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(() => {})
                .catch(() => {});
        });
    }

    // 2. Handle PWA BeforeInstallPrompt event
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show install button in navigation if not installed
        const navActions = document.querySelector('.nav-actions, .app-header-right');
        if (navActions && !document.getElementById('pwaInstallBtn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'pwaInstallBtn';
            installBtn.type = 'button';
            installBtn.className = 'btn btn-secondary btn-sm';
            installBtn.innerHTML = '📱 <span>Install App</span>';
            installBtn.style.fontSize = '0.78rem';
            installBtn.style.padding = '0.35rem 0.75rem';
            installBtn.onclick = () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            installBtn.remove();
                        }
                        deferredPrompt = null;
                    });
                }
            };
            navActions.prepend(installBtn);
        }
    });

    window.addEventListener('appinstalled', () => {
        const btn = document.getElementById('pwaInstallBtn');
        if (btn) btn.remove();
    });
})();
