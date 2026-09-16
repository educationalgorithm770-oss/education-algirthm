export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTwoHourJobScheduler } = await import('@/lib/job-scrapers/scheduler');
    console.log('🚀 Next.js Server Boot: Initializing 2-Hour Tech Job Ingestion Scheduler...');
    startTwoHourJobScheduler();
  }
}
