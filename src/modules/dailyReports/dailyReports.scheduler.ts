import cron from 'node-cron';
import { dailyReportsService } from './dailyReports.service';

export function initDailyReportsScheduler(): void {
  const timezone = process.env.TZ || 'Europe/Minsk';
  const adminCron = normalizeCron(process.env.DAILY_REPORT_CRON_ADMIN);
  const checkinsCron = normalizeCron(process.env.DAILY_REPORT_CRON_CHECKINS);

  if (adminCron) {
    cron.schedule(adminCron, () => runJob(() => dailyReportsService.sendMorningTasksReport()), { timezone });
    console.info(`[DailyReportsScheduler] Утренний отчёт запланирован по cron "${adminCron}" (${timezone}).`);
  } else {
    console.warn('[DailyReportsScheduler] DAILY_REPORT_CRON_ADMIN не задан — утренний отчёт не будет запущен.');
  }

  if (checkinsCron) {
    cron.schedule(checkinsCron, () => runJob(() => dailyReportsService.sendTodayCheckinsReport()), { timezone });
    console.info(`[DailyReportsScheduler] Отчёт по заездам запланирован по cron "${checkinsCron}" (${timezone}).`);
  } else {
    console.warn('[DailyReportsScheduler] DAILY_REPORT_CRON_CHECKINS не задан — отчёт по заездам не будет запущен.');
  }
}

function normalizeCron(value?: string): string | undefined {
  if (!value) return undefined;

  const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const [, hour, minute] = timeMatch;
    return `${minute} ${hour} * * *`;
  }

  return value;
}

async function runJob(job: () => Promise<void>): Promise<void> {
  try {
    await job();
  } catch (error) {
    console.error('[DailyReportsScheduler] Ошибка выполнения планового задания', error);
  }
}
