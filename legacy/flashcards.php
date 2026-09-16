<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/gamification.php';

$studentId = requireStudent();

// Handle Mastery XP API Request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'award_xp') {
    header('Content-Type: application/json');
    verify_csrf();
    $deckId = (int)($_POST['deck_id'] ?? 0);
    $cardIdx = (int)($_POST['card_idx'] ?? 0);
    
    // Idempotent XP tracking in session/daily touchpoint to prevent farming
    $todayKey = 'flash_xp_' . $deckId . '_' . $cardIdx . '_' . date('Y-m-d');
    if (!isset($_SESSION[$todayKey])) {
        $_SESSION[$todayKey] = true;
        recordStudentActivity($pdo, $studentId);
        echo json_encode(['success' => true, 'xp' => 10]);
    } else {
        echo json_encode(['success' => true, 'xp' => 0, 'message' => 'Already practiced today!']);
    }
    exit;
}

// Fetch Decks
$stmtD = $pdo->query("SELECT * FROM flashcard_decks ORDER BY id ASC");
$decks = $stmtD->fetchAll();

$selectedDeckId = (int)($_GET['deck'] ?? ($decks[0]['id'] ?? 0));
$currentDeck = null;
foreach ($decks as $d) {
    if ($d['id'] == $selectedDeckId) {
        $currentDeck = $d;
        break;
    }
}
if (!$currentDeck && !empty($decks)) {
    $currentDeck = $decks[0];
}

$cards = json_decode($currentDeck['cards_json'] ?? '[]', true) ?: [];

