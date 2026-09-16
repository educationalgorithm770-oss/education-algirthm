<?php
// scholarship.php — Webinar Scholarship Offer Page
// Route: /scholarship
require_once __DIR__ . '/config.php';

// Server-side source of truth for course & scholarship calculations (Java Full Stack Program)
$courseTitle = "Java Full Stack Development";
$originalFee = 20000.00;
$scholarshipAmount = 5000.00;
$scholarshipPrice = $originalFee - $scholarshipAmount; // ₹15,000.00
$prebookAmount = 500.00;
$remainingAmount = $scholarshipPrice - $prebookAmount; // ₹14,500.00
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webinar Scholarship Offer | Education Algorithm</title>
    <meta name="description" content="Exclusive Webinar Scholarship for Java Full Stack Development Program. Reserve your scholarship for ₹500.">
    <link rel="canonical" href="<?php echo APP_URL; ?>/scholarship">
    <link rel="stylesheet" href="css/java-full-stack-workshop.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
    <style>
        .ea-scholarship-card {
            background: linear-gradient(135deg, rgba(14, 23, 46, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%);
            border: 1px solid var(--jfw-border-glow);
            border-radius: var(--jfw-radius-xl);
            padding: 2.5rem;
            max-width: 680px;
            margin: 2rem auto;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        .ea-fee-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.85rem 0;
            border-bottom: 1px solid var(--jfw-border);
            font-size: 1.05rem;
        }
        .ea-fee-row.total-row {
            border-bottom: 2px solid var(--jfw-accent-cyan);
            font-weight: 800;
            font-size: 1.25rem;
            color: #ffffff;
            margin-top: 0.5rem;
        }
        .ea-fee-row .strike-price {
            text-decoration: line-through;
            color: #94a3b8;
        }
        .ea-fee-row .discount-badge {
            color: #34d399;
            font-weight: 700;
        }
        .ea-disclaimer-box {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: var(--jfw-radius-md);
            padding: 1.25rem;
            margin: 1.5rem 0;
            font-size: 0.92rem;
            color: #fef08a;
            line-height: 1.6;
        }
    </style>
</head>
<body class="jfw-workshop">

    <!-- GLOBAL NAVBAR -->
    <header class="jfw-header">
        <div class="jfw-container">
            <div class="jfw-header-inner">
                <a href="<?php echo APP_URL; ?>/" class="jfw-brand-logo">
                    <svg class="ea-logo" width="34" height="34" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Education Algorithm"><g class="ea-g"><path class="ea-base" d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/><g class="ea-capg"><path class="ea-cap" d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="currentColor"/></g><g class="ea-tas"><path d="M41.6 17.8v8.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="41.6" cy="30.2" r="3.2" fill="currentColor"/></g></g></svg>
                    <span>Education Algorithm</span>
                    <span class="jfw-brand-badge">EDTECH</span>
                </a>

                <ul class="jfw-nav-links">
                    <li><a href="java-full-stack-workshop/day-1" class="jfw-nav-link">Day 1 (Java)</a></li>
                    <li><a href="java-full-stack-workshop/day-2" class="jfw-nav-link">Day 2 (Web)</a></li>
                    <li><a href="java-full-stack-roadmap" class="jfw-nav-link">Curriculum Roadmap</a></li>
                    <li><a href="scholarship" class="jfw-nav-link active">Scholarship</a></li>
                </ul>

                <div>
                    <a href="scholarship-confirm" class="jfw-btn jfw-btn-primary" style="padding: 0.6rem 1.25rem; font-size: 0.88rem;">
                        HOLD SCHOLARSHIP — ₹500
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- MAIN SCHOLARSHIP OFFER CONTENT -->
    <main class="jfw-section" style="min-height: 80vh; display: flex; align-items: center;">
        <div class="jfw-container">
            
            <div class="ea-scholarship-card">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <span class="jfw-badge" style="background: rgba(16, 185, 129, 0.15); border-color: #34d399; color: #34d399; margin-bottom: 0.75rem;">
                        🎓 WEBINAR SCHOLARSHIP
                    </span>
                    <h1 style="color: #ffffff; font-size: 2.2rem; margin: 0.5rem 0; font-family: var(--jfw-font-heading);">
                        <?php echo htmlspecialchars($courseTitle); ?>
                    </h1>
                    <p style="color: var(--jfw-text-muted); font-size: 1rem; margin: 0;">
                        Exclusive webinar scholarship offer for attendees.
                    </p>
                </div>

                <!-- PRICING BREAKDOWN TABLE -->
                <div style="margin: 1.5rem 0;">
                    <div class="ea-fee-row">
                        <span style="color: var(--jfw-text-muted);">Original Course Fee:</span>
                        <span class="strike-price">₹<?php echo number_format($originalFee, 0); ?></span>
                    </div>

                    <div class="ea-fee-row">
                        <span style="color: var(--jfw-text-muted);">Webinar Scholarship:</span>
                        <span class="discount-badge">− ₹<?php echo number_format($scholarshipAmount, 0); ?></span>
                    </div>

                    <div class="ea-fee-row total-row">
                        <span>Scholarship Price:</span>
                        <span style="color: #34d399;">₹<?php echo number_format($scholarshipPrice, 0); ?></span>
                    </div>
                </div>

                <!-- SCHOLARSHIP HOLD CARD SECTION -->
                <div style="background: #040712; border: 1px solid var(--jfw-border); border-radius: var(--jfw-radius-lg); padding: 1.5rem; margin-top: 1.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                        <strong style="color: #ffffff; font-size: 1.1rem;">🔒 HOLD MY SCHOLARSHIP</strong>
                        <span class="jfw-mono" style="color: var(--jfw-accent-cyan); font-weight: 800; font-size: 1.2rem;">Pre-book: ₹<?php echo number_format($prebookAmount, 0); ?></span>
                    </div>

                    <div class="ea-disclaimer-box">
                        ⚠️ <strong>IMPORTANT NOTICE:</strong><br>
                        Your pre-book payment of <strong>₹<?php echo number_format($prebookAmount, 0); ?></strong> reserves the scholarship. It does <strong>NOT</strong> confirm course enrollment.
                    </div>

                    <div style="text-align: center; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <a href="scholarship-confirm" class="jfw-btn jfw-btn-primary jfw-btn-large" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #10b981; border: none;">
                            HOLD MY SCHOLARSHIP — ₹500
                        </a>
                        <a href="enroll?coupon=STUDENT" class="jfw-btn jfw-btn-secondary" style="width: 100%; padding: 0.75rem; font-size: 0.95rem; border: 1px solid #10b981; color: #34d399; text-decoration: none; text-align: center; border-radius: var(--jfw-radius-md); font-weight: 700; display: inline-block;">
                            FULL COHORT ENROLLMENT (₹15,000) →
                        </a>
                        <a href="java-full-stack-roadmap" class="jfw-btn jfw-btn-secondary" style="width: 100%; padding: 0.75rem; font-size: 0.95rem; border: 1px solid #3b82f6; color: #60a5fa; text-decoration: none; text-align: center; border-radius: var(--jfw-radius-md); font-weight: 700; display: inline-block;">
                            EXPLORE FULL CURRICULUM ROADMAP →
                        </a>
                    </div>
                </div>

            </div>

        </div>
    </main>

    <!-- FOOTER -->
    <footer style="padding: 2.5rem 0; border-top: 1px solid var(--jfw-border); text-align: center; color: var(--jfw-text-subtle); font-size: 0.9rem;">
        <div class="jfw-container">
            <p>© <?php echo date('Y'); ?> Education Algorithm. All rights reserved.</p>
        </div>
    </footer>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
