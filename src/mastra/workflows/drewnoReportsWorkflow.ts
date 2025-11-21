import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { drewnoReportsAgent } from "../agents/drewnoReportsAgent";

/**
 * Step 1: Generate and Send Morning Tasks Report
 * Использует агента для получения вчерашних броней без полной предоплаты и отправки отчёта
 */
const generateMorningTasksReport = createStep({
  id: "generate-morning-tasks-report",
  description: "Генерирует и отправляет утренний отчёт о задачах администратору",

  inputSchema: z.object({}),

  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  execute: async ({ mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [Step 1] Начало генерации утреннего отчёта");

    const timezone = process.env.TZ || "Europe/Minsk";
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID_NEW;

    if (!adminChatId) {
      logger?.warn("⚠️ [Step 1] TELEGRAM_ADMIN_CHAT_ID_NEW не настроен");
      return {
        success: false,
        message: "TELEGRAM_ADMIN_CHAT_ID_NEW не настроен",
      };
    }

    const now = new Date();
    const localeString = now.toLocaleString("en-US", { timeZone: timezone });
    const zonedNow = new Date(localeString);

    const today = new Date(zonedNow);
    today.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const dateLabel = startOfYesterday.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    const prompt = `
Выполни следующие действия для создания утреннего отчёта:

1. Используй инструмент getBnovoBookingsCreatedBetween для получения всех броней, созданных вчера:
   - fromIso: ${startOfYesterday.toISOString()}
   - toIso: ${endOfYesterday.toISOString()}

2. Из полученных броней отфильтруй только те, где prepaymentAmount меньше totalAmount (неполная предоплата)

3. Используй инструмент formatMorningTasksReport для форматирования отчёта:
   - bookings: отфильтрованный список броней
   - dateLabel: ${dateLabel}
   - timezone: ${timezone}

4. Используй инструмент sendTelegramMessage для отправки отчёта:
   - chatId: ${adminChatId}
   - text: результат форматирования из шага 3

5. Сообщи результат в формате: "Успешно: <true/false>. Найдено броней: <число>. Требуют звонка: <число>. Отправлено: <true/false>."

ВАЖНО: Если какой-то инструмент выдал ошибку, сообщи об этом в ответе.
`;

    try {
      const response = await drewnoReportsAgent.generateLegacy([
        { role: "user", content: prompt },
      ]);

      logger?.info("✅ [Step 1] Агент выполнил задачу", {
        responseLength: response.text.length,
      });

      return {
        success: true,
        message: response.text,
      };
    } catch (error: any) {
      logger?.error("❌ [Step 1] Ошибка выполнения агента", {
        error: error.message,
      });

      return {
        success: false,
        message: `Ошибка: ${error.message}`,
      };
    }
  },
});

/**
 * Step 2: Generate and Send Today Checkins Report
 * Использует агента для получения сегодняшних заездов и отправки отчёта
 */
const generateTodayCheckinsReport = createStep({
  id: "generate-today-checkins-report",
  description: "Генерирует и отправляет отчёт о заселениях на сегодня",

  inputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  outputSchema: z.object({
    morningReportSuccess: z.boolean(),
    checkinsReportSuccess: z.boolean(),
    summary: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [Step 2] Начало генерации отчёта по заездам");

    const timezone = process.env.TZ || "Europe/Minsk";
    const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID_NEW;

    if (!checkinsChatId) {
      logger?.warn("⚠️ [Step 2] TELEGRAM_CHECKINS_CHAT_ID_NEW не настроен");
      return {
        morningReportSuccess: inputData.success,
        checkinsReportSuccess: false,
        summary: `Утренний отчёт: ${inputData.success ? "✅" : "❌"}\n${inputData.message}\n\nОтчёт по заездам: ❌ TELEGRAM_CHECKINS_CHAT_ID_NEW не настроен`,
      };
    }

    const now = new Date();
    const localeString = now.toLocaleString("en-US", { timeZone: timezone });
    const zonedNow = new Date(localeString);

    const year = zonedNow.getFullYear();
    const month = String(zonedNow.getMonth() + 1).padStart(2, "0");
    const day = String(zonedNow.getDate()).padStart(2, "0");
    const todayDate = `${year}-${month}-${day}`;

    const dateLabel = zonedNow.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    const prompt = `
Выполни следующие действия для создания отчёта по заездам:

1. Используй инструмент getBnovoBookingsByArrivalDate для получения всех броней с заездом на сегодня:
   - arrivalDate: ${todayDate}

2. Используй инструмент formatTodayCheckinsReport для форматирования отчёта:
   - bookings: полученный список броней
   - dateLabel: ${dateLabel}
   - timezone: ${timezone}

3. Используй инструмент sendTelegramMessage для отправки отчёта:
   - chatId: ${checkinsChatId}
   - text: результат форматирования из шага 2

4. Сообщи результат в формате: "Успешно: <true/false>. Найдено заездов: <число>. Отправлено: <true/false>."

ВАЖНО: Если какой-то инструмент выдал ошибку, сообщи об этом в ответе.
`;

    try {
      const response = await drewnoReportsAgent.generateLegacy([
        { role: "user", content: prompt },
      ]);

      logger?.info("✅ [Step 2] Агент выполнил задачу", {
        responseLength: response.text.length,
      });

      const summary = `
Результаты ежедневных отчётов DREWNO:

Утренний отчёт администратору: ${inputData.success ? "✅" : "❌"}
${inputData.message}

Отчёт по заездам на сегодня: ✅
${response.text}
      `.trim();

      return {
        morningReportSuccess: inputData.success,
        checkinsReportSuccess: true,
        summary,
      };
    } catch (error: any) {
      logger?.error("❌ [Step 2] Ошибка выполнения агента", {
        error: error.message,
      });

      return {
        morningReportSuccess: inputData.success,
        checkinsReportSuccess: false,
        summary: `Утренний отчёт: ${inputData.success ? "✅" : "❌"}\n${inputData.message}\n\nОтчёт по заездам: ❌ Ошибка - ${error.message}`,
      };
    }
  },
});

/**
 * Create the Drewno Daily Reports Workflow
 * Этот workflow запускается по расписанию и генерирует два отчёта через агента
 */
export const drewnoReportsWorkflow = createWorkflow({
  id: "drewno-daily-reports",

  inputSchema: z.object({}) as any,

  outputSchema: z.object({
    morningReportSuccess: z.boolean(),
    checkinsReportSuccess: z.boolean(),
    summary: z.string(),
  }),
})
  .then(generateMorningTasksReport as any)
  .then(generateTodayCheckinsReport as any)
  .commit();
