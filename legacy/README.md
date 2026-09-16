# 🎓 Education Algorithm — Enterprise EdTech & LMS Platform

An enterprise-grade LMS built for software engineering cohorts, featuring an air-gapped Faculty OS, AI Quiz Synthesizer, 3-mode Bunny CDN video streaming, live student masterclasses, and code challenge grading.

---

## ⚡ Quick Start & Deployment

### 1. Database Setup
Create your MySQL/MariaDB database and import the monolithic schema:
```bash
mysql -u root -p -e "CREATE DATABASE education_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p education_local < schema.sql
```

### 2. Environment Configuration (`.env`)
Create a `.env` file in the root folder with your environment settings:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://educationalgorithm.com

DB_HOST=127.0.0.1
DB_NAME=education_local
DB_USER=root
DB_PASS=

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=YourSecret
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecret

CRON_SECRET_KEY=generate-a-random-secret-if-needed-by-other-internal-jobs
```

---

## 🔐 Initial Administrative & Faculty Setup
No production default passwords are provided. Create unique administrator and instructor credentials during deployment and force password setup/change before normal access.

---

## 🛡️ Security & Architecture Features
* **Zero-Admin Air-Gap**: Faculty accounts have zero access to administrative files.
* **Row-Level Access Control (RLAC)**: Faculty members are strictly isolated to their assigned course tracks.
* **Real Cross-Platform Code Sandbox**: Dynamic binary detection with actual test case stdout diff evaluation.
* **Fail-Closed Webhook Verification**: Cryptographic HMAC-SHA256 signature verification for automated Razorpay reconciliation.
* **Automated 7-Day Backup Rotation**: Automated database backups with built-in disk retention policy.

## Code Runner networking

The Code Runner API is not exposed publicly. For an XAMPP/LMS process running on the same host, set `CODE_RUNNER_URL=http://127.0.0.1:8088`. In a containerized LMS deployment, connect the LMS and runner through a private internal network and use the runner service name instead. Student execution isolation must be enforced by the execution worker/container itself; do not expose an unrestricted host execution fallback.
