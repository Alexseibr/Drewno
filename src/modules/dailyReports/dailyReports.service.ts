// TODO: Replace placeholder interfaces with actual Bnovo API response shapes.
interface BookingGuest {
  fullName: string;
  phone?: string;
  adults?: number;
  children?: number;
}

interface BookingAccommodation {
  id: string | number;
  name: string;
}

interface BookingAdditionalService {
  name: string;
  quantity?: number;
  comment?: string;
}

interface Booking {
  id: string | number;
  guest: BookingGuest;
  accommodation: BookingAccommodation;
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  prepaymentAmount?: number;
  prepaymentPercent?: number;
  status?: string;
  checkInTime?: string;
  comment?: string;
  specialRequests?: string;
  additionalServices?: BookingAdditionalService[];
}

type BnovoService = {
  getBookingsCreatedBetween: (start: Date, end: Date) => Promise<Booking[]>;
  getBookingsByCheckinDate: (start: Date, end: Date) => Promise<Booking[]>;
};

type TelegramService = {
  sendMessage: (chatId: string, text: string, options?: Record<string, unknown>) => Promise<void>;
};

export class DailyReportsService {
  private readonly timezone: string;

  constructor(private readonly bnovoService: BnovoService, private readonly telegramService: TelegramService) {
    this.timezone = process.env.TZ || 'UTC';
  }

  async sendMorningTasksReport(): Promise<void> {
    const { startOfYesterday, endOfYesterday } = this.getYesterdayInterval();

    let bookings: Booking[] = [];
    try {
      bookings = await this.bnovoService.getBookingsCreatedBetween(startOfYesterday, endOfYesterday);
    } catch (error) {
      console.error('[DailyReports] Failed to fetch yesterday bookings from Bnovo', error);
      return;
    }

    const tasks = bookings.filter((booking) => {
      const total = booking.totalAmount ?? 0;
      const prepaidAmount = booking.prepaymentAmount ?? 0;
      const prepaidPercent = booking.prepaymentPercent ?? 0;

      if (!total) {
        return prepaidPercent < 100;
      }

      return prepaidAmount < total;
    });

    const reportText = this.buildMorningTasksMessage(tasks, startOfYesterday);

    try {
      await this.telegramService.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID || '', reportText, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[DailyReports] Failed to send morning tasks report to Telegram', error);
    }
  }

  async sendTodayCheckinsReport(): Promise<void> {
    const { startOfToday, endOfToday } = this.getTodayInterval();

    let bookings: Booking[] = [];
    try {
      bookings = await this.bnovoService.getBookingsByCheckinDate(startOfToday, endOfToday);
    } catch (error) {
      console.error('[DailyReports] Failed to fetch today check-ins from Bnovo', error);
      return;
    }

    const allowedStatuses = ['confirmed', 'paid', 'awaiting_checkin'];
    const filteredBookings = bookings.filter((booking) => {
      if (!booking.status) return true;
      return allowedStatuses.includes(booking.status);
    });

    const reportText = this.buildTodayCheckinsMessage(filteredBookings, startOfToday);

    try {
      await this.telegramService.sendMessage(process.env.TELEGRAM_CHECKINS_CHAT_ID || '', reportText, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('[DailyReports] Failed to send check-ins report to Telegram', error);
    }
  }

  private getYesterdayInterval(): { startOfYesterday: Date; endOfYesterday: Date } {
    const now = this.now();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(startOfToday.getTime() - 1);

    return { startOfYesterday, endOfYesterday };
  }

  private getTodayInterval(): { startOfToday: Date; endOfToday: Date } {
    const now = this.now();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    endOfToday.setMilliseconds(endOfToday.getMilliseconds() - 1);

    return { startOfToday, endOfToday };
  }

  private now(): Date {
    return new Date();
  }

  private buildMorningTasksMessage(bookings: Booking[], yesterday: Date): string {
    const dateStr = this.formatDate(yesterday);

    if (!bookings.length) {
      return `\u2705 Задачи на ${dateStr}: брони без полной предоплаты не найдены.`;
    }

    const lines = bookings.map((booking, index) => {
      const due = Math.max(booking.totalAmount - (booking.prepaymentAmount || 0), 0);
      const comment = booking.comment ? `\nКомментарий: ${booking.comment}` : '';

      return [
        `${index + 1}. ${booking.guest.fullName}`,
        `\u260E\uFE0F ${booking.guest.phone || '—'}`,
        `Даты: ${this.formatDate(booking.checkIn)} — ${this.formatDate(booking.checkOut)}`,
        `Объект: ${booking.accommodation.name}`,
        `Сумма: ${this.formatMoney(booking.totalAmount)} | Предоплата: ${this.formatMoney(booking.prepaymentAmount || 0)} | Остаток: ${this.formatMoney(due)}`,
        comment,
      ]
        .filter(Boolean)
        .join('\n');
    });

    return [`\u26a0\ufe0f Задачи на ${dateStr}: позвонить гостям`, '', ...lines].join('\n');
  }

  private buildTodayCheckinsMessage(bookings: Booking[], today: Date): string {
    const dateStr = this.formatDate(today);

    if (!bookings.length) {
      return `\u2705 Заселения на ${dateStr}: заездов нет.`;
    }

    const grouped = bookings.reduce<Record<string | number, Booking[]>>((acc, booking) => {
      const key = booking.accommodation.id || booking.accommodation.name;
      acc[key] = acc[key] || [];
      acc[key].push(booking);
      return acc;
    }, {});

    const sections = Object.values(grouped).map((group) => {
      const accommodationName = group[0].accommodation.name;
      const lines = group.map((booking) => {
        const services = (booking.additionalServices || [])
          .map((service) => {
            const qty = service.quantity ? ` x${service.quantity}` : '';
            const comment = service.comment ? ` (${service.comment})` : '';
            return `${service.name}${qty}${comment}`;
          })
          .join(', ');

        const wishes = booking.specialRequests || '';
        const comment = booking.comment || '';

        return [
          `• ${booking.guest.fullName} (${booking.guest.adults || 0}+${booking.guest.children || 0})`,
          `\u260E\uFE0F ${booking.guest.phone || '—'}`,
          booking.checkInTime ? `Время заезда: ${booking.checkInTime}` : undefined,
          services ? `Услуги: ${services}` : undefined,
          comment ? `Комментарий: ${comment}` : undefined,
          wishes ? `Пожелания: ${wishes}` : undefined,
        ]
          .filter(Boolean)
          .join('\n');
      });

      return [`<b>${accommodationName}</b>`, ...lines].join('\n');
    });

    return [`\ud83d\udcc5 Заселения на ${dateStr}`, '', ...sections].join('\n\n');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      timeZone: this.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatMoney(value: number): string {
    return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} ₽`;
  }
}