$pageTitle = "🧠 Interactive Flashcards & Spaced Repetition";
$activePage = 'flashcards';
$activeNav = 'flashcards';
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y45hrispgg");
</script>
    <script>
    (function() {
        var t = 'dark';
        try { t = localStorage.getItem('lms_theme') || 'dark'; } catch(e){}
        document.documentElement.setAttribute('data-theme', t);
    })();
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($pageTitle); ?> — Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

    <style>
    :root {
        --fc-glow: rgba(99, 102, 241, 0.35);
        --fc-border: rgba(255, 255, 255, 0.12);
    }

    .fc-stage-container {
        max-width: 820px;
        margin: 0 auto;
        padding: 1.5rem 1.25rem 4rem;
        position: relative;
    }

    /* 3D Animated Card Container */
    .flashcard-wrapper {
        perspective: 1200px;
        max-width: 680px;
        margin: 1.5rem auto 1.75rem;
        height: 360px;
        position: relative;
        cursor: pointer;
    }

    .flashcard-inner {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
        border-radius: 24px;
    }

    .flashcard-inner.flipped {
        transform: rotateY(180deg);
    }

    .card-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        border-radius: 24px;
        padding: 2.25rem 2.5rem;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: var(--card-bg);
        border: 2px solid var(--card-border);
        box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .card-face::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%);
        pointer-events: none;
    }

    .card-face:hover {
        border-color: #6366f1;
        box-shadow: 0 25px 60px rgba(99,102,241,0.25), 0 0 20px rgba(99,102,241,0.2);
    }

    .card-face.back {
        transform: rotateY(180deg);
        background: linear-gradient(145deg, rgba(16, 185, 129, 0.06) 0%, var(--card-bg) 100%);
        border-color: #10b981;
        box-shadow: 0 20px 50px rgba(16, 185, 129, 0.2);
    }

    .card-face.back:hover {
        box-shadow: 0 25px 60px rgba(16, 185, 129, 0.3);
    }

    /* Floating XP Particle */
    @keyframes floatUpFade {
        0% { transform: translate(-50%, 0) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -35px) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -70px) scale(1); opacity: 0; }
    }
    .xp-floater {
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, 0);
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        font-weight: 800;
        font-size: 1.2rem;
        padding: 0.4rem 1rem;
        border-radius: 100px;
        box-shadow: 0 10px 25px rgba(16,185,129,0.5);
        pointer-events: none;
        animation: floatUpFade 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        z-index: 100;
    }

    /* Animated Progress Bar */
    .fc-progress-track {
        width: 100%;
        height: 8px;
        background: var(--card-border);
        border-radius: 100px;
        overflow: hidden;
        margin-top: 0.5rem;
    }
    .fc-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #10b981);
        border-radius: 100px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Keybind Indicator Badge */
    .key-badge {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        color: var(--text-muted);
        font-size: 0.68rem;
        padding: 0.15rem 0.45rem;
        border-radius: 5px;
        font-family: monospace;
        font-weight: 700;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .flashcard-wrapper {
            height: 380px;
            margin: 1rem auto;
        }
        .card-face {
            padding: 1.5rem 1.25rem;
        }
        #questionText {
            font-size: 1.15rem !important;
        }
        #answerText {
            font-size: 0.95rem !important;
        }
        .controls-row {
            flex-wrap: wrap;
        }
    }
    </style>
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="fc-stage-container">
        <!-- Header & Animated Deck Switcher -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
            <div>
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="font-size: 2rem;">🧠</span>
                    <div>
                        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">Spaced Repetition Studio</h1>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.15rem 0 0;">
                            3D Interactive Recall Mastery • +10 XP per Memorized Concept
                        </p>
                    </div>
                </div>
            </div>

            <!-- Deck Selector Dropdown -->
            <div>
                <select id="deckSelector" onchange="location.href='flashcards.php?deck='+this.value" style="padding: 0.55rem 1.1rem; font-weight: 700; border-radius: 10px; background: var(--card-bg); color: var(--text-primary); border: 1.5px solid var(--card-border);">
                    <?php foreach ($decks as $d): ?>
                        <option value="<?php echo $d['id']; ?>" <?php echo ($currentDeck['id'] == $d['id']) ? 'selected' : ''; ?>>
                            <?php echo $d['icon'] . ' ' . e($d['title']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <!-- Animated Progress HUD -->
        <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 0.85rem 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 700;">
                <span style="color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                    <span id="deckBadge"><?php echo $currentDeck['icon'] . ' ' . e($currentDeck['title']); ?></span>
                </span>
                <span id="cardProgressText" style="color: #6366f1;">
                    Card 1 of <?php echo count($cards); ?> (0% Completed)
                </span>
            </div>
            <div class="fc-progress-track">
                <div class="fc-progress-fill" id="progressBar" style="width: 0%;"></div>
            </div>
        </div>

        <!-- 3D Interactive Flashcard Stage -->
        <div class="flashcard-wrapper" id="flashcardStage" onclick="flipCard()">
            <div class="flashcard-inner" id="cardInner">
                <!-- Front Face (Question) -->
                <div class="card-face front">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="badge paid" style="font-size: 0.74rem; font-weight: 800;"><?php echo e($currentDeck['category']); ?></span>
                        <span style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
                            <span>Click to Flip</span> <span class="key-badge">SPACE</span>
                        </span>
                    </div>

                    <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); line-height: 1.5; text-align: center; margin: 1.5rem 0;" id="questionText">
                        Loading question...
                    </div>

                    <div style="font-size: 0.84rem; color: var(--text-muted); text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.35rem;" id="hintText">
                        <span>💡 Hint available on back</span>
                    </div>
                </div>

                <!-- Back Face (Answer) -->
                <div class="card-face back">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.76rem; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 0.35rem;">
                            <span>✓ Official Engineering Explanation</span>
                        </span>
                        <span style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
                            <span>Flip Back</span> <span class="key-badge">SPACE</span>
                        </span>
                    </div>

                    <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); line-height: 1.65; text-align: center; margin: 1.25rem 0;" id="answerText">
                        Loading explanation...
                    </div>

                    <div style="font-size: 0.82rem; color: #818cf8; font-weight: 700; text-align: center;" id="hintSub">
                        🔑 Core Recall Takeaway
                    </div>
                </div>
            </div>
        </div>

        <!-- Controls: Spaced Repetition Buttons -->
        <div class="controls-row" style="display: flex; justify-content: center; gap: 0.85rem; margin-top: 1.75rem;">
            <button type="button" class="btn btn-secondary" onclick="prevCard()" style="padding: 0.65rem 1.35rem; font-weight: 700; border-radius: 12px;">
                ◀ Previous <span class="key-badge" style="margin-left: 0.35rem;">←</span>
            </button>

            <button type="button" class="btn btn-secondary" onclick="markCard('learning')" style="padding: 0.65rem 1.35rem; font-weight: 700; border-color: #f59e0b; color: #f59e0b; border-radius: 12px;">
                🔄 Still Learning <span class="key-badge" style="margin-left: 0.35rem;">1</span>
            </button>

            <button type="button" class="btn btn-primary" onclick="markCard('mastered')" style="padding: 0.65rem 1.65rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 12px; box-shadow: 0 8px 20px rgba(16,185,129,0.3);">
                ✨ Mastered (+10 XP) <span class="key-badge" style="margin-left: 0.35rem; background: rgba(255,255,255,0.2); color: #fff;">2</span>
            </button>

            <button type="button" class="btn btn-secondary" onclick="nextCard()" style="padding: 0.65rem 1.35rem; font-weight: 700; border-radius: 12px;">
                Next ▶ <span class="key-badge" style="margin-left: 0.35rem;">→</span>
            </button>
        </div>

        <!-- Keyboard Shortcuts Bar -->
        <div style="text-align: center; margin-top: 1.75rem; color: var(--text-muted); font-size: 0.78rem; display: flex; justify-content: center; gap: 1.25rem; flex-wrap: wrap;">
            <span><span class="key-badge">SPACE</span> Flip Card</span>
            <span><span class="key-badge">←</span> Previous</span>
            <span><span class="key-badge">→</span> Next</span>
            <span><span class="key-badge">2</span> Mastered (+10 XP)</span>
        </div>
    </main>

    <script>
    const cardData = <?php echo json_encode($cards); ?>;
    const currentDeckId = <?php echo (int)$currentDeck['id']; ?>;
    let currentIndex = 0;
    let isFlipping = false;

    function renderCard() {
        if (!cardData || cardData.length === 0) return;
        const c = cardData[currentIndex];
        
        const cardInner = document.getElementById('cardInner');
        cardInner.classList.remove('flipped');

        document.getElementById('questionText').textContent = c.q || 'Question';
        document.getElementById('answerText').textContent = c.a || 'Explanation';
        document.getElementById('hintText').innerHTML = c.hint ? `<span>💡 <strong>Hint:</strong> ${escapeHtml(c.hint)}</span>` : '<span>💡 Click to reveal answer</span>';
        
        const pct = Math.round(((currentIndex + 1) / cardData.length) * 100);
        document.getElementById('cardProgressText').textContent = `Card ${currentIndex + 1} of ${cardData.length} (${pct}% Progress)`;
        document.getElementById('progressBar').style.width = `${pct}%`;
    }

    function flipCard() {
        document.getElementById('cardInner').classList.toggle('flipped');
    }

    function nextCard() {
        if (currentIndex < cardData.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
            if (typeof confetti === 'function') {
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
        }
        renderCard();
    }

    function prevCard() {
        if (currentIndex > 0) {
            currentIndex--;
            renderCard();
        }
    }

    function markCard(status) {
        if (status === 'mastered') {
            // Trigger Confetti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.65 }
                });
            }

            // Spawn floating XP particle
            const stage = document.getElementById('flashcardStage');
            if (stage) {
                const floater = document.createElement('div');
                floater.className = 'xp-floater';
                floater.innerText = '+10 XP Mastered! 🎉';
                stage.appendChild(floater);
                setTimeout(() => floater.remove(), 1200);
            }

            // Async XP record to database
            const fd = new FormData();
            fd.append('action', 'award_xp');
            fd.append('deck_id', currentDeckId);
            fd.append('card_idx', currentIndex);
            fetch('flashcards.php', { method: 'POST', body: fd }).catch(e => {});
        }
        nextCard();
    }

    function escapeHtml(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // 3D Parallax Tilt Effect on Mouse Move
    const stage = document.getElementById('flashcardStage');
    if (stage) {
        stage.addEventListener('mousemove', (e) => {
            const rect = stage.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotX = -(y / rect.height) * 12;
            const rotY = (x / rect.width) * 12;
            const isFlipped = document.getElementById('cardInner').classList.contains('flipped');
            document.getElementById('cardInner').style.transform = isFlipped 
                ? `rotateY(180deg) rotateX(${rotX}deg) rotateZ(${rotY*0.5}deg)`
                : `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        });

        stage.addEventListener('mouseleave', () => {
            const isFlipped = document.getElementById('cardInner').classList.contains('flipped');
            document.getElementById('cardInner').style.transform = isFlipped ? 'rotateY(180deg)' : '';
        });
    }

    // Keyboard Shortcuts Navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            flipCard();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            prevCard();
        } else if (e.key === '1') {
            markCard('learning');
        } else if (e.key === '2') {
            markCard('mastered');
        }
    });

    document.addEventListener('DOMContentLoaded', renderCard);
    </script>
</body>
</html>
