/*
 * TODO: Replace placeholder interfaces with actual Bnovo API response shapes.
 * Interfaces below are inferred from available requirements and should be
 * adjusted to match real API fields in bnovoService.
 */

export interface BookingServiceItem {
  code: string;
  title: string;
  // Optional quantity and notes per service item.
  quantity?: number;
  comment?: string;
}

export interface Booking {
  id: string | number;
  guestName: string;
  phone?: string;
  roomTitle: string;
  arrivalDate: string; // YYYY-MM-DD in local TZ
  departureDate: string; // YYYY-MM-DD in local TZ
  arrivalTimeFrom?: string;
  arrivalTimeTo?: string;
  adults: number;
  children?: number;
  totalAmount: number;
  prepaymentAmount?: number;
  comment?: string;
  specialRequests?: string;
  services?: BookingServiceItem[];
  status?: string; // e.g. confirmed / paid / awaiting_checkin
}

export interface BnovoService {
  getBookingsCreatedBetween: (from: Date, to: Date) => Promise<Booking[]>;
  getBookingsByArrivalDate: (date: string) => Promise<Booking[]>;
}

export interface TelegramService {
  sendMessage: (chatId: string, text: string, options?: Record<string, unknown>) => Promise<void>;
}

export class DailyReportsService {
  constructor(
    private readonly bnovoService: BnovoService,
    private readonly telegramService: TelegramService,
    private readonly timezone: string = process.env.TZ || 'Europe/Minsk',
  ) {}

  async sendMorningTasksReport(): Promise<void> {
    const { startOfYesterday, endOfYesterday, label } = this.getYesterdayInterval();

    let bookings: Booking[] = [];
    try {
      bookings = await this.bnovoService.getBookingsCreatedBetween(startOfYesterday, endOfYesterday);
    } catch (error) {
      console.error('[DailyReports] Ошибка получения броней за вчера в Bnovo', error);
      return;
    }

    const tasks = bookings.filter((booking) => {
      const total = booking.totalAmount || 0;
      const prepaid = booking.prepaymentAmount || 0;
      return !total || prepaid < total;
    });

    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '';
    const message = this.formatMorningTasksMessage(tasks, label);

    try {
      await this.telegramService.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[DailyReports] Ошибка отправки утреннего отчёта в Telegram', error);
    }
  }

  async sendTodayCheckinsReport(): Promise<void> {
    const todayLabel = this.formatDayMonth(this.getZonedNow());
    const todayDate = this.getTodayDateString();

    let bookings: Booking[] = [];
    try {
      bookings = await this.bnovoService.getBookingsByArrivalDate(todayDate);
    } catch (error) {
      console.error('[DailyReports] Ошибка получения сегодняшних заездов в Bnovo', error);
      return;
    }

    const allowedStatuses = ['confirmed', 'paid', 'awaiting_checkin'];
    const filtered = bookings.filter((booking) => {
      if (!booking.status) return true;
      return allowedStatuses.includes(booking.status);
    });

    const chatId = process.env.TELEGRAM_CHECKINS_CHAT_ID || '';
    const message = this.formatTodayCheckinsMessage(filtered, todayLabel);

    try {
      await this.telegramService.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[DailyReports] Ошибка отправки отчёта по заездам в Telegram', error);
    }
  }

  private formatMorningTasksMessage(bookings: Booking[], label: string): string {
    if (!bookings.length) {
      return `🌅 Утренние задачи DREWNO за ${label}: задач нет.`;
    }

    const lines = bookings.map((booking, index) => {
      const remaining = Math.max((booking.totalAmount || 0) - (booking.prepaymentAmount || 0), 0);
      const dates = this.formatDateRange(booking.arrivalDate, booking.departureDate);
      const prepaymentLine = `💸 Предоплата: ${this.formatMoney(booking.prepaymentAmount || 0)} → требуется звонок`;
      const comment = booking.comment ? `📝 Комментарий: ${booking.comment}` : undefined;

      return [
        `${index + 1}) ${booking.guestName} — ${booking.roomTitle}`,
        `📅 ${dates}`,
        `💰 ${this.formatMoney(booking.totalAmount)} | Остаток: ${this.formatMoney(remaining)}`,
        prepaymentLine,
        `📞 ${booking.phone || '—'}`,
        comment,
      ]
        .filter(Boolean)
        .join('\n');
    });

    return ['🌅 Утренние задачи DREWNO (новые брони за вчера без предоплаты)', '', ...lines].join('\n');
  }

