import { runJobSyncPipeline } from './sync-engine';

declare global {
  // eslint-disable-next-line no-var
  var _jobSchedulerTimer: NodeJS.Timeout | undefined;
  // eslint-disable-next-line no-var
  var _jobSchedulerLastRun: number | undefined;
  // eslint-disable-next-line no-var
  var _jobSchedulerIsSyncing: boolean | undefined;
  // eslint-disable-next-line no-var
  var _jobSchedulerSourceIndex: number | undefined;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ROTATING_SOURCES = [
  'LinkedIn',
  'Arbeitnow',
  'Jobicy',
  'Himalayas',
  'Remotive',
  'Naukri',
  'Instahyre',
  'Unstop',
  'Wellfound'
];

export function startTwoHourJobScheduler() {
  if (global._jobSchedulerTimer) {
    return; // Already active
  }

  console.log('⏰ Initializing 2-Hour Rotating Tech Job Scheduler...');
  global._jobSchedulerLastRun = Date.now();
  global._jobSchedulerIsSyncing = false;
  global._jobSchedulerSourceIndex = 0;

  // Run initial lightweight sync in background after 5 seconds if not synced recently
  setTimeout(async () => {
    if (!global._jobSchedulerIsSyncing) {
      try {
        global._jobSchedulerIsSyncing = true;
        await runJobSyncPipeline();
        global._jobSchedulerLastRun = Date.now();
      } catch (e) {
        console.error('Initial scheduler sync error:', e);
      } finally {
        global._jobSchedulerIsSyncing = false;
      }
    }
  }, 5000);

  // Set recurring 2-hour rotating interval
  global._jobSchedulerTimer = setInterval(async () => {
    if (global._jobSchedulerIsSyncing) return;
    try {
      global._jobSchedulerIsSyncing = true;
      const currentIdx = global._jobSchedulerSourceIndex || 0;
      const currentSource = ROTATING_SOURCES[currentIdx % ROTATING_SOURCES.length];
      global._jobSchedulerSourceIndex = (currentIdx + 1) % ROTATING_SOURCES.length;

      console.log(`⏱️ 2-Hour Ingestion Cycle Triggered: Ingesting from ${currentSource}...`);
      await runJobSyncPipeline(currentSource);
      global._jobSchedulerLastRun = Date.now();
    } catch (err) {
      console.error('2-Hour rotating job sync error:', err);
    } finally {
      global._jobSchedulerIsSyncing = false;
    }
  }, TWO_HOURS_MS);
}

export function getSchedulerStatus() {
  const lastRun = global._jobSchedulerLastRun || Date.now();
  const nextRun = lastRun + TWO_HOURS_MS;
  const msUntilNext = Math.max(0, nextRun - Date.now());
  const currentIdx = global._jobSchedulerSourceIndex || 0;
  const nextSource = ROTATING_SOURCES[currentIdx % ROTATING_SOURCES.length];

  return {
    isActive: true,
    intervalMinutes: 120,
    intervalHours: 2,
    isSyncing: Boolean(global._jobSchedulerIsSyncing),
    nextSourceTarget: nextSource,
    lastRunTime: new Date(lastRun).toISOString(),
    nextRunTime: new Date(nextRun).toISOString(),
    minutesUntilNextRun: Math.ceil(msUntilNext / 60000),
  };
}

export const startThirtyMinuteJobScheduler = startTwoHourJobScheduler;
export const startHourlyJobScheduler = startTwoHourJobScheduler;
export const startRotatingJobScheduler = startTwoHourJobScheduler;

