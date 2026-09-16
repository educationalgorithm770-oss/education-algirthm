/**
 * Education Algorithm — Master Java Full Stack Workshop Engine
 * Advanced Educational Interactivity Engine
 * Routes: /java-full-stack-workshop/day-1 & /java-full-stack-workshop/day-2
 */

document.addEventListener('DOMContentLoaded', function() {

    // 0. DAY 2 PASSCODE LOCK ENGINE (STRICT LOCK BY DEFAULT)
    const lockOverlay = document.getElementById('jfwDay2LockOverlay');
    const lockForm = document.getElementById('jfwLockForm');
    const passcodeInp = document.getElementById('jfwPasscodeInput');
    const lockError = document.getElementById('jfwLockError');
    const CORRECT_PASSCODE = 'JAVA2026';

    if (lockOverlay) {
        // Check if unlocked in sessionStorage
        if (sessionStorage.getItem('jfw_day2_unlocked') === 'true') {
            lockOverlay.style.display = 'none';
            document.body.classList.remove('jfw-locked-body');
        } else {
            lockOverlay.style.display = 'flex';
            document.body.classList.add('jfw-locked-body');
        }

        // Handle Form submit
        if (lockForm) {
            lockForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const entered = (passcodeInp ? passcodeInp.value.trim() : '').toUpperCase();
                if (entered === CORRECT_PASSCODE) {
                    sessionStorage.setItem('jfw_day2_unlocked', 'true');
                    lockOverlay.style.display = 'none';
                    document.body.classList.remove('jfw-locked-body');
                } else {
                    if (lockError) {
                        lockError.style.display = 'block';
                    }
                }
            });
        }
    }

    // 1. Header Scroll Effect & Smooth Scroll
    const header = document.querySelector('.jfw-header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 40) {
            if (header) header.classList.add('scrolled');
        } else {
            if (header) header.classList.remove('scrolled');
        }
    });

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

    // 2. HERO ANIMATED TYPING CODE EDITOR (DAY 1 & DAY 2)
    const heroCodeLog = document.getElementById('jfwHeroCodeLog');
    const heroOutput = document.getElementById('jfwHeroOutput');

    if (heroCodeLog) {
        const codeLines = [
            '<span style="color: #c084fc;">public class</span> <span style="color: #fff;">StudentProfile</span> {',
            '&nbsp;&nbsp;<span style="color: #c084fc;">public static void</span> <span style="color: #60a5fa;">main</span>(String[] args) {',
            '&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #38bdf8;">System.out.println</span>(<span style="color: #34d399;">"Hello Java Full Stack!"</span>);',
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
                        heroOutput.innerHTML = `
                            <div style="color: #64748b;">> Compiling...</div>
                            <div style="color: #64748b;">> Running...</div>
                            <div style="color: #10b981; margin-top: 0.25rem;">✓ Program completed</div>
                            <div style="color: #fff; font-weight: 800; font-size: 1.1rem; margin-top: 0.5rem;">Hello Java Full Stack!</div>
                            <div style="color: #34d399; font-weight: 700; font-size: 0.85rem; margin-top: 0.5rem;">🎉 FIRST PROGRAM COMPLETE</div>
                        `;
                    }, 400);
                }
            }
        }, 350);
    }

    // 3. 3D PERSPECTIVE PARALLAX STRICTLY FOR HERO & ENDING CTA
    document.querySelectorAll('.jfw-hero-3d-canvas, .jfw-ending-3d-canvas').forEach(canvas => {
        canvas.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            this.style.transform = `perspective(1000px) rotateX(${-y / 30}deg) rotateY(${x / 30}deg) translateY(-3px)`;
        });
        canvas.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });

    // 4. STEP-BY-STEP CONCEPT TAB HANDLER (.jfw-concept-tab)
    const conceptTabs = document.querySelectorAll('.jfw-concept-tab');
    const conceptPanels = document.querySelectorAll('.jfw-concept-panel');
    const conceptProgressText = document.getElementById('jfwConceptProgressText');

    if (conceptTabs.length > 0) {
        conceptTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetConcept = this.getAttribute('data-concept');
                
                conceptTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                conceptPanels.forEach(panel => {
                    if (panel.id === `${targetConcept}-panel`) {
                        panel.style.display = 'block';
                    } else {
                        panel.style.display = 'none';
                    }
                });

                if (conceptProgressText) {
                    conceptProgressText.textContent = `✓ ${this.textContent.trim()} Active`;
                }
            });
        });
    }

    // 5. CODE LINE STEPPER (LESSON 01)
    const stepCodeBtn = document.getElementById('jfwStepCodeBtn');
    const stepCodeLines = document.querySelectorAll('#jfwStepCodeBox .code-line');
    const stepperLog = document.getElementById('jfwStepperLog');
    let currentLineIdx = 0;

    const stepperMessages = [
        "1. Executing Line 1: 'public class StudentProfile' ➔ Program container loaded.",
        "2. Executing Line 2: 'public static void main(...)' ➔ Starting execution entry point.",
        "3. Executing Line 3: 'System.out.println(...)' ➔ Printing 'Building Student Profile...' to screen terminal.",
        "4. Executing Line 4: '}' ➔ Main method completed.",
        "5. Executing Line 5: '}' ➔ Program execution finished successfully ✓"
    ];

    if (stepCodeBtn && stepCodeLines.length > 0) {
        stepCodeBtn.addEventListener('click', () => {
            stepCodeLines.forEach(l => l.style.background = 'transparent');
            if (stepCodeLines[currentLineIdx]) {
                stepCodeLines[currentLineIdx].style.background = 'rgba(99, 102, 241, 0.25)';
            }
            if (stepperLog) {
                stepperLog.textContent = stepperMessages[currentLineIdx] || "Step completed";
            }
            currentLineIdx = (currentLineIdx + 1) % stepCodeLines.length;
        });
    }

    // 6. LIVE DUAL-PANE STUDENT PROFILE BUILDER PREVIEW
    const pNameInput = document.getElementById('jfwProfileName');
    const pAgeInput = document.getElementById('jfwProfileAge');
    const pCollegeInput = document.getElementById('jfwProfileCollege');
    const pBranchInput = document.getElementById('jfwProfileBranch');
    const pGoalInput = document.getElementById('jfwProfileGoal');
    const liveTerminalOutput = document.getElementById('jfwLiveTerminalOutput');

    function updateLiveProfileTerminal() {
        if (!liveTerminalOutput) return;
        const name = pNameInput ? (pNameInput.value || 'Rahul Sharma') : 'Rahul Sharma';
        const age = pAgeInput ? (pAgeInput.value || '20') : '20';
        const college = pCollegeInput ? (pCollegeInput.value || 'ABC Engineering') : 'ABC Engineering';
        const branch = pBranchInput ? (pBranchInput.value || 'Computer Science') : 'Computer Science';
        const goal = pGoalInput ? (pGoalInput.value || 'Java Full Stack Developer') : 'Java Full Stack Developer';

        liveTerminalOutput.textContent = `==============================
     STUDENT CAREER PROFILE
==============================
Name        : ${name}
Age         : ${age}
College     : ${college}
Branch      : ${branch}
Career Goal : ${goal}
==============================
✓ Program Output Generated Live`;
    }

    [pNameInput, pAgeInput, pCollegeInput, pBranchInput, pGoalInput].forEach(inp => {
        if (inp) {
            inp.addEventListener('input', updateLiveProfileTerminal);
        }
    });
    updateLiveProfileTerminal();

    // 7. BEGINNER BUG MATRIX TOGGLES
    document.querySelectorAll('.jfw-bug-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parentCard = this.closest('.jfw-bug-card');
            if (!parentCard) return;

            const mode = this.getAttribute('data-mode');
            const codeBox = parentCard.querySelector('.jfw-bug-code');
            const explainText = parentCard.querySelector('.jfw-bug-explain');

            parentCard.querySelectorAll('.jfw-bug-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (mode === 'faulty') {
                if (codeBox) codeBox.innerHTML = codeBox.getAttribute('data-faulty-code');
                if (explainText) explainText.innerHTML = `<span style="color: #f87171;">❌ Faulty Code: Causes compiler error or crash!</span>`;
            } else {
                if (codeBox) codeBox.innerHTML = codeBox.getAttribute('data-fixed-code');
                if (explainText) explainText.innerHTML = `<span style="color: #34d399;">✓ Fixed Code: Clean syntax, compiles cleanly!</span>`;
            }
        });
    });

    // 8. MICRO-CHALLENGE QUIZ ANSWERS
    let challengesPassed = 0;
    const quizScoreBadge = document.getElementById('jfwQuizScoreBadge');

    document.querySelectorAll('.jfw-quiz-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const isCorrect = this.getAttribute('data-correct') === 'true';
            const quizBox = this.closest('.jfw-quiz-box');

            quizBox.querySelectorAll('.jfw-quiz-option').forEach(o => {
                o.classList.remove('correct', 'wrong');
            });

            if (isCorrect) {
                this.classList.add('correct');
                if (!quizBox.getAttribute('data-passed')) {
                    quizBox.setAttribute('data-passed', 'true');
                    challengesPassed++;
                    if (quizScoreBadge) {
                        quizScoreBadge.textContent = `Progress: ${challengesPassed} / 7 Challenges Passed 🎉`;
                    }
                }
            } else {
                this.classList.add('wrong');
            }
        });
    });

    // 9. SECTION 01: WEBSITE ASSEMBLY STEPPER (DAY 2)
    const step1Btn = document.getElementById('jfwAssemblyStep1Btn');
    const step2Btn = document.getElementById('jfwAssemblyStep2Btn');
    const step3Btn = document.getElementById('jfwAssemblyStep3Btn');
    const assemblyCanvas = document.getElementById('jfwAssemblyBrowserCanvas');
    const assemblyExplainText = document.getElementById('jfwAssemblyExplainText');

    if (assemblyCanvas) {
        if (step1Btn) {
            step1Btn.addEventListener('click', () => {
                step1Btn.className = 'jfw-btn-micro active';
                if (step2Btn) step2Btn.className = 'jfw-btn-micro';
                if (step3Btn) step3Btn.className = 'jfw-btn-micro';

                assemblyCanvas.style.background = '#040712';
                assemblyCanvas.innerHTML = `
                    <div style="color: #ffffff; font-family: sans-serif;">
                        <h3>My Student Profile</h3>
                        <p>Welcome to my web page!</p>
                        <input placeholder="Enter name..." style="padding: 4px 8px;">
                        <button style="padding: 4px 8px;">Click Me</button>
                    </div>
                `;
                if (assemblyExplainText) {
                    assemblyExplainText.innerHTML = `💡 <strong>HTML (Structure):</strong> Decides what elements (headings, text, inputs, buttons) exist on the page.`;
                }
            });
        }

        if (step2Btn) {
            step2Btn.addEventListener('click', () => {
                if (step1Btn) step1Btn.className = 'jfw-btn-micro';
                step2Btn.className = 'jfw-btn-micro active';
                if (step3Btn) step3Btn.className = 'jfw-btn-micro';

                assemblyCanvas.style.background = 'linear-gradient(135deg, #0e172e 0%, #1e1b4b 100%)';
                assemblyCanvas.innerHTML = `
                    <div style="color: #ffffff; font-family: var(--jfw-font-main); padding: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(14,23,46,0.8);">
                        <h3 style="color: var(--jfw-accent-cyan); margin-top: 0;">🎓 My Student Profile</h3>
                        <p style="color: #cbd5e1;">Welcome to my web page!</p>
                        <input placeholder="Enter name..." class="jfw-form-input" style="margin-bottom: 0.5rem;">
                        <button class="jfw-btn jfw-btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">Click Me ⚡</button>
                    </div>
                `;
                if (assemblyExplainText) {
                    assemblyExplainText.innerHTML = `🎨 <strong>CSS (Design):</strong> Adds colors, dark theme gradients, rounded card borders, and sleek SaaS typography.`;
                }
            });
        }

        if (step3Btn) {
            step3Btn.addEventListener('click', () => {
                if (step1Btn) step1Btn.className = 'jfw-btn-micro';
                if (step2Btn) step2Btn.className = 'jfw-btn-micro';
                step3Btn.className = 'jfw-btn-micro active';

                assemblyCanvas.style.background = 'linear-gradient(135deg, #0e172e 0%, #1e1b4b 100%)';
                assemblyCanvas.innerHTML = `
                    <div style="color: #ffffff; font-family: var(--jfw-font-main); padding: 1rem; border: 1px solid var(--jfw-border-glow); border-radius: 12px; background: rgba(14,23,46,0.8);">
                        <h3 style="color: var(--jfw-accent-cyan); margin-top: 0;">🎓 My Student Profile</h3>
                        <p style="color: #34d399; font-weight: 700;">Welcome to Education Algorithm 🚀</p>
                        <input placeholder="Enter name..." class="jfw-form-input" value="Rahul Sharma" style="margin-bottom: 0.5rem;">
                        <button class="jfw-btn jfw-btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem; background: #10b981;">✓ ACTION EXECUTED!</button>
                    </div>
                `;
                if (assemblyExplainText) {
                    assemblyExplainText.innerHTML = `⚡ <strong>JavaScript (Interaction):</strong> Reacts instantly when the user clicks the button, changing text and status live!`;
                }
            });
        }
    }

    // 10. CSS BEFORE / AFTER SLIDER (#jfwBaSlider) & THEME PRESETS
    const baSlider = document.getElementById('jfwBaSlider');
    const baAfterOverlay = document.getElementById('jfwBaAfterOverlay');
    const baAfterInner = document.querySelector('.jfw-ba-after-inner');

    if (baSlider && baAfterOverlay) {
        baSlider.addEventListener('input', function() {
            baAfterOverlay.style.width = `${this.value}%`;
        });
    }

    document.querySelectorAll('.jfw-theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.querySelectorAll('.jfw-theme-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (baAfterInner) {
                baAfterInner.className = 'jfw-ba-after-inner ' + (theme !== 'default' ? 'theme-' + theme : '');
            }
        });
    });

    // 11. JAVASCRIPT EVENT PIPELINE VISUALIZER (#jfwJsMainClickBtn)
    const jsMainClickBtn = document.getElementById('jfwJsMainClickBtn');
    const jsBrowserText = document.getElementById('jfwJsBrowserText');
    const pipelineNodes = document.querySelectorAll('.jfw-pipeline-node');

    if (jsMainClickBtn && jsBrowserText) {
        jsMainClickBtn.addEventListener('click', function() {
            jsMainClickBtn.style.transform = 'scale(0.96)';
            setTimeout(() => jsMainClickBtn.style.transform = 'scale(1)', 120);

            pipelineNodes.forEach(n => n.classList.remove('active'));

            const stepTimes = [100, 300, 500, 700, 900];
            stepTimes.forEach((time, idx) => {
                setTimeout(() => {
                    if (pipelineNodes[idx]) pipelineNodes[idx].classList.add('active');
                }, time);
            });

            setTimeout(() => {
                jsBrowserText.innerHTML = '<span style="color: #34d399; font-weight: 800; font-size: 1.25rem;">Welcome to Education Algorithm 🚀</span>';
            }, 1000);
        });
    }

    // 12. CINEMATIC FULL-STACK SIMULATOR & NODE DRAWERS
    const playFlowBtn = document.getElementById('jfwPlayFlowBtn');
    const pauseFlowBtn = document.getElementById('jfwPauseFlowBtn');
    const flowStepBoxes = document.querySelectorAll('.jfw-flow-step-box');
    const nodeDrawer = document.getElementById('jfwNodeDrawer');
    const nodeDrawerContent = document.getElementById('jfwNodeDrawerContent');

    const nodeDetails = [
        "1. USER ACTION: Student clicks 'Create Profile' button on HTML form.",
        "2. JS CAPTURE: JavaScript reads input values and serializes them into JSON: { name: 'Rahul', college: 'ABC' }.",
        "3. HTTP REQUEST: Browser opens TCP connection and sends POST /api/v1/profile payload across the web.",
        "4. JAVA CONTROLLER: Spring Boot @RestController intercepts request payload and parses DTO object.",
        "5. JAVA SERVICE: Business logic validates email format, checks student age rules, and prepares DB entity.",
        "6. MYSQL DATABASE: Hibernate JPA executes INSERT INTO student_profile VALUES (...) into MySQL table.",
        "7. HTTP RESPONSE: Java returns HTTP 200 OK with response header application/json.",
        "8. UI RENDER: JavaScript updates webpage DOM with green confirmation banner live!"
    ];
    
    let flowTimer = null;
    let currentFlowIdx = 0;

    function setActiveFlowStep(idx) {
        flowStepBoxes.forEach(b => b.classList.remove('active'));
        if (flowStepBoxes[idx]) {
            flowStepBoxes[idx].classList.add('active');
            if (nodeDrawer && nodeDrawerContent) {
                nodeDrawer.style.display = 'block';
                nodeDrawerContent.textContent = nodeDetails[idx] || "Step details loaded";
            }
        }
    }

    flowStepBoxes.forEach((box, idx) => {
        box.addEventListener('click', () => {
            if (flowTimer) clearInterval(flowTimer);
            currentFlowIdx = idx;
            setActiveFlowStep(idx);
        });
    });

    if (playFlowBtn && flowStepBoxes.length > 0) {
        playFlowBtn.addEventListener('click', () => {
            if (flowTimer) clearInterval(flowTimer);
            setActiveFlowStep(currentFlowIdx);
            playFlowBtn.textContent = 'PLAYING... ⚡';

            flowTimer = setInterval(() => {
                currentFlowIdx = (currentFlowIdx + 1) % flowStepBoxes.length;
                setActiveFlowStep(currentFlowIdx);

                if (currentFlowIdx === flowStepBoxes.length - 1) {
                    clearInterval(flowTimer);
                    playFlowBtn.textContent = 'REPLAY FLOW 🔁';
                }
            }, 1400);
        });
    }

    if (pauseFlowBtn) {
        pauseFlowBtn.addEventListener('click', () => {
            if (flowTimer) clearInterval(flowTimer);
            if (playFlowBtn) playFlowBtn.textContent = 'PLAY FLOW ⚡';
        });
    }

    // 13. CAREER CALCULATOR STAGE SWITCHER
    const calcBtns = document.querySelectorAll('.jfw-calc-btn');
    const feStageText = document.getElementById('jfwFrontendStageText');
    const fsStageText = document.getElementById('jfwFullStackStageText');

    const stageData = {
        college: {
            fe: "• Tech: HTML, CSS, JavaScript<br>• Scope: UI Screens & Static Templates<br>• Entry Salary: <strong>₹3.5LPA - ₹5LPA</strong>",
            fs: "• Tech: HTML, CSS, JS + Java Spring Boot + MySQL<br>• Scope: End-to-End System Architect<br>• Entry Salary: <strong>₹6.5LPA - ₹12LPA</strong>"
        },
        final: {
            fe: "• Tech: HTML, CSS, React Basics<br>• Scope: Component Styling & Basic APIs<br>• Entry Salary: <strong>₹4LPA - ₹6LPA</strong>",
            fs: "• Tech: React/HTML/CSS + Java Spring Boot Microservices + MySQL/PostgreSQL<br>• Scope: Enterprise Product Engineer<br>• Entry Salary: <strong>₹8LPA - ₹16LPA</strong>"
        },
        'non-it': {
            fe: "• Tech: Basic Web UI & Layouts<br>• Scope: Web Content Maintainer<br>• Entry Salary: <strong>₹3LPA - ₹4.5LPA</strong>",
            fs: "• Tech: Java Core + Web Dev + Spring Boot Enterprise APIs<br>• Scope: Full Stack Software Developer<br>• Entry Salary: <strong>₹6LPA - ₹10LPA</strong>"
        }
    };

    calcBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const stage = this.getAttribute('data-stage');
            calcBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            if (stageData[stage]) {
                if (feStageText) feStageText.innerHTML = stageData[stage].fe;
                if (fsStageText) fsStageText.innerHTML = stageData[stage].fs;
            }
        });
    });

    // 14. WEBINAR COUPON VALIDATOR HANDLER
    const couponInput = document.getElementById('jfwCouponInput');
    const applyCouponBtn = document.getElementById('jfwApplyCouponBtn');
    const couponMsg = document.getElementById('jfwCouponMsg');
    const priceOfferText = document.getElementById('jfwPriceOfferText');

    if (applyCouponBtn && couponInput) {
        applyCouponBtn.addEventListener('click', function() {
            const enteredCode = couponInput.value.trim().toUpperCase();
            if (enteredCode === 'STUDENT') {
                if (priceOfferText) priceOfferText.textContent = '₹15,000';
                if (couponMsg) {
                    couponMsg.style.color = '#34d399';
                    couponMsg.innerHTML = '🎉 WEBINAR OFFER ACTIVE: You save ₹5,000!';
                }
            } else if (enteredCode === '') {
                if (priceOfferText) priceOfferText.textContent = '₹20,000';
                if (couponMsg) {
                    couponMsg.style.color = '#cbd5e1';
                    couponMsg.innerHTML = 'Enter coupon code STUDENT to unlock ₹15,000 offer.';
                }
            } else {
                if (priceOfferText) priceOfferText.textContent = '₹20,000';
                if (couponMsg) {
                    couponMsg.style.color = '#f87171';
                    couponMsg.innerHTML = '❌ Invalid Coupon Code. Use <strong>STUDENT</strong> for ₹15,000 offer.';
                }
            }
        });
    }

    // 15. 3-COLUMN LIVE STUDIO CODE STEPPER & RAM VISUALIZER ENGINE
    const playStudioBtn = document.getElementById('jfwPlayStudioBtn');
    const nextStudioBtn = document.getElementById('jfwNextStudioBtn');
    const studioLines = document.querySelectorAll('#jfwStudioCodeBox .jfw-code-clickable-line');
    const ramCard1 = document.getElementById('jfwRamCard1');
    const ramCard2 = document.getElementById('jfwRamCard2');
    const appMockupBox = document.getElementById('jfwAppMockupBox');

    const appMockupData = [
        { icon: '🔍', title: 'GOOGLE SEARCH & WHATSAPP CHAT', desc: 'Imports Scanner input streams to capture user keyboard typing in real-time.' },
        { icon: '📦', title: 'SWIGGY & ANDROID APP CONTAINER', desc: 'Creates the class container file where all program logic sits.' },
        { icon: '🚀', title: 'SWIGGY IGNITION ENGINE', desc: 'The main() method starts code execution when you tap the app icon.' },
        { icon: '🏧', title: 'ATM KEYPAD 4-DIGIT PIN READER', desc: 'Scanner pauses execution and listens to keyboard PIN entries.' },
        { icon: '📸', title: 'INSTAGRAM PROFILE HANDLE SETUP', desc: 'Saves text username inside RAM slot 0x10A.' },
        { icon: '🎬', title: 'NETFLIX AGE VERIFICATION GATE', desc: 'Saves 32-bit integer age number inside RAM slot 0x10B.' },
        { icon: '💸', title: 'GPAY / PHONEPE PAYMENT RECEIPT', desc: 'Glues text labels & RAM variables to display final receipt on screen.' },
        { icon: '✓', title: 'METHOD CLEANUP', desc: 'Main method execution completed cleanly.' },
        { icon: '✓', title: 'PROGRAM COMPLETE', desc: 'Java class execution finished successfully.' }
    ];

    let currentStudioLine = 0;
    let studioTimer = null;

    function activateStudioLine(idx) {
        studioLines.forEach(l => {
            l.classList.remove('active');
            l.style.background = 'transparent';
        });

        if (studioLines[idx]) {
            studioLines[idx].classList.add('active');
            studioLines[idx].style.background = 'rgba(99, 102, 241, 0.25)';

            // RAM board lighting
            if (idx === 4) { // line 5 (String name)
                if (ramCard1) ramCard1.className = 'jfw-ram-card active-cyan';
                if (ramCard2) ramCard2.className = 'jfw-ram-card';
            } else if (idx === 5) { // line 6 (int age)
                if (ramCard1) ramCard1.className = 'jfw-ram-card';
                if (ramCard2) ramCard2.className = 'jfw-ram-card active-amber';
            } else {
                if (ramCard1) ramCard1.className = 'jfw-ram-card';
                if (ramCard2) ramCard2.className = 'jfw-ram-card';
            }

            // App Mockup switch
            if (appMockupBox && appMockupData[idx]) {
                const data = appMockupData[idx];
                appMockupBox.innerHTML = `
                    <span style="font-size: 2.2rem; margin-bottom: 0.5rem;">${data.icon}</span>
                    <strong style="color: #fff; font-size: 1.05rem;">${data.title}</strong>
                    <p style="color: var(--jfw-text-muted); font-size: 0.82rem; margin-top: 0.35rem;">
                        ${data.desc}
                    </p>
                `;
            }
        }
    }

    studioLines.forEach((line, idx) => {
        line.addEventListener('click', () => {
            if (studioTimer) clearInterval(studioTimer);
            currentStudioLine = idx;
            activateStudioLine(idx);
        });
    });

    if (nextStudioBtn) {
        nextStudioBtn.addEventListener('click', () => {
            if (studioTimer) clearInterval(studioTimer);
            currentStudioLine = (currentStudioLine + 1) % studioLines.length;
            activateStudioLine(currentStudioLine);
        });
    }

    if (playStudioBtn) {
        playStudioBtn.addEventListener('click', () => {
            if (studioTimer) clearInterval(studioTimer);
            activateStudioLine(currentStudioLine);
            playStudioBtn.textContent = 'PLAYING... ⚡';

            studioTimer = setInterval(() => {
                currentStudioLine = (currentStudioLine + 1) % studioLines.length;
                activateStudioLine(currentStudioLine);

                if (currentStudioLine === studioLines.length - 1) {
                    clearInterval(studioTimer);
                    playStudioBtn.textContent = 'REPLAY WALKTHROUGH 🔁';
                }
            }, 1800);
        });
    }

    // 16. FAQ ACCORDION HANDLER
    const faqQuestions = document.querySelectorAll('.jfw-faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isOpen = getComputedStyle(answer).display === 'block';

            document.querySelectorAll('.jfw-faq-answer').forEach(a => a.style.display = 'none');
            document.querySelectorAll('.jfw-faq-icon').forEach(i => i.textContent = '+');

            if (!isOpen) {
                answer.style.display = 'block';
                this.querySelector('.jfw-faq-icon').textContent = '−';
            }
        });
    });

});
