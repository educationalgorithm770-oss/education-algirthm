/**
 * Education Algorithm — Master 2-Day Java Full Stack Workshop Engine
 * Routes: /java-workshop/day-1 & /java-workshop/day-2
 */

document.addEventListener('DOMContentLoaded', function() {

    // 0. Header Scroll Effect
    const header = document.querySelector('.jw-header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 40) {
            if (header) header.classList.add('scrolled');
        } else {
            if (header) header.classList.remove('scrolled');
        }
    });

    // Smooth Scroll Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 1. HERO ANIMATED CODE EDITOR
    const heroCodeLog = document.getElementById('jwHeroCodeLog');
    const heroOutput = document.getElementById('jwHeroOutput');

    if (heroCodeLog) {
        const codeLines = [
            '<span style="color: #c084fc;">public class</span> <span style="color: #fff;">Main</span> {',
            '&nbsp;&nbsp;<span style="color: #c084fc;">public static void</span> <span style="color: #60a5fa;">main</span>(String[] args) {',
            '&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #38bdf8;">System.out.println</span>(<span style="color: #34d399;">"Hello World"</span>);',
            '&nbsp;&nbsp;}',
            '}'
        ];
        let idx = 0;
        const lineTimer = setInterval(() => {
            if (idx < codeLines.length) {
                const line = document.createElement('div');
                line.innerHTML = codeLines[idx];
                heroCodeLog.appendChild(line);
                idx++;
            } else {
                clearInterval(lineTimer);
                if (heroOutput) {
                    setTimeout(() => {
                        heroOutput.style.display = 'block';
                        heroOutput.innerHTML = '<span style="color: #10b981;">✓ Executed:</span> <strong style="color: #fff;">Hello World</strong>';
                    }, 400);
                }
            }
        }, 350);
    }

    // 2. STAGE 01: "WHAT IS PROGRAMMING?" INTERACTIVE TRY EXAMPLE
    const tryExampleBtn = document.getElementById('jwTryExampleBtn');
    const exampleResult = document.getElementById('jwExampleResult');

    if (tryExampleBtn && exampleResult) {
        tryExampleBtn.addEventListener('click', () => {
            exampleResult.style.display = 'block';
            exampleResult.innerHTML = `
                <div class="jw-mono" style="font-size: 0.88rem; line-height: 1.8;">
                    <div style="color: #a5b4fc;">You: "Print my name"</div>
                    <div style="color: #64748b;">Computer: "How? What language?"</div>
                    <div style="color: #38bdf8;">You: "System.out.println(\"Rahul\");"</div>
                    <div style="color: #34d399; font-weight: 700; margin-top: 0.5rem;">> Output: Rahul</div>
                </div>
            `;
        });
    }

    // 3. DAY 1: FIRST JAVA PROGRAM PLAYGROUND (RUN CODE ▶)
    const runPlaygroundBtn = document.getElementById('jwRunPlaygroundBtn');
    const playgroundConsole = document.getElementById('jwPlaygroundConsole');
    const playgroundCelebration = document.getElementById('jwPlaygroundCelebration');

    if (runPlaygroundBtn && playgroundConsole) {
        runPlaygroundBtn.addEventListener('click', () => {
            runPlaygroundBtn.disabled = true;
            runPlaygroundBtn.innerHTML = 'Running...';

            playgroundConsole.innerHTML = '<div style="color: #f59e0b;">> Compiling Main.java...</div>';

            setTimeout(() => {
                playgroundConsole.innerHTML = `
                    <div style="color: #10b981;">✓ Program executed successfully</div>
                    <div style="color: #ffffff; font-weight: 800; font-size: 1.1rem; margin-top: 0.5rem;">Hello World</div>
                `;
                runPlaygroundBtn.disabled = false;
                runPlaygroundBtn.innerHTML = 'RUN CODE ▶';

                if (playgroundCelebration) {
                    playgroundCelebration.style.display = 'block';
                }
            }, 700);
        });
    }

    // 4. STUDENT CAREER PROFILE DEMO MODAL & GENERATOR
    const openProfileModalBtn = document.getElementById('jwOpenProfileModalBtn');
    const profileModalBackdrop = document.getElementById('jwProfileModal');
    const closeProfileModalBtn = document.getElementById('jwCloseProfileModalBtn');
    const profileForm = document.getElementById('jwProfileForm');
    const profileResultDisplay = document.getElementById('jwProfileResultDisplay');

    if (openProfileModalBtn && profileModalBackdrop) {
        openProfileModalBtn.addEventListener('click', () => {
            profileModalBackdrop.style.display = 'flex';
        });
    }
    if (closeProfileModalBtn && profileModalBackdrop) {
        closeProfileModalBtn.addEventListener('click', () => {
            profileModalBackdrop.style.display = 'none';
        });
    }

    if (profileForm && profileResultDisplay) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = profileForm.querySelector('[name="p_name"]').value.trim() || 'Rahul';
            const age = profileForm.querySelector('[name="p_age"]').value.trim() || '20';
            const college = profileForm.querySelector('[name="p_college"]').value.trim() || 'ABC Engineering';
            const branch = profileForm.querySelector('[name="p_branch"]').value.trim() || 'CSE';
            const goal = profileForm.querySelector('[name="p_goal"]').value.trim() || 'Java Developer';

            if (profileModalBackdrop) profileModalBackdrop.style.display = 'none';

            profileResultDisplay.innerHTML = `
                <div style="border: 1px solid var(--jw-border-glow); border-radius: var(--jw-radius-lg); padding: 1.75rem; background: #040712; max-width: 500px; margin: 0 auto; box-shadow: var(--jw-shadow-glow);">
                    <div class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.82rem; margin-bottom: 1rem; text-transform: uppercase;">
                        🎓 STUDENT CAREER PROFILE GENERATED
                    </div>
                    <table style="width: 100%; border-collapse: collapse; color: #cbd5e1; font-size: 0.95rem;">
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);"><td style="padding: 0.5rem 0; color: var(--jw-text-subtle);">Name</td><td style="font-weight: 700; color: #fff;">${escapeHtml(name)}</td></tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);"><td style="padding: 0.5rem 0; color: var(--jw-text-subtle);">Age</td><td style="font-weight: 700; color: #fff;">${escapeHtml(age)}</td></tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);"><td style="padding: 0.5rem 0; color: var(--jw-text-subtle);">College</td><td style="font-weight: 700; color: #fff;">${escapeHtml(college)}</td></tr>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);"><td style="padding: 0.5rem 0; color: var(--jw-text-subtle);">Branch</td><td style="font-weight: 700; color: #fff;">${escapeHtml(branch)}</td></tr>
                        <tr><td style="padding: 0.5rem 0; color: var(--jw-text-subtle);">Career Goal</td><td style="font-weight: 700; color: var(--jw-accent-emerald);">${escapeHtml(goal)}</td></tr>
                    </table>
                    <div class="jw-mono" style="margin-top: 1.25rem; text-align: center; color: var(--jw-primary); font-size: 0.85rem; font-weight: 700;">
                        🚀 Your journey starts today!
                    </div>
                </div>
            `;
            profileResultDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // 5. DAY 2: BEFORE / AFTER INTERACTIVE SLIDER
    const baSlider = document.getElementById('jwBaSlider');
    const baAfterOverlay = document.getElementById('jwBaAfterOverlay');

    if (baSlider && baAfterOverlay) {
        baSlider.addEventListener('input', function() {
            const val = this.value;
            baAfterOverlay.style.width = `${val}%`;
        });
    }

    // 6. FAQ ACCORDION HANDLER
    const faqQuestions = document.querySelectorAll('.jw-faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isOpen = getComputedStyle(answer).display === 'block';

            document.querySelectorAll('.jw-faq-answer').forEach(a => a.style.display = 'none');
            document.querySelectorAll('.jw-faq-icon').forEach(i => i.textContent = '+');

            if (!isOpen) {
                answer.style.display = 'block';
                this.querySelector('.jw-faq-icon').textContent = '−';
            }
        });
    });

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

});
