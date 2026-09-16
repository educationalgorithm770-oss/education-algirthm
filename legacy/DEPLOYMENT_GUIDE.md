# 🚀 Education Algorithm — Production Deployment Guide

This guide details the complete, reproducible steps to deploy the **Education Algorithm LMS** platform to production.

---

## 📋 System Requirements
* **PHP**: 8.1 or higher (with `pdo_mysql`, `curl`, `mbstring`, `openssl`, `fileinfo` extensions)
* **Web Server**: Apache 2.4+ (with `mod_rewrite` enabled) or Nginx
* **Database**: MySQL 8.0+ or MariaDB 10.5+ (InnoDB engine, utf8mb4)
* **Storage / CDN**: Bunny CDN Video Stream Account & Storage Zone

---

## 🛠️ Step 1: Database Setup
1. Create a fresh MySQL database:
   ```sql
   CREATE DATABASE education_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Import the monolithic master schema:
   ```bash
   mysql -u <db_user> -p education_prod < schema.sql
   ```

---

## ⚙️ Step 2: Environment Configuration (`.env`)
Create a `.env` file in the root directory:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://educationalgorithm.com

DB_HOST=127.0.0.1
DB_NAME=education_prod
DB_USER=education_user
DB_PASS=YourSecurePassword123!

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=YourRazorpaySecretHere
RAZORPAY_WEBHOOK_SECRET=YourRazorpayWebhookSecretHere

BUNNY_API_KEY=YourBunnyApiKey
BUNNY_LIBRARY_ID=YourBunnyLibraryId

GOOGLE_CLIENT_ID=YourGoogleClientId.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YourGoogleClientSecret

CRON_SECRET_KEY=EA_SECURE_CRON_2026_9x!KEY

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YourSmtpKey
SMTP_FROM=support@educationalgorithm.com
SMTP_FROM_NAME="Education Algorithm"
```

---

## 💳 Step 3: Razorpay Webhook Configuration
1. Go to **Razorpay Dashboard ➔ Settings ➔ Webhooks ➔ Add New Webhook**.
2. **Webhook URL**: `https://educationalgorithm.com/api-enrollment.php?action=razorpay_webhook`
3. **Secret**: Must match `RAZORPAY_WEBHOOK_SECRET` in `.env`.
4. **Active Events**:
   * `payment.captured`
   * `order.paid`

---

## ⏰ Step 4: Automated Backups & Maintenance Cron
Set up a daily cron job at midnight:
```bash
0 0 * * * /usr/bin/php /var/www/education-algorithm/backup-db.php > /dev/null 2>&1
```
*Backups are automatically rotated with a 7-day retention policy.*

---

## 🔐 Initial Administrative & Faculty Setup
Production deployments must not use predictable default credentials. Create administrator and instructor accounts with unique, high-entropy passwords through the approved setup process, store bootstrap secrets outside source control, and force password rotation before first production use.

---

## 🧱 Secure Code Runner Deployment
The LMS must call the dedicated runner through `CODE_RUNNER_URL` and `CODE_RUNNER_TOKEN`; there is no LMS-side execution fallback. Deploy the runner with:

```bash
docker compose -f docker-compose.code-runner.yml up -d --build
```

The runner is configured with no network, 128 MB memory, 0.5 CPU, 64 PID maximum, read-only filesystem, `/tmp` tmpfs, dropped capabilities, and `no-new-privileges`. Do not publish the runner publicly; place it on an internal network/host route appropriate to your deployment architecture.

## ⏰ Backup Cron
Run backups locally through PHP CLI. Do not put secrets in URLs:

```bash
0 0 * * * /usr/bin/php /var/www/education-algorithm/backup-db.php > /dev/null 2>&1
```


## Code Runner networking

The Code Runner API is not exposed publicly. For an XAMPP/LMS process running on the same host, set `CODE_RUNNER_URL=http://127.0.0.1:8088`. In a containerized LMS deployment, connect the LMS and runner through a private internal network and use the runner service name instead. Student execution isolation must be enforced by the execution worker/container itself; do not expose an unrestricted host execution fallback.
