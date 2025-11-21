import cron from 'node-cron';
import { DailyReportsService } from './dailyReports.service';

type SchedulerOptions = {
  timezone?: string;
};

export class DailyReportsScheduler {
  private readonly timezone: string;

  constructor(private readonly reportsService: DailyReportsService, options: SchedulerOptions = {}) {
    this.timezone = options.timezone || process.env.TZ || 'UTC';
  }

  initialize(): void {
    const adminCron = this.normalizeCron(process.env.DAILY_REPORT_TIME_ADMIN);
    const checkinsCron = this.normalizeCron(process.env.DAILY_REPORT_TIME_CHECKINS);

    if (adminCron) {
      cron.schedule(adminCron, () => this.wrapJob(this.reportsService.sendMorningTasksReport.bind(this.reportsService)), {
        timezone: this.timezone,
      });
      console.info(`[DailyReportsScheduler] Admin report scheduled at ${adminCron} (${this.timezone})`);
    } else {
      console.warn('[DailyReportsScheduler] DAILY_REPORT_TIME_ADMIN is not configured. Admin report will not run.');
    }

    if (checkinsCron) {
      cron.schedule(checkinsCron, () => this.wrapJob(this.reportsService.sendTodayCheckinsReport.bind(this.reportsService)), {
        timezone: this.timezone,
      });
      console.info(`[DailyReportsScheduler] Check-ins report scheduled at ${checkinsCron} (${this.timezone})`);
    } else {
      console.warn('[DailyReportsScheduler] DAILY_REPORT_TIME_CHECKINS is not configured. Check-ins report will not run.');
    }
  }

  private normalizeCron(value?: string): string | undefined {
    if (!value) return undefined;

    // Support "HH:mm" format alongside standard cron strings.
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const [_, hour, minute] = timeMatch;
      return `${minute} ${hour} * * *`;
    }

    return value;
  }

  private async wrapJob(job: () => Promise<void>): Promise<void> {
    try {
      await job();
    } catch (error) {
      console.error('[DailyReportsScheduler] Scheduled job failed', error);
    }
  }
}
