/**
 * Transactional Email Dispatcher for Education Algorithm
 * Handles OTP verification and Admission receipts
 */

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendTransactionalEmail({
  to,
  toName,
  subject,
  html,
  text,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.SMTP_PASS; // SendGrid API key
  const fromEmail = process.env.SMTP_FROM || 'educationalgorithm770@gmail.com';
  const fromName = process.env.SMTP_FROM_NAME || 'Education Algorithm Admissions';

  console.log(`[email.ts] Dispatching email to: ${to} | Subject: "${subject}"`);

  if (!apiKey || apiKey.length < 10) {
    console.warn(`[email.ts] ℹ️ SendGrid API Key not configured. Email to ${to} simulated in local dev.`);
    return { success: true, messageId: `sim_${Date.now()}` };
  }

  try {
    const payload = {
      personalizations: [
        {
          to: [{ email: to, name: toName || to.split('@')[0] }],
          subject,
        },
      ],
      from: { email: fromEmail, name: fromName },
      content: [
        ...(text ? [{ type: 'text/plain', value: text }] : [{ type: 'text/plain', value: subject }]),
        {
          type: 'text/html',
          value: html,
        },
      ],
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 202 || res.status === 200) {
      console.log(`[email.ts] ✅ SendGrid accepted email for ${to}`);
      return { success: true, messageId: res.headers.get('x-message-id') || `sg_${Date.now()}` };
    }

    const errBody = await res.text();
    console.warn(`[email.ts] ⚠️ SendGrid responded with status ${res.status}:`, errBody);

    // In local development, gracefully fall back so developers and test flows are never blocked
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_OTP_FALLBACK === 'true') {
      console.log(`[email.ts] 🛠️ [DEV FALLBACK] SendGrid ${res.status} bypassed locally. Simulated delivery successful.`);
      return { success: true, messageId: `dev_fallback_${Date.now()}` };
    }

    return { success: false, error: errBody };
  } catch (err: any) {
    console.error('[email.ts] ⚠️ Network error sending email:', err);
    if (process.env.NODE_ENV !== 'production') {
      return { success: true, messageId: `dev_err_fallback_${Date.now()}` };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Send 6-Digit Email Verification Code (OTP)
 */
export async function sendOtpEmail(toEmail: string, toName: string, otpCode: string): Promise<boolean> {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ 🔐 [ADMISSIONS OTP DISPATCH]                                             ║
║ To:      ${toEmail.padEnd(55)} ║
║ Name:    ${(toName || 'Student').padEnd(55)} ║
║ OTP:     ${otpCode.padEnd(55)} ║
║ Expires: 10 minutes                                                      ║
╚══════════════════════════════════════════════════════════════════════════╝
  `);

  const subject = `Your Verification Code: ${otpCode} — Education Algorithm Admissions`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header span { color: #6366f1; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
          .otp-card { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; text-align: center; padding: 20px; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4338ca; margin: 0; font-family: monospace; }
          .otp-note { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Education <span>Algorithm</span></h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Cohort Admissions Desk</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
            <p>Hello <strong>${toName || 'Student'}</strong>,</p>
            <p>Thank you for initiating your enrollment with Education Algorithm. Please use the following 6-digit verification code to confirm your email and proceed to cohort registration:</p>
            
            <div class="otp-card">
              <div class="otp-code">${otpCode}</div>
              <div class="otp-note">⏱️ Code expires in 10 minutes &bull; Single-use security token</div>
            </div>

            <p style="font-size: 13px; color: #64748b;">If you did not initiate this enrollment request, please disregard this email. Never share this code with anyone.</p>
          </div>
          <div class="footer">
            &copy; 2026 Education Algorithm Inc. &bull; Enterprise Software Engineering Accelerator<br>
            Chennai, Tamil Nadu, India &bull; support@educationalgorithm.com
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hello ${toName || 'Student'},\n\nYour Education Algorithm email verification code is: ${otpCode}\n\nThis code expires in 10 minutes. Do not share this code.\n\nEducation Algorithm Admissions Desk`;
  const result = await sendTransactionalEmail({ to: toEmail, toName, subject, html, text });
  return result.success;
}

/**
 * Send Password Reset OTP Email
 */
export async function sendPasswordResetEmail(toEmail: string, toName: string, otpCode: string): Promise<boolean> {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ 🔑 [PASSWORD RESET OTP DISPATCH]                                         ║
║ To:      ${toEmail.padEnd(55)} ║
║ Name:    ${(toName || 'User').padEnd(55)} ║
║ OTP:     ${otpCode.padEnd(55)} ║
║ Expires: 10 minutes                                                      ║
╚══════════════════════════════════════════════════════════════════════════╝
  `);

  const subject = `Your Password Reset Code: ${otpCode} — Education Algorithm`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header span { color: #6366f1; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
          .otp-card { background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; text-align: center; padding: 20px; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4338ca; margin: 0; font-family: monospace; }
          .otp-note { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Education <span>Algorithm</span></h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Account Security &amp; Access</p>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
            <p>Hello <strong>${toName || 'User'}</strong>,</p>
            <p>We received a request to reset the password for your Education Algorithm account. Please use the following 6-digit security code to verify your identity and set a new password:</p>
            
            <div class="otp-card">
              <div class="otp-code">${otpCode}</div>
              <div class="otp-note">⏱️ Code expires in 10 minutes &bull; Do not share with anyone</div>
            </div>

            <p style="font-size: 13px; color: #64748b;">If you did not request a password reset, you can safely ignore this email. Your current password remains secure.</p>
          </div>
          <div class="footer">
            &copy; 2026 Education Algorithm Inc. &bull; Enterprise Software Engineering Accelerator<br>
            support@educationalgorithm.com
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hello ${toName || 'User'},\n\nYour Education Algorithm password reset code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`;
  const result = await sendTransactionalEmail({ to: toEmail, toName, subject, html, text });
  return result.success;
}

/**
 * Send Enrollment Confirmation & LMS Credentials Receipt
 */
export async function sendEnrollmentConfirmationEmail(
  toEmail: string,
  toName: string,
  courseTitle: string,
  enrollmentCode: string,
  amount: number,
  batchName: string = 'Fall 2026 Live Cohort'
): Promise<boolean> {
  console.log(`\n==========================================================`);
  console.log(`🎉 [ADMISSIONS ENROLLMENT CONFIRMATION]`);
  console.log(`   To: ${toEmail} (${toName})`);
  console.log(`   Course: ${courseTitle}`);
  console.log(`   Enrollment Code: ${enrollmentCode}`);
  console.log(`   Tuition Paid: ₹${amount}`);
  console.log(`==========================================================\n`);

  const subject = `🎉 Enrollment Confirmed: ${courseTitle} (${enrollmentCode})`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 32px; text-align: center; color: #ffffff; }
          .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
          .badge { display: inline-block; padding: 4px 12px; background: #10b98120; color: #059669; border: 1px solid #10b98140; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
          .receipt-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .row:last-child { border-bottom: none; font-weight: 800; font-size: 16px; color: #4338ca; padding-top: 12px; }
          .btn { display: inline-block; padding: 14px 28px; background: #4f46e5; color: #ffffff !important; border-radius: 10px; font-weight: 800; text-decoration: none; text-align: center; margin: 20px 0 10px 0; font-size: 14px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px;">Education <span style="color: #6366f1;">Algorithm</span></h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Official Admission Receipt &bull; Fall 2026</p>
          </div>
          <div class="content">
            <div style="text-align: center;">
              <span class="badge">✓ Admission Confirmed</span>
              <h2 style="font-size: 20px; color: #0f172a; margin: 0 0 8px 0;">Welcome to Education Algorithm!</h2>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Your live cohort seat is secured. Student LMS credentials are active.</p>
            </div>

            <div class="receipt-box">
              <div class="row">
                <span style="color: #64748b;">Enrollment ID:</span>
                <strong style="color: #0f172a;">${enrollmentCode}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Student Name:</span>
                <strong style="color: #0f172a;">${toName}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Registered Email:</span>
                <strong style="color: #0f172a;">${toEmail}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Course Track:</span>
                <strong style="color: #0f172a;">${courseTitle}</strong>
              </div>
              <div class="row">
                <span style="color: #64748b;">Cohort Batch:</span>
                <strong style="color: #0f172a;">${batchName}</strong>
              </div>
              <div class="row">
                <span>Tuition Paid:</span>
                <span>₹${amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="https://educationalgorithm.com/dashboard" class="btn">Launch Student LMS Dashboard &rarr;</a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
              You can log into your Student Portal anytime at <a href="https://educationalgorithm.com/login" style="color: #4f46e5;">educationalgorithm.com/login</a> using your registered email address.
            </p>
          </div>
          <div class="footer">
            Education Algorithm Admissions &bull; Official Student Receipt &bull; ${new Date().toLocaleDateString('en-IN')}<br>
            All live cohort sessions include 1-on-1 SDE Mentorship, Code Arena Docker Sandboxes, and Verified Enterprise Certificates.
          </div>
        </div>
      </body>
    </html>
  `;

  return (await sendTransactionalEmail({ to: toEmail, toName, subject, html })).success;
}
