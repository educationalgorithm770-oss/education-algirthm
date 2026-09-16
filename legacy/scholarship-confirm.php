<?php
// scholarship-confirm.php — Pre-Book Payment Confirmation & Summary Page
// Route: /scholarship-confirm
require_once __DIR__ . '/config.php';

// Server-side source of truth for calculations
$courseId = 1; // Default Java Full Stack Development
$courseTitle = "Java Full Stack Development";
$originalFee = 20000.00;
$scholarshipAmount = 5000.00;
$scholarshipPrice = $originalFee - $scholarshipAmount; // ₹15,000.00
$prebookAmount = 500.00;
$remainingAmount = $scholarshipPrice - $prebookAmount; // ₹14,500.00

$csrfToken = csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pre-Book Confirmation | Education Algorithm</title>
    <meta name="description" content="Confirm your scholarship reservation details before proceeding with the ₹500 pre-book payment.">
    <link rel="canonical" href="<?php echo APP_URL; ?>/scholarship-confirm">
    <link rel="stylesheet" href="css/java-full-stack-workshop.css?v=<?php echo time(); ?>">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        .ea-confirm-card {
            background: linear-gradient(135deg, rgba(14, 23, 46, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%);
            border: 1px solid var(--jfw-border-glow);
            border-radius: var(--jfw-radius-xl);
            padding: 2.5rem;
            max-width: 680px;
            margin: 2rem auto;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        .ea-summary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
        }
        .ea-summary-table td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid var(--jfw-border);
            font-size: 1rem;
        }
        .ea-summary-table td.val {
            text-align: right;
            font-family: var(--jfw-font-mono);
            font-weight: 700;
        }
        .ea-summary-table tr.highlight-price td {
            color: #34d399;
            font-size: 1.15rem;
            font-weight: 800;
        }
        .ea-summary-table tr.remaining-row td {
            color: var(--jfw-accent-amber);
            font-weight: 800;
        }
        .ea-ack-box {
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid var(--jfw-border-glow);
            border-radius: var(--jfw-radius-md);
            padding: 1.25rem;
            margin: 1.5rem 0;
        }
        .ea-checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 0.85rem;
            cursor: pointer;
            color: #ffffff;
            font-size: 0.95rem;
            line-height: 1.6;
            font-weight: 600;
        }
        .ea-checkbox-label input[type="checkbox"] {
            width: 20px;
            height: 20px;
            margin-top: 2px;
            accent-color: var(--jfw-primary);
            cursor: pointer;
        }
        .ea-pay-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            filter: grayscale(1);
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
                    <li><a href="scholarship" class="jfw-nav-link">Offer</a></li>
                    <li><a href="scholarship-confirm" class="jfw-nav-link active">Confirmation</a></li>
                </ul>
            </div>
        </div>
    </header>

    <!-- MAIN CONFIRMATION CONTENT -->
    <main class="jfw-section">
        <div class="jfw-container">

            <div class="ea-confirm-card">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <span class="jfw-badge">PRE-BOOK PAYMENT CONFIRMATION</span>
                    <h1 style="color: #ffffff; font-size: 2rem; margin: 0.5rem 0 0 0; font-family: var(--jfw-font-heading);">
                        SCHOLARSHIP SUMMARY
                    </h1>
                    <p style="color: var(--jfw-text-muted); font-size: 0.95rem; margin-top: 0.25rem;">
                        <?php echo htmlspecialchars($courseTitle); ?>
                    </p>
                </div>

                <!-- SERVER-CALCULATED SUMMARY TABLE -->
                <table class="ea-summary-table">
                    <tbody>
                        <tr>
                            <td style="color: var(--jfw-text-muted);">Original Course Fee:</td>
                            <td class="val" style="text-decoration: line-through; color: #94a3b8;">₹<?php echo number_format($originalFee, 2); ?></td>
                        </tr>
                        <tr>
                            <td style="color: var(--jfw-text-muted);">Scholarship Discount:</td>
                            <td class="val" style="color: #34d399;">− ₹<?php echo number_format($scholarshipAmount, 2); ?></td>
                        </tr>
                        <tr class="highlight-price">
                            <td>Final Scholarship Price:</td>
                            <td class="val">₹<?php echo number_format($scholarshipPrice, 2); ?></td>
                        </tr>
                        <tr style="background: rgba(16, 185, 129, 0.1);">
                            <td style="color: #ffffff; font-weight: 700;">Pre-Book Payment Amount:</td>
                            <td class="val" style="color: #34d399; font-size: 1.2rem;">₹<?php echo number_format($prebookAmount, 2); ?></td>
                        </tr>
                        <tr class="remaining-row">
                            <td style="color: var(--jfw-text-muted);">Remaining Course Amount:</td>
                            <td class="val">₹<?php echo number_format($remainingAmount, 2); ?></td>
                        </tr>
                    </tbody>
                </table>

                <!-- STUDENT DETAILS FORM -->
                <form id="eaPrebookForm">
                    <input type="hidden" name="csrf_token" value="<?php echo $csrfToken; ?>">
                    <input type="hidden" name="course_id" value="<?php echo $courseId; ?>">

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.88rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Full Name *</label>
                        <input type="text" id="student_name" name="name" required class="jfw-form-input" placeholder="Enter your full name..." style="width: 100%; padding: 0.75rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 8px; color: #fff;">
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.88rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Email Address *</label>
                        <input type="email" id="student_email" name="email" required class="jfw-form-input" placeholder="Enter your email address..." style="width: 100%; padding: 0.75rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 8px; color: #fff;">
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; font-size: 0.88rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Phone Number *</label>
                        <input type="tel" id="student_phone" name="phone" required class="jfw-form-input" placeholder="Enter 10-digit mobile number..." style="width: 100%; padding: 0.75rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 8px; color: #fff;">
                    </div>

                    <!-- MANDATORY ACKNOWLEDGEMENT CHECKBOX -->
                    <div class="ea-ack-box">
                        <label class="ea-checkbox-label">
                            <input type="checkbox" id="eaAckCheckbox">
                            <span>
                                I understand that this payment of <strong>₹500</strong> only holds my scholarship and does <strong>NOT</strong> confirm course enrollment.
                            </span>
                        </label>
                    </div>

                    <div id="eaFormError" style="display: none; color: #f87171; font-weight: 700; font-size: 0.9rem; margin-bottom: 1rem; text-align: center;"></div>

                    <!-- PAYMENT BUTTON (DISABLED BY DEFAULT UNTIL CHECKBOX CHECKED) -->
                    <div style="text-align: center;">
                        <button type="submit" id="eaPayBtn" class="jfw-btn jfw-btn-primary jfw-btn-large ea-pay-btn" disabled style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #10b981; border: none;">
                            HOLD MY SCHOLARSHIP — ₹500
                        </button>
                    </div>
                </form>
            </div>

        </div>
    </main>

    <!-- FOOTER -->
    <footer style="padding: 2.5rem 0; border-top: 1px solid var(--jfw-border); text-align: center; color: var(--jfw-text-subtle); font-size: 0.9rem;">
        <div class="jfw-container">
            <p>© <?php echo date('Y'); ?> Education Algorithm. All rights reserved.</p>
        </div>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('eaPrebookForm');
            const ackCheckbox = document.getElementById('eaAckCheckbox');
            const payBtn = document.getElementById('eaPayBtn');
            const errorDiv = document.getElementById('eaFormError');

            if (ackCheckbox && payBtn) {
                ackCheckbox.addEventListener('change', function() {
                    payBtn.disabled = !this.checked;
                });
            }

            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    if (!ackCheckbox.checked) {
                        errorDiv.style.display = 'block';
                        errorDiv.textContent = 'Please check the acknowledgement checkbox before proceeding.';
                        return;
                    }

                    errorDiv.style.display = 'none';
                    payBtn.disabled = true;
                    payBtn.textContent = 'INITIALIZING PAYMENT...';
                    const formData = new FormData(form);
                    const csrfVal = document.querySelector('input[name="csrf_token"]') ? document.querySelector('input[name="csrf_token"]').value : '';

                    fetch('api-scholarship-payment.php', {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': csrfVal
                        },
                        body: formData
                    })
                    .then(res => res.text().then(text => {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            return { success: false, error: text || 'Server returned an unparseable response.' };
                        }
                    }))
                    .then(data => {
                        if (!data.success) {
                            errorDiv.style.display = 'block';
                            errorDiv.textContent = data.error || 'Failed to initialize payment.';
                            payBtn.disabled = false;
                            payBtn.textContent = 'HOLD MY SCHOLARSHIP — ₹500';
                            if (data.already_exists) {
                                setTimeout(() => window.location.href = data.redirect || 'student-scholarships', 2000);
                            }
                            return;
                        }

                        if (!window.Razorpay) {
                            errorDiv.style.display = 'block';
                            errorDiv.textContent = 'Razorpay checkout script failed to load. Please check your internet connection or disable ad-blocker.';
                            payBtn.disabled = false;
                            payBtn.textContent = 'HOLD MY SCHOLARSHIP — ₹500';
                            return;
                        }

                        // Open Razorpay Checkout Modal
                        const options = {
                            key: data.key,
                            amount: data.amount,
                            currency: data.currency || 'INR',
                            name: 'Education Algorithm',
                            description: 'Scholarship Reservation (₹500 Pre-Book)',
                            order_id: data.order_id,
                            prefill: {
                                name: data.student_name,
                                email: data.student_email,
                                contact: data.student_phone
                            },
                            theme: {
                                color: '#10b981'
                            },
                            handler: function(response) {
                                payBtn.textContent = 'VERIFYING PAYMENT...';
                                window.location.href = 'verify-scholarship-payment.php?order_id=' + encodeURIComponent(response.razorpay_order_id) +
                                    '&payment_id=' + encodeURIComponent(response.razorpay_payment_id) +
                                    '&signature=' + encodeURIComponent(response.razorpay_signature);
                            },
                            modal: {
                                ondismiss: function() {
                                    payBtn.disabled = false;
                                    payBtn.textContent = 'HOLD MY SCHOLARSHIP — ₹500';
                                }
                            }
                        };

                        try {
                            const rzp = new Razorpay(options);
                            rzp.on('payment.failed', function(resp) {
                                payBtn.disabled = false;
                                payBtn.textContent = 'HOLD MY SCHOLARSHIP — ₹500';
                                errorDiv.style.display = 'block';
                                errorDiv.textContent = resp.error?.description || 'Payment rejected by bank or gateway.';
                            });
                            rzp.open();
                        } catch (err) {
                            payBtn.disabled = false;
                            payBtn.textContent = 'HOLD MY SCHOLARSHIP — ₹500';
                            errorDiv.style.display = 'block';
                            errorDiv.textContent = 'Unable to launch Razorpay popup: ' + err.message;
                        }
                    })
                    .catch(err => {
                        errorDiv.style.display = 'block';
                        errorDiv.textContent = 'An error occurred while connecting to server. Please try again.';
                        payBtn.disabled = false;
                        payBtn.textContent = 'HOLD MY SCHOLARSHIP — ₹500';
                    });
                });
            }
        });
    </script>
</body>
</html>
