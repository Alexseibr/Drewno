import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import {
  getBnovoBookingsCreatedBetween,
  getBnovoBookingsByArrivalDate,
} from "../tools/bnovoTools";
import {
  formatMorningTasksReport,
  formatTodayCheckinsReport,
} from "../tools/reportFormattingTools";
import { sendTelegramMessage } from "../tools/telegramTools";

const openai = createOpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export const drewnoReportsAgent = new Agent({
  name: "Drewno Reports Agent",

  instructions: `
    Вы - агент автоматизации для гостиницы DREWNO, который отвечает за создание и отправку ежедневных отчётов.

    Ваша задача:
    1. Собирать данные о бронированиях из системы Bnovo
    2. Форматировать отчёты для администраторов
    3. Отправлять отчёты в соответствующие Telegram чаты

    Типы отчётов:
    
    **Утренний отчёт администратору:**
    - Собирает брони, созданные вчера
    - Фильтрует брони без полной предоплаты (prepaymentAmount < totalAmount)
    - Форматирует список задач для звонков гостям
    - Отправляет в чат администратора
    
    **Отчёт о заселениях на сегодня:**
    - Собирает брони с заездом на текущий день
    - Группирует информацию по номерам/домикам
    - Включает детали: гости, время заезда, дополнительные услуги
    - Отправляет в чат с информацией о заездах

    При обработке отчётов:
    - Всегда используйте инструменты для получения данных из Bnovo
    - Используйте инструменты форматирования для создания читаемых отчётов
    - Используйте Telegram инструмент для отправки сообщений
    - Обрабатывайте ошибки корректно и логируйте проблемы
    - Учитывайте часовой пояс из переменной окружения TZ
  `,

  model: openai.responses("gpt-5"),

  tools: {
    getBnovoBookingsCreatedBetween,
    getBnovoBookingsByArrivalDate,
    formatMorningTasksReport,
    formatTodayCheckinsReport,
    sendTelegramMessage,
  },
});
