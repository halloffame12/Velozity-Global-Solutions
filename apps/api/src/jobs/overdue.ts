import cron from 'node-cron';
import { markOverdueTasks } from '../services/dashboard';

// Runs hourly on the server's local timezone. For production deployments pick
// a TZ and pass it to cron (`{ timezone: 'UTC' }`); the demo runs in local time.
export function startOverdueJob(): void {
  cron.schedule(
    '0 * * * *',
    async () => {
      console.log('[overdue-job] starting');
      try {
        const flagged = await markOverdueTasks();
        console.log(`[overdue-job] flagged ${flagged} task(s) as overdue`);
      } catch (error) {
        console.error('[overdue-job] failed:', error);
      }
    },
    { timezone: process.env.TZ },
  );
  console.log('Overdue task job scheduled (top of every hour)');
}