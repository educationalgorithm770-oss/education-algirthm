#!/usr/bin/env node
/**
 * Standalone Automated Job Sync Runner (2-Hour Cycle)
 *
 * Can be executed via:
 *   npm run jobs:sync
 * Or scheduled via cron:
 *   0 *\/2 * * * node /path/to/project3/apps/frontend/scripts/run-job-sync.js
 */

const http = require('http');
const https = require('https');

const SYNC_URL = process.env.JOB_SYNC_URL || 'http://127.0.0.1:3000/api/jobs/sync?key=ea_sync_2026_direct';

console.log(`[${new Date().toISOString()}] 🚀 Initiating automated 2-hour job synchronization...`);
console.log(`Target endpoint: ${SYNC_URL}`);

const parsedUrl = new URL(SYNC_URL);
const client = parsedUrl.protocol === 'https:' ? https : http;

const req = client.request(
  {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sync-key': 'ea_sync_2026_direct',
    },
    timeout: 60000,
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300 && json.success) {
          console.log(`[${new Date().toISOString()}] ✅ Sync Successful:`);
          console.log(` - Message: ${json.message}`);
          console.log(` - Total Fetched: ${json.stats?.totalFetched ?? 'N/A'}`);
          console.log(` - Total Inserted: ${json.stats?.totalInserted ?? 'N/A'}`);
          console.log(` - Total Skipped/Refreshed: ${json.stats?.totalSkipped ?? 'N/A'}`);
          console.log(` - Next Ingestion Run: ${json.scheduler?.nextRunTime ?? 'In 2 hours'}`);
          process.exit(0);
        } else {
          console.error(`[${new Date().toISOString()}] ❌ Sync Error (Status ${res.statusCode}):`, json.error || data);
          process.exit(1);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Failed to parse response:`, data);
        process.exit(1);
      }
    });
  }
);

req.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] ❌ Request failed: ${err.message}`);
  console.log('Ensure Next.js server is running on http://127.0.0.1:3000');
  process.exit(1);
});

req.on('timeout', () => {
  console.error(`[${new Date().toISOString()}] ⏱️ Sync request timed out after 60s`);
  req.destroy();
  process.exit(1);
});

req.end();