  private formatTodayCheckinsMessage(bookings: Booking[], todayLabel: string): string {
    if (!bookings.length) {
      return `🏡 Заселения на сегодня (${todayLabel}): заездов нет.`;
    }

    const lines = bookings.map((booking, index) => {
      const guestsLine = this.formatGuests(booking.adults, booking.children || 0);
      const arrivalWindow = booking.arrivalTimeFrom || booking.arrivalTimeTo
        ? `🕒 Заезд: ${booking.arrivalTimeFrom || '—'}${booking.arrivalTimeTo ? `–${booking.arrivalTimeTo}` : ''}`
        : undefined;
      const services = (booking.services || [])
        .map((service) => {
          const qty = service.quantity ? ` x${service.quantity}` : '';
          const note = service.comment ? ` (${service.comment})` : '';
          return `${service.title}${qty}${note}`;
        })
        .join(', ');

      const comment = booking.comment ? `📝 Комментарий: ${booking.comment}` : undefined;
      const wishes = booking.specialRequests ? `📝 Пожелания: ${booking.specialRequests}` : undefined;
      const servicesLine = services ? `🔥 Услуги: ${services}` : undefined;
      const stayDates = this.formatDateRange(booking.arrivalDate, booking.departureDate);

      return [
        `${index + 1}) ${booking.roomTitle}`,
        `👥 ${guestsLine}`,
        arrivalWindow,
        `📅 ${stayDates}`,
        `📞 ${booking.phone || '—'} (${booking.guestName})`,
        servicesLine,
        comment,
        wishes,
      ]
        .filter(Boolean)
        .join('\n');
    });

    return [`🏡 Заселения на сегодня (${todayLabel})`, '', ...lines].join('\n');
  }

  private getYesterdayInterval(): { startOfYesterday: Date; endOfYesterday: Date; label: string } {
    const today = this.getStartOfDay(this.getZonedNow());
    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    return { startOfYesterday, endOfYesterday, label: this.formatDayMonth(startOfYesterday) };
  }

  private getTodayDateString(): string {
    const zonedNow = this.getZonedNow();
    const year = zonedNow.getFullYear();
    const month = `${zonedNow.getMonth() + 1}`.padStart(2, '0');
    const day = `${zonedNow.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getStartOfDay(date: Date): Date {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }

  private getZonedNow(): Date {
    // Approximate local time in provided TZ using toLocaleString.
    const now = new Date();
    const localeString = now.toLocaleString('en-US', { timeZone: this.timezone });
    return new Date(localeString);
  }

  private formatDayMonth(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      timeZone: this.timezone,
      day: '2-digit',
      month: '2-digit',
    });
  }

  private formatDateRange(from: string, to: string): string {
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T00:00:00`);

    const formatter = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'long',
    });

    const start = formatter.format(startDate);
    const end = formatter.format(endDate);
    return start === end ? start : `${start} – ${end}`;
  }

  private formatGuests(adults: number, children: number): string {
    const childPart = children ? ` + ${children} ребёнок(а)` : '';
    return `${adults} взрослый(ых)${childPart}`;
  }

  private formatMoney(value: number): string {
    return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} BYN`;
  }
}

// TODO: Replace imports with actual implementations from your project.
// import { bnovoService } from '../bnovo/bnovo.service';
// import { telegramService } from '../telegram/telegram.service';
// export const dailyReportsService = new DailyReportsService(bnovoService, telegramService);
