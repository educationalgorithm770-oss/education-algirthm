(function () {
    var history = [];

    // 1. Safe Markdown Parser & HTML Sanitizer
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderMarkdown(rawText) {
        if (!rawText) return "";

        // Extract and protect fenced code blocks first
        var codeBlocks = [];
        var text = rawText.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (match, lang, code) {
            var id = "___CODE_BLOCK_" + codeBlocks.length + "___";
            var cleanLang = escapeHtml(lang || "code");
            var cleanCode = escapeHtml(code.trim());
            codeBlocks.push(
                '<div class="ea-code-card">' +
                    '<div class="ea-code-header">' +
                        '<span>' + cleanLang + '</span>' +
                        '<button type="button" class="ea-copy-btn" onclick="navigator.clipboard.writeText(this.getAttribute(\'data-code\')); this.textContent=\'Copied!\'; setTimeout(() => this.textContent=\'Copy\', 2000);" data-code="' + escapeHtml(code.trim()) + '">Copy</button>' +
                    '</div>' +
                    '<pre class="ea-code-body"><code>' + cleanCode + '</code></pre>' +
                '</div>'
            );
            return id;
        });

        // Sanitize remaining plain text to prevent XSS
        text = escapeHtml(text);

        // Bold: **text** or __text__ (handles any content between double asterisks)
        text = text.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([\s\S]*?)__/g, '<strong>$1</strong>');

        // Italic: *text* (when not preceded or followed by an asterisk)
        text = text.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, '$1<em>$2</em>$3');

        // Inline code `code`
        text = text.replace(/`([^`]+)`/g, '<code class="ea-inline-code">$1</code>');

        // Headers: ### Header
        text = text.replace(/^### (.*$)/gim, '<h4 class="ea-heading">$1</h4>');
        text = text.replace(/^## (.*$)/gim, '<h4 class="ea-heading">$1</h4>');
        text = text.replace(/^# (.*$)/gim, '<h4 class="ea-heading">$1</h4>');

        // Markdown Links: [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="ea-link" target="_blank" rel="noopener noreferrer">$1</a>');

        // Bullet lists: • or - or *
        var lines = text.split('\n');
        var inList = false;
        var formattedLines = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (/^[•\-\*]\s+(.+)/.test(line)) {
                var content = line.replace(/^[•\-\*]\s+/, '');
                if (!inList) {
                    formattedLines.push('<ul class="ea-list">');
                    inList = true;
                }
                formattedLines.push('<li>' + content + '</li>');
            } else {
                if (inList) {
                    formattedLines.push('</ul>');
                    inList = false;
                }
                formattedLines.push(line);
            }
        }
        if (inList) formattedLines.push('</ul>');

        text = formattedLines.join('<br>').replace(/(<ul class="ea-list">)<br>/g, '$1').replace(/<\/ul><br>/g, '</ul>');

        // Restore fenced code blocks
        for (var k = 0; k < codeBlocks.length; k++) {
            text = text.replace("___CODE_BLOCK_" + k + "___", codeBlocks[k]);
        }

        // Clean up excessive <br>
        text = text.replace(/(<br>\s*){3,}/g, '<br><br>');

        return text;
    }

    // 2. Build Chatbot DOM
    var container = document.createElement('div');
    container.className = 'ea-ai';
    container.innerHTML = `
        <div class="ea-chat" id="eaChat" role="dialog" aria-label="Education AI Chat Assistant">
            <div class="ea-headbar">
                <div class="ea-icon">🤖</div>
                <div style="flex:1; min-width:0;">
                    <div class="ea-title">Education AI</div>
                    <div class="ea-status"><span class="ea-status-dot"></span> Online • Official Assistant</div>
                </div>
                <button class="ea-head-btn" id="eaClear" title="Restart Conversation" aria-label="Restart Conversation">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                </button>
                <button class="ea-head-btn ea-close" id="eaClose" title="Close Chat" aria-label="Close Chat">✕</button>
            </div>
            <div class="ea-messages" id="eaMessages">
                <div class="ea-msg ea-botmsg">
                    <strong>Hi! I'm Education AI 👋</strong><br>
                    I can help you with courses, fees, curriculum, weekend batch timings, and programming learning.
                </div>
                <div class="ea-quick-chips" id="eaInitialChips">
                    <button type="button" class="ea-chip" data-query="Tell me about available courses">🎓 Courses</button>
                    <button type="button" class="ea-chip" data-query="What is the course fee?">💳 Fees & EMI</button>
                    <button type="button" class="ea-chip" data-query="Show me the full Java Full Stack curriculum">📚 Curriculum</button>
                    <button type="button" class="ea-chip" data-query="When is the next weekend batch?">⏰ Batches</button>
                    <button type="button" class="ea-chip" data-query="How does the production internship work?">💼 Internship</button>
                    <button type="button" class="ea-chip" data-query="How can I contact admissions counselor?">📞 Contact</button>
                </div>
            </div>
            <div class="ea-input">
                <input id="eaInput" placeholder="Ask about courses, fees, coding..." autocomplete="off" aria-label="Type your message">
                <button id="eaSend" aria-label="Send message" title="Send">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        </div>
        <div class="ea-bubble">Hi! 👋 Need help with courses or admissions?</div>
        <div class="ea-wrap" id="eaRobot" aria-label="Open Education AI Assistant" role="button" tabindex="0">
            <div class="ea-btn-trigger">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2V6"/><rect x="3" y="6" width="18" height="12" rx="3"/><circle cx="8" cy="11" r="1"/><circle cx="16" cy="11" r="1"/><path d="M9 15h6"/></svg>
                <span class="ea-badge-dot"></span>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    var chatEl = document.getElementById('eaChat');
    var robotEl = document.getElementById('eaRobot');
    var closeEl = document.getElementById('eaClose');
    var clearEl = document.getElementById('eaClear');
    var inputEl = document.getElementById('eaInput');
    var sendBtn = document.getElementById('eaSend');
    var messagesEl = document.getElementById('eaMessages');
    var bubbleEl = container.querySelector('.ea-bubble');

    var bubbleTimer = setTimeout(function () {
        if (bubbleEl) bubbleEl.classList.add('ea-bubble-hidden');
    }, 6000);

    function dismissBubble() {
        clearTimeout(bubbleTimer);
        if (bubbleEl) bubbleEl.classList.add('ea-bubble-hidden');
    }

    function toggleChat() {
        chatEl.classList.toggle('open');
        container.classList.toggle('ea-open', chatEl.classList.contains('open'));
        dismissBubble();
        if (chatEl.classList.contains('open')) {
            setTimeout(function () { inputEl.focus(); }, 150);
        }
    }

    robotEl.addEventListener('click', toggleChat);
    robotEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); }
    });
    closeEl.addEventListener('click', toggleChat);

    // Clear Conversation
    clearEl.addEventListener('click', function () {
        history = [];
        messagesEl.innerHTML = `
            <div class="ea-msg ea-botmsg">
                <strong>Conversation reset! 🔄</strong><br>
                How can I assist you now?
            </div>
            <div class="ea-quick-chips">
                <button type="button" class="ea-chip" data-query="Tell me about available courses">🎓 Courses</button>
                <button type="button" class="ea-chip" data-query="What is the course fee?">💳 Fees & EMI</button>
                <button type="button" class="ea-chip" data-query="Show me the Java Full Stack curriculum">📚 Curriculum</button>
                <button type="button" class="ea-chip" data-query="When is the next batch?">⏰ Batches</button>
                <button type="button" class="ea-chip" data-query="How does the internship work?">💼 Internship</button>
            </div>
        `;
        bindChipEvents(messagesEl);
    });

    function sanitizeChatHtml(html) {
        if (!html) return '';
        return String(html)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '');
    }

    function addMessage(htmlContent, cls) {
        var el = document.createElement('div');
        el.className = 'ea-msg ' + cls;
        el.innerHTML = sanitizeChatHtml(htmlContent);
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return el;
    }

    function addActionChips(actions) {
        if (!actions || !actions.length) return;
        var chipBox = document.createElement('div');
        chipBox.className = 'ea-quick-chips';

        actions.forEach(function (act) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ea-chip';
            btn.textContent = act.label;

            if (act.url) {
                btn.addEventListener('click', function () {
                    window.location.href = act.url;
                });
            } else if (act.action) {
                var queryText = act.label;
                if (act.action === 'curriculum') queryText = 'Show full curriculum';
                if (act.action === 'fees') queryText = 'What are the course fees?';
                if (act.action === 'batches') queryText = 'What are the batch timings?';
                if (act.action === 'courses') queryText = 'What courses do you offer?';
                if (act.action === 'internship') queryText = 'Tell me about the internship';
                btn.setAttribute('data-query', queryText);
            }
            chipBox.appendChild(btn);
        });

        messagesEl.appendChild(chipBox);
        bindChipEvents(chipBox);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function bindChipEvents(scope) {
        var chips = (scope || messagesEl).querySelectorAll('.ea-chip[data-query]');
        chips.forEach(function (chip) {
            chip.onclick = function () {
                var query = this.getAttribute('data-query');
                if (query) {
                    inputEl.value = query;
                    sendMessage();
                }
            };
        });
    }

    bindChipEvents(messagesEl);

    async function sendMessage() {
        var text = inputEl.value.trim();
        if (!text) return;
        inputEl.value = '';

        // Add user message
        addMessage(escapeHtml(text), 'ea-usermsg');
        history.push({ role: 'user', content: text });

        // Add typing indicator
        var typingEl = document.createElement('div');
        typingEl.className = 'ea-msg ea-botmsg ea-typing-box';
        typingEl.innerHTML = '<div class="ea-typing-dots"><span></span><span></span><span></span></div>';
        messagesEl.appendChild(typingEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            var res = await fetch('chatbot-api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: history.slice(-8) })
            });

            var data = await res.json();
            typingEl.remove();

            if (data.reply) {
                var renderedHtml = renderMarkdown(data.reply);
                addMessage(renderedHtml, 'ea-botmsg');
                history.push({ role: 'assistant', content: data.reply });

                if (data.actions && data.actions.length) {
                    addActionChips(data.actions);
                }
            } else {
                addMessage(escapeHtml(data.error || "Sorry, I couldn't process your request."), 'ea-botmsg');
            }
        } catch (err) {
            typingEl.remove();
            addMessage("⚠️ Connection error. Please check your internet or reach out via our [Admissions Page](contact).", 'ea-botmsg');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });
})();

