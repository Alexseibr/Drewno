import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Service Item Schema
 */
const ServiceItemSchema = z.object({
  id: z.string(),
  code: z.string().optional(),
  title: z.string(),
  price: z.number().optional(),
  quantity: z.number().optional(),
  comment: z.string().optional(),
});

/**
 * Booking Schema for formatting
 */
const BookingSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  arrivalDate: z.string(),
  departureDate: z.string(),
  guestName: z.string(),
  phone: z.string().optional(),
  roomId: z.string(),
  roomTitle: z.string(),
  adults: z.number(),
  children: z.number(),
  totalAmount: z.number(),
  prepaymentAmount: z.number(),
  currency: z.string(),
  status: z.string(),
  arrivalTimeFrom: z.string().optional(),
  arrivalTimeTo: z.string().optional(),
  comment: z.string().optional(),
  services: z.array(ServiceItemSchema).optional(),
});

/**
 * Tool: Format Morning Tasks Report
 */
export const formatMorningTasksReport = createTool({
  id: "format-morning-tasks-report",
  description: "Форматирует утренний отчёт о бронях без полной предоплаты",
  
  inputSchema: z.object({
    bookings: z.array(BookingSchema).describe("Список броней для включения в отчёт"),
    dateLabel: z.string().describe("Метка даты (например, '21.11')"),
    timezone: z.string().optional().describe("Часовой пояс для форматирования дат"),
  }),

  outputSchema: z.object({
    formattedText: z.string(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [formatMorningTasksReport] Форматирование утреннего отчёта", {
      bookingsCount: context.bookings.length,
      dateLabel: context.dateLabel,
    });

    const timezone = context.timezone || process.env.TZ || "Europe/Minsk";

    if (!context.bookings.length) {
      const report = `🌅 Утренние задачи DREWNO за ${context.dateLabel}: задач нет.`;
      logger?.info("✅ [formatMorningTasksReport] Отчёт сформирован (задач нет)");
      return { formattedText: report };
    }

    const lines = context.bookings.map((booking, index) => {
      const remaining = Math.max(
        booking.totalAmount - booking.prepaymentAmount,
        0
      );
      const dates = formatDateRange(
        booking.arrivalDate,
        booking.departureDate,
        timezone
      );
      const prepaymentLine = `💸 Предоплата: ${formatMoney(booking.prepaymentAmount)} → требуется звонок`;
      const comment = booking.comment
        ? `📝 Комментарий: ${booking.comment}`
        : undefined;

      return [
        `${index + 1}) ${booking.guestName} — ${booking.roomTitle}`,
        `📅 ${dates}`,
        `💰 ${formatMoney(booking.totalAmount)} | Остаток: ${formatMoney(remaining)}`,
        prepaymentLine,
        `📞 ${booking.phone || "—"}`,
        comment,
      ]
        .filter(Boolean)
        .join("\n");
    });

    const report = [
      "🌅 Утренние задачи DREWNO (новые брони за вчера без предоплаты)",
      "",
      ...lines,
    ].join("\n");

    logger?.info("✅ [formatMorningTasksReport] Отчёт сформирован", {
      reportLength: report.length,
    });

    return { formattedText: report };
  },
});

/**
 * Tool: Format Today Checkins Report
 */
export const formatTodayCheckinsReport = createTool({
  id: "format-today-checkins-report",
  description: "Форматирует отчёт о заселениях на текущий день",
  
  inputSchema: z.object({
    bookings: z.array(BookingSchema).describe("Список броней с заездом на сегодня"),
    dateLabel: z.string().describe("Метка даты (например, '21.11')"),
    timezone: z.string().optional().describe("Часовой пояс для форматирования дат"),
  }),

  outputSchema: z.object({
    formattedText: z.string(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [formatTodayCheckinsReport] Форматирование отчёта по заездам", {
      bookingsCount: context.bookings.length,
      dateLabel: context.dateLabel,
    });

    const timezone = context.timezone || process.env.TZ || "Europe/Minsk";

    if (!context.bookings.length) {
      const report = `🏡 Заселения на сегодня (${context.dateLabel}): заездов нет.`;
      logger?.info("✅ [formatTodayCheckinsReport] Отчёт сформирован (заездов нет)");
      return { formattedText: report };
    }

    const lines = context.bookings.map((booking, index) => {
      const guestsLine = formatGuests(booking.adults, booking.children);
      const arrivalWindow =
        booking.arrivalTimeFrom || booking.arrivalTimeTo
          ? `🕒 Заезд: ${booking.arrivalTimeFrom || "—"}${booking.arrivalTimeTo ? `–${booking.arrivalTimeTo}` : ""}`
          : undefined;

      const services = (booking.services || [])
        .map((service) => {
          const qty = service.quantity ? ` x${service.quantity}` : "";
          const note = service.comment ? ` (${service.comment})` : "";
          return `${service.title}${qty}${note}`;
        })
        .join(", ");

      const comment = booking.comment
        ? `📝 Комментарий: ${booking.comment}`
        : undefined;
      const servicesLine = services ? `🔥 Услуги: ${services}` : undefined;
      const stayDates = formatDateRange(
        booking.arrivalDate,
        booking.departureDate,
        timezone
      );

      return [
        `${index + 1}) ${booking.roomTitle}`,
        `👥 ${guestsLine}`,
        arrivalWindow,
        `📅 ${stayDates}`,
        `📞 ${booking.phone || "—"} (${booking.guestName})`,
        servicesLine,
        comment,
      ]
        .filter(Boolean)
        .join("\n");
    });

    const report = [
      `🏡 Заселения на сегодня (${context.dateLabel})`,
      "",
      ...lines,
    ].join("\n");

    logger?.info("✅ [formatTodayCheckinsReport] Отчёт сформирован", {
      reportLength: report.length,
    });

    return { formattedText: report };
  },
});

/**
 * Helper functions
 */
function formatDateRange(from: string, to: string, timezone: string): string {
  // Extract date part (handles both "YYYY-MM-DD" and "YYYY-MM-DD HH:MM:SS" formats)
  const fromDate = from.split(' ')[0];
  const toDate = to.split(' ')[0];
  
  const startDate = new Date(`${fromDate}T00:00:00`);
  const endDate = new Date(`${toDate}T00:00:00`);

  const formatter = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    timeZone: timezone,
  });

  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start} – ${end}`;
}

function formatGuests(adults: number, children: number): string {
  const childPart = children ? ` + ${children} ребёнок(а)` : "";
  return `${adults} взрослый(ых)${childPart}`;
}

function formatMoney(value: number): string {
  return `${value.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} BYN`;
}
