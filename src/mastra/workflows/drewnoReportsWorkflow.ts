import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { drewnoReportsAgent } from "../agents/drewnoReportsAgent";

/**
 * Step 1: Generate and Send Morning Tasks Report
 * Собирает вчерашние брони без полной предоплаты и отправляет отчёт администратору
 */
const generateMorningTasksReport = createStep({
  id: "generate-morning-tasks-report",
  description: "Генерирует и отправляет утренний отчёт о задачах администратору",

  inputSchema: z.object({}),

  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    reportSent: z.boolean(),
  }),

  execute: async ({ mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [Step 1] Начало генерации утреннего отчёта");

    const timezone = process.env.TZ || "Europe/Minsk";
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!adminChatId) {
      logger?.warn("⚠️ [Step 1] TELEGRAM_ADMIN_CHAT_ID не настроен, пропускаем отчёт");
      return {
        success: false,
        message: "TELEGRAM_ADMIN_CHAT_ID не настроен",
        reportSent: false,
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

    logger?.info("📅 [Step 1] Период отчёта", {
      from: startOfYesterday.toISOString(),
      to: endOfYesterday.toISOString(),
      dateLabel,
    });

    const prompt = `
      Пожалуйста, выполни следующие действия для создания утреннего отчёта:

      1. Получи все брони, созданные вчера (${dateLabel}) используя инструмент getBnovoBookingsCreatedBetween
         - Период: с ${startOfYesterday.toISOString()} по ${endOfYesterday.toISOString()}

      2. Отфильтруй только те брони, где prepaymentAmount меньше totalAmount (не полная предоплата)

      3. Сформируй отчёт используя инструмент formatMorningTasksReport
         - Передай отфильтрованный список броней
         - Метка даты: ${dateLabel}
         - Часовой пояс: ${timezone}

      4. Отправь отчёт в Telegram используя инструмент sendTelegramMessage
         - ID чата: ${adminChatId}
         - Текст: результат форматирования из шага 3

      5. Сообщи мне результат: сколько броней было найдено, сколько требуют звонка, и был ли отчёт отправлен успешно.
    `;

    try {
      const response = await drewnoReportsAgent.generateLegacy([
        { role: "user", content: prompt },
      ]);

      logger?.info("✅ [Step 1] Утренний отчёт обработан агентом", {
        responseLength: response.text.length,
      });

      return {
        success: true,
        message: response.text,
        reportSent: true,
      };
    } catch (error: any) {
      logger?.error("❌ [Step 1] Ошибка генерации утреннего отчёта", {
        error: error.message,
      });

      return {
        success: false,
        message: `Ошибка: ${error.message}`,
        reportSent: false,
      };
    }
  },
});

/**
 * Step 2: Generate and Send Today Checkins Report
 * Собирает брони с заездом на сегодня и отправляет отчёт
 */
const generateTodayCheckinsReport = createStep({
  id: "generate-today-checkins-report",
  description: "Генерирует и отправляет отчёт о заселениях на сегодня",

  inputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    reportSent: z.boolean(),
  }),

  outputSchema: z.object({
    morningReportSuccess: z.boolean(),
    checkinsReportSuccess: z.boolean(),
    summary: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [Step 2] Начало генерации отчёта по заездам", {
      previousStepSuccess: inputData.success,
    });

    const timezone = process.env.TZ || "Europe/Minsk";
    const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID;

    if (!checkinsChatId) {
      logger?.warn("⚠️ [Step 2] TELEGRAM_CHECKINS_CHAT_ID не настроен, пропускаем отчёт");
      return {
        morningReportSuccess: inputData.success,
        checkinsReportSuccess: false,
        summary: `Утренний отчёт: ${inputData.success ? "✅" : "❌"}. Отчёт по заездам: TELEGRAM_CHECKINS_CHAT_ID не настроен`,
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

    logger?.info("📅 [Step 2] Дата заездов", {
      todayDate,
      dateLabel,
    });

    const prompt = `
      Пожалуйста, выполни следующие действия для создания отчёта по заездам:

      1. Получи все брони с заездом на сегодня (${dateLabel}) используя инструмент getBnovoBookingsByArrivalDate
         - Дата заезда: ${todayDate}

      2. Сформируй отчёт используя инструмент formatTodayCheckinsReport
         - Передай список броней
         - Метка даты: ${dateLabel}
         - Часовой пояс: ${timezone}

      3. Отправь отчёт в Telegram используя инструмент sendTelegramMessage
         - ID чата: ${checkinsChatId}
         - Текст: результат форматирования из шага 2

      4. Сообщи мне результат: сколько броней с заездом на сегодня было найдено и был ли отчёт отправлен успешно.
    `;

    try {
      const response = await drewnoReportsAgent.generateLegacy([
        { role: "user", content: prompt },
      ]);

      logger?.info("✅ [Step 2] Отчёт по заездам обработан агентом", {
        responseLength: response.text.length,
      });

      const summary = `
Результаты ежедневных отчётов DREWNO:

Утренний отчёт администратору: ${inputData.success ? "✅ Отправлен" : "❌ Ошибка"}
${inputData.message}

Отчёт по заездам на сегодня: ✅ Отправлен
${response.text}
      `.trim();

      logger?.info("📊 [Step 2] Итоговая сводка", { summary });

      return {
        morningReportSuccess: inputData.success,
        checkinsReportSuccess: true,
        summary,
      };
    } catch (error: any) {
      logger?.error("❌ [Step 2] Ошибка генерации отчёта по заездам", {
        error: error.message,
      });

      return {
        morningReportSuccess: inputData.success,
        checkinsReportSuccess: false,
        summary: `Утренний отчёт: ${inputData.success ? "✅" : "❌"}. Отчёт по заездам: ❌ Ошибка - ${error.message}`,
      };
    }
  },
});

/**
 * Create the Drewno Daily Reports Workflow
 * Этот workflow запускается по расписанию и генерирует два отчёта
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
