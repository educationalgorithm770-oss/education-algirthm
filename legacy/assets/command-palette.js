/**
 * Universal Spotlight Command Palette & Floating Toast Notification Engine
 */

(function () {
    // 1. Create Toast Container
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Global Toast Function
    window.showToast = function (type, message, duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✓';
        if (type === 'warning') icon = '⚠️';
        if (type === 'danger' || type === 'error') icon = '✕';

        toast.innerHTML = `<span style="font-weight: 700;">${icon}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    };

    // 2. Create Command Palette Modal DOM
    let paletteBackdrop = document.querySelector('.cmd-palette-backdrop');
    if (!paletteBackdrop) {
        paletteBackdrop = document.createElement('div');
        paletteBackdrop.className = 'cmd-palette-backdrop';
        paletteBackdrop.innerHTML = `
            <div class="cmd-palette-modal" role="dialog" aria-modal="true">
                <div class="cmd-palette-input-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" class="cmd-palette-input" placeholder="Search lessons, quizzes, notes, commands... (Press ESC to close)" autocomplete="off">
                    <span class="cmd-palette-esc-badge">ESC</span>
                </div>
                <div class="cmd-palette-results"></div>
                <div class="cmd-palette-footer">
                    <div class="cmd-palette-keys">
                        <span class="cmd-palette-key-hint"><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
                        <span class="cmd-palette-key-hint"><kbd>↵</kbd> Open</span>
                    </div>
                    <span>Education Algorithm Spotlight</span>
                </div>
            </div>
        `;
        document.body.appendChild(paletteBackdrop);
    }

    const input = paletteBackdrop.querySelector('.cmd-palette-input');
    const resultsContainer = paletteBackdrop.querySelector('.cmd-palette-results');
    let selectedIndex = 0;
    let currentResults = [];
    let debounceTimer = null;

    function openPalette() {
        paletteBackdrop.classList.add('active');
        input.value = '';
        selectedIndex = 0;
        fetchResults('');
        setTimeout(() => input.focus(), 50);
    }

    function closePalette() {
        paletteBackdrop.classList.remove('active');
        input.blur();
    }

    window.openCommandPalette = openPalette;
    window.closeCommandPalette = closePalette;

    // Keyboard Shortcuts (Cmd+K / Ctrl+K / Escape)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (paletteBackdrop.classList.contains('active')) {
                closePalette();
            } else {
                openPalette();
            }
        } else if (e.key === 'Escape' && paletteBackdrop.classList.contains('active')) {
            closePalette();
        }
    });

    paletteBackdrop.addEventListener('click', (e) => {
        if (e.target === paletteBackdrop) {
            closePalette();
        }
    });

    // Fetch and render results from api-search.php
    function fetchResults(query) {
        resultsContainer.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.85rem;">Searching...</div>';
        
        fetch('api-search?q=' + encodeURIComponent(query))
            .then(res => res.json())
            .then(data => {
                currentResults = data.results || [];
                renderResults();
            })
            .catch(() => {
                resultsContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">No results found.</div>';
            });
    }

    function renderResults() {
        if (!currentResults.length) {
            resultsContainer.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.85rem;">No matching lectures or resources found.</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        currentResults.forEach((item, index) => {
            const itemEl = document.createElement('a');
            itemEl.href = item.url;
            itemEl.className = 'cmd-palette-item' + (index === selectedIndex ? ' selected' : '');
            itemEl.innerHTML = `
                <div class="cmd-palette-item-left">
                    <span class="cmd-palette-item-icon">${item.icon || '📌'}</span>
                    <div class="cmd-palette-item-text">
                        <div class="cmd-palette-item-title">${item.title}</div>
                        ${item.subtitle ? `<div class="cmd-palette-item-subtitle">${item.subtitle}</div>` : ''}
                    </div>
                </div>
                <span class="cmd-palette-item-category">${item.category}</span>
            `;

            itemEl.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
            });

            resultsContainer.appendChild(itemEl);
        });
    }

    function updateSelection() {
        const items = resultsContainer.querySelectorAll('.cmd-palette-item');
        items.forEach((el, i) => {
            el.classList.toggle('selected', i === selectedIndex);
            if (i === selectedIndex) {
                el.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            selectedIndex = 0;
            fetchResults(input.value.trim());
        }, 150);
    });

    input.addEventListener('keydown', (e) => {
        if (!currentResults.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % currentResults.length;
            updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
            updateSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentResults[selectedIndex]) {
                window.location.href = currentResults[selectedIndex].url;
            }
        }
    });
})();
