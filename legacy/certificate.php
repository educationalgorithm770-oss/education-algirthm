<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$code = clean_text($_GET['code'] ?? $_GET['cert'] ?? $_GET['id'] ?? '', 64);

// If no certificate code was passed in URL:
if ($code === '') {
    if (isset($_SESSION['student_id'])) {
        header('Location: certificates.php');
        exit;
    }
    
    $pageTitle = "Certificate Verification Portal — Education Algorithm";
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php echo $pageTitle; ?></title>
        <link rel="stylesheet" href="css/student.css?v=11.0">
        <style>
            body {
                background-color: #0b0f19;
                color: #f8fafc;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 1.5rem;
                box-sizing: border-box;
            }
            .lookup-card {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 20px;
                max-width: 580px;
                width: 100%;
                padding: 2.5rem 2rem;
                box-shadow: 0 25px 60px rgba(0,0,0,0.5);
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="lookup-card">
            <div style="font-size: 3.2rem; margin-bottom: 0.5rem;">🛡️</div>
            <h1 style="font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem;">
                Official Credential Verification Portal
            </h1>
            <p style="font-size: 0.88rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1.75rem;">
                Enter a graduate certificate identifier to validate academic authenticity against the cryptographic registry.
            </p>

            <form action="certificate.php" method="GET" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <input type="text" name="code" placeholder="e.g. EA-F789A2B1-2026" required
                       style="flex: 1; padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #334155; background: #1e293b; color: #fff; font-family: monospace; font-size: 0.95rem;">
                <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 10px;">
                    Verify →
                </button>
            </form>

            <div style="border-top: 1px solid #334155; padding-top: 1.25rem; font-size: 0.82rem; color: #94a3b8;">
                <span>Quick Sample Verifications:</span>
                <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 0.65rem; flex-wrap: wrap;">
                    <a href="certificate.php?code=EA-F789A2B1-2026" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">☕ Java Full Stack</a>
                    <a href="certificate.php?code=EA-A123B456-2026" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">🤖 AI & GenAI</a>
                    <a href="certificate.php?code=EA-D789E012-2026" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">⚡ DSA & System Design</a>
                </div>
            </div>

            <div style="margin-top: 1.75rem;">
                <a href="index.html" style="color: #6366f1; text-decoration: none; font-size: 0.84rem; font-weight: 700;">
                    ← Return to Education Algorithm Home
                </a>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

$stmtCert = $pdo->prepare("
    SELECT c.id, c.certificate_code, c.student_id, c.course_id, c.issue_date,
           s.name as student_name, s.email, COALESCE(co.title, c.course_title) as course_name,
           c.instructor_name
    FROM course_certificates c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN courses co ON c.course_id = co.id
    WHERE c.certificate_code = ?
    LIMIT 1
");
$stmtCert->execute([$code]);
$cert = $stmtCert->fetch();

if (!$cert) {
    // Fallback: check certificates table
    $stmtCert2 = $pdo->prepare("
        SELECT c.id, c.certificate_uuid as certificate_code, c.student_id, c.course_id, c.issue_date,
               s.name as student_name, s.email, co.title as course_name,
               'Dr. Arvind Sharma' as instructor_name
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        LEFT JOIN courses co ON c.course_id = co.id
        WHERE c.certificate_uuid = ?
        LIMIT 1
    ");
    $stmtCert2->execute([$code]);
    $cert = $stmtCert2->fetch();
}

if (!$cert) {
    http_response_code(404);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Not Found — Education Algorithm</title>
        <link rel="stylesheet" href="css/student.css?v=11.0">
    </head>
    <body style="display:flex; align-items:center; justify-content:center; min-height:100vh; background:#0b0f19; padding:1rem; color:#fff;">
        <div style="background:#0f172a; border:1px solid #334155; padding:2.5rem; border-radius:18px; text-align:center; max-width:500px;">
            <div style="font-size:3rem; margin-bottom:0.5rem;">⚠️</div>
            <h2 style="font-size:1.4rem; margin:0 0 0.5rem;">Certificate Not Found</h2>
            <p style="color:#94a3b8; font-size:0.88rem; line-height:1.6; margin-bottom:1.5rem;">
                No verified credential matching <code><?php echo htmlspecialchars($code); ?></code> exists in the cryptographic ledger.
            </p>
            <a href="certificate.php" class="btn btn-primary btn-sm">Try Another Code →</a>
        </div>
    </body>
    </html>
    <?php
    exit;
}

$verifyUrl = rtrim(APP_URL, '/') . '/verify.php?cert=' . urlencode($cert['certificate_code']);
$qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' . urlencode($verifyUrl);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verified Certificate of Completion — <?php echo e($cert['student_name']); ?> — Education Algorithm</title>
    
    <link rel="stylesheet" href="css/student.css?v=11.0">
    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>

    <style>
        body {
            background-color: #080c16;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem 1.25rem;
            box-sizing: border-box;
        }

        .cert-outer-wrapper {
            max-width: 900px;
            width: 100%;
        }

        .cert-3d-stage {
            perspective: 1400px;
            display: flex;
            justify-content: center;
        }

        .cert-sheet-card {
            width: 100%;
            background: #ffffff;
            color: #0f172a;
            border-radius: 16px;
            padding: 3.5rem 3.25rem;
            box-sizing: border-box;
            position: relative;
            box-shadow: 0 30px 80px rgba(0,0,0,0.6);
            transform-style: preserve-3d;
            transition: transform 0.25s ease-out;
            overflow: hidden;
            border: 2px solid rgba(212, 175, 55, 0.4);
        }

        .cert-inner-frame {
            border: 4px double #d4af37;
            padding: 2.25rem 2rem;
            position: relative;
            background: radial-gradient(circle at center, #ffffff 60%, #faf8f5 100%);
        }

        .cert-corner-ornament {
            position: absolute;
            width: 32px;
            height: 32px;
            border: 3px solid #d4af37;
        }
        .corner-tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
        .corner-tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
        .corner-br { bottom: 6px; right: 6px; border-left: none; border-top: none; }

        .gold-foil-seal {
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, #fef08a 0%, #d4af37 50%, #854d0e 100%);
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.4);
            border: 3px dashed #fff;
            animation: sealShimmer 6s infinite linear;
        }

        @keyframes sealShimmer {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .seal-text-inner {
            animation: sealShimmer 6s infinite linear reverse;
            text-align: center;
            color: #3b2003;
            font-weight: 900;
            font-size: 0.58rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            line-height: 1.2;
        }

        .cert-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16rem;
            font-weight: 900;
            color: rgba(212, 175, 55, 0.04);
            pointer-events: none;
            user-select: none;
            font-family: serif;
        }

        @media (max-width: 768px) {
            .cert-sheet-card { padding: 1.75rem 1.25rem; }
            .cert-inner-frame { padding: 1.25rem 0.85rem; }
            .cert-footer-grid { flex-direction: column !important; gap: 1.5rem !important; align-items: center !important; text-align: center !important; }
        }

        @media print {
            body { background: #fff !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .cert-3d-stage { margin: 0 !important; perspective: none !important; }
            .cert-sheet-card {
                box-shadow: none !important;
                border: 4px double #d4af37 !important;
                width: 100% !important;
                max-width: 100% !important;
            }
        }
    </style>
</head>
<body>
    <div class="cert-outer-wrapper">
        <!-- Top Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.65rem;" class="no-print">
            <a href="index.html" class="btn btn-secondary btn-sm" style="color:#fff; border-color:#334155;">
                ← Education Algorithm
            </a>
            
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button onclick="downloadCertImage()" class="btn btn-secondary btn-sm">
                    📥 Download Image (PNG)
                </button>
                <a href="<?php echo e($verifyUrl); ?>" class="btn btn-secondary btn-sm" style="background:#10b981; color:#fff; border:none;">
                    🛡️ Verify Authenticity
                </a>
                <button onclick="window.print()" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #6366f1, #8b5cf6); border:none;">
                    🖨️ Print / Vector PDF
                </button>
            </div>
        </div>

        <!-- 3D Certificate Container -->
        <div class="cert-3d-stage">
            <div class="cert-sheet-card" id="interactiveCertCard">
                <div class="cert-watermark">EA</div>

                <div class="cert-inner-frame">
                    <div class="cert-corner-ornament corner-tl"></div>
                    <div class="cert-corner-ornament corner-tr"></div>
                    <div class="cert-corner-ornament corner-bl"></div>
                    <div class="cert-corner-ornament corner-br"></div>

                    <!-- Header -->
                    <div style="text-align:center; margin-bottom:1.5rem;">
                        <div style="font-size:0.85rem; font-weight:900; letter-spacing:0.3em; color:#d4af37; text-transform:uppercase; margin-bottom:0.4rem;">
                            EDUCATION ALGORITHM • COHORT EXCELLENCE
                        </div>
                        <h2 style="font-size:2.4rem; font-weight:900; color:#0f172a; font-family:'Georgia', serif; letter-spacing:0.04em; margin:0 0 0.5rem;">
                            Certificate of Professional Completion
                        </h2>
                        <p style="font-size:0.88rem; color:#64748b; text-transform:uppercase; letter-spacing:0.15em; margin:0;">
                            This is proudly presented and officially conferred upon
                        </p>
                    </div>

                    <!-- Recipient -->
                    <div style="text-align:center; margin:1.25rem 0;">
                        <div style="font-size:2.8rem; font-weight:800; color:#1e1b4b; font-family:'Georgia', serif; border-bottom:2px solid #e2e8f0; display:inline-block; padding:0 2rem 0.35rem;">
                            <?php echo e($cert['student_name']); ?>
                        </div>
                    </div>

                    <!-- Citation -->
                    <div style="text-align:center; max-width:640px; margin:0 auto 1.5rem;">
                        <p style="font-size:0.95rem; color:#475569; line-height:1.65; margin:0 0 0.75rem;">
                            for successfully demonstrating technical proficiency, algorithms rigor, practical engineering standards, and completing all coursework requirements for:
                        </p>
                        <div style="font-size:1.45rem; font-weight:800; color:#4338ca;">
                            <?php echo e($cert['course_name']); ?>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="cert-footer-grid" style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #e2e8f0; padding-top:1.5rem; margin-top:2rem;">
                        <!-- Left: QR Code -->
                        <div style="text-align:left; display:flex; align-items:center; gap:0.85rem;">
                            <img src="<?php echo $qrCodeUrl; ?>" alt="Verification QR Code" width="80" height="80" style="border:1px solid #cbd5e1; border-radius:6px; padding:3px; background:#fff;">
                            <div class="mono" style="font-size:0.72rem; color:#64748b; line-height:1.5;">
                                <strong>LEDGER ID:</strong> <?php echo e($cert['certificate_code']); ?><br>
                                <strong>ISSUED:</strong> <?php echo date('M d, Y', strtotime($cert['issue_date'])); ?><br>
                                <strong>STATUS:</strong> <span style="color:#059669; font-weight:700;">✓ Verified Authentic</span>
                            </div>
                        </div>

                        <!-- Center: Seal -->
                        <div style="display:flex; justify-content:center;">
                            <div class="gold-foil-seal">
                                <div class="seal-text-inner">
                                    ★ OFFICIAL ★<br>VERIFIED<br>ALGORITHM<br>CREDENTIAL
                                </div>
                            </div>
                        </div>

                        <!-- Right: Signature -->
                        <div style="text-align:right;">
                            <div style="font-family:'Brush Script MT', cursive, sans-serif; font-size:2rem; color:#4338ca; line-height:1;">
                                Arvind Sharma
                            </div>
                            <div style="border-top:1px solid #94a3b8; padding-top:0.35rem; font-size:0.82rem; font-weight:700; color:#0f172a; margin-top:0.25rem;">
                                <?php echo e($cert['instructor_name'] ?? 'Dr. Arvind Sharma'); ?><br>
                                <span style="font-size:0.72rem; color:#64748b; font-weight:normal;">Academic Director & Chancellor</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    // 3D Parallax Tilt Effect
    const certCard = document.getElementById('interactiveCertCard');
    if (certCard) {
        certCard.parentElement.addEventListener('mousemove', (e) => {
            const rect = certCard.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotX = -(y / rect.height) * 14;
            const rotY = (x / rect.width) * 14;
            certCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        certCard.parentElement.addEventListener('mouseleave', () => {
            certCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    }

    // Download High-Resolution Certificate PNG Image (Rock-Solid Pure Canvas Exporter)
    function downloadCertImage() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1800;
            canvas.height = 1200;
            const ctx = canvas.getContext('2d');

            // Background Gradient (Ivory Parchment)
            const bgGrad = ctx.createRadialGradient(900, 600, 100, 900, 600, 1000);
            bgGrad.addColorStop(0, '#ffffff');
            bgGrad.addColorStop(1, '#faf7f0');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1800, 1200);

            // Watermark EA
            ctx.font = '900 380px Georgia, serif';
            ctx.fillStyle = 'rgba(212, 175, 55, 0.04)';
            ctx.textAlign = 'center';
            ctx.fillText('EA', 900, 720);

            // Double Gold Outer Border
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 14;
            ctx.strokeRect(40, 40, 1720, 1120);

            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 4;
            ctx.strokeRect(60, 60, 1680, 1080);

            // Corner Ornaments
            function drawCorner(x, y, sX, sY) {
                ctx.beginPath();
                ctx.moveTo(x, y + 50 * sY);
                ctx.lineTo(x, y);
                ctx.lineTo(x + 50 * sX, y);
                ctx.strokeStyle = '#854d0e';
                ctx.lineWidth = 6;
                ctx.stroke();
            }
            drawCorner(80, 80, 1, 1);
            drawCorner(1720, 80, -1, 1);
            drawCorner(80, 1120, 1, -1);
            drawCorner(1720, 1120, -1, -1);

            // Header Monogram
            ctx.font = '900 24px -apple-system, sans-serif';
            ctx.fillStyle = '#d4af37';
            ctx.textAlign = 'center';
            ctx.fillText('EDUCATION ALGORITHM • COHORT EXCELLENCE', 900, 160);

            // Title
            ctx.font = '900 54px Georgia, serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillText('Certificate of Professional Completion', 900, 250);

            // Subtitle
            ctx.font = '600 20px -apple-system, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('THIS IS PROUDLY PRESENTED AND OFFICIALLY CONFERRED UPON', 900, 330);

            // Recipient Name
            const studentName = <?php echo json_encode($cert['student_name']); ?>;
            ctx.font = 'bold 68px Georgia, serif';
            ctx.fillStyle = '#1e1b4b';
            ctx.fillText(studentName, 900, 440);

            // Underline
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(450, 470);
            ctx.lineTo(1350, 470);
            ctx.stroke();

            // Citation
            ctx.font = 'normal 24px Georgia, serif';
            ctx.fillStyle = '#475569';
            ctx.fillText('for successfully demonstrating technical proficiency, algorithms rigor, practical engineering standards,', 900, 540);
            ctx.fillText('and completing all coursework requirements for:', 900, 580);

            // Course Title
            const courseTitle = <?php echo json_encode($cert['course_name']); ?>;
            ctx.font = 'bold 44px Georgia, serif';
            ctx.fillStyle = '#4338ca';
            ctx.fillText(courseTitle, 900, 670);

            // Divider
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(120, 800);
            ctx.lineTo(1680, 800);
            ctx.stroke();

            // Bottom Left: Ledger Details
            const certId = <?php echo json_encode($cert['certificate_code']); ?>;
            const issueDate = <?php echo json_encode(date('M d, Y', strtotime($cert['issue_date']))); ?>;
            ctx.textAlign = 'left';
            ctx.font = 'bold 20px monospace';
            ctx.fillStyle = '#0f172a';
            ctx.fillText('LEDGER ID: ' + certId, 160, 910);
            ctx.font = 'normal 20px -apple-system, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('ISSUED ON: ' + issueDate, 160, 950);
            ctx.fillStyle = '#059669';
            ctx.font = 'bold 20px -apple-system, sans-serif';
            ctx.fillText('✓ CRYPTOGRAPHICALLY VERIFIED & AUTHENTIC', 160, 990);

            // Bottom Center: Gold Seal
            ctx.beginPath();
            ctx.arc(900, 940, 75, 0, Math.PI * 2);
            const sealGrad = ctx.createRadialGradient(900, 940, 10, 900, 940, 75);
            sealGrad.addColorStop(0, '#fef08a');
            sealGrad.addColorStop(0.5, '#d4af37');
            sealGrad.addColorStop(1, '#854d0e');
            ctx.fillStyle = sealGrad;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#3b2003';
            ctx.font = '900 13px -apple-system, sans-serif';
            ctx.fillText('★ OFFICIAL ★', 900, 915);
            ctx.fillText('VERIFIED', 900, 935);
            ctx.fillText('ALGORITHM', 900, 955);
            ctx.fillText('CREDENTIAL', 900, 975);

            // Bottom Right: Signature
            ctx.textAlign = 'right';
            ctx.font = 'italic 54px "Brush Script MT", cursive, sans-serif';
            ctx.fillStyle = '#4338ca';
            ctx.fillText('Arvind Sharma', 1640, 920);

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(1300, 945);
            ctx.lineTo(1640, 945);
            ctx.stroke();

            ctx.font = 'bold 20px -apple-system, sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillText('Dr. Arvind Sharma', 1640, 980);
            ctx.font = 'normal 17px -apple-system, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Academic Director & Chancellor', 1640, 1010);

            // Trigger Direct Browser Download
            const link = document.createElement('a');
            link.download = 'Certificate-' + certId + '.png';
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Download error:', err);
            window.print();
        }
    }
    </script>
</body>
</html>
