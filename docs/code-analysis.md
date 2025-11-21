# Обзор кода

Этот документ резюмирует текущую архитектуру проекта автоматизации отчётов DREWNO.

## Общая схема
- **Mastra инстанс** создаётся в `src/mastra/index.ts` и подключает PostgreSQL хранилище, агента и единственный workflow. Сервер Mastra публикует API маршруты, в том числе для интеграции с Inngest, и регистрирует крон-задачу для ежедневного запуска отчётов. Логирование реализовано через Pino (в продакшене — кастомный `ProductionPinoLogger`).

## Агент
- `drewnoReportsAgent` (`src/mastra/agents/drewnoReportsAgent.ts`) использует модель `gpt-5` через OpenAI SDK. Инструкция агента ориентирована на сбор данных о бронированиях, форматирование отчётов и отправку их в Telegram. Доступные инструменты: получение данных из Bnovo, форматирование отчётов и отправка сообщений в Telegram.

## Workflow ежедневных отчётов
- `drewnoReportsWorkflow` (`src/mastra/workflows/drewnoReportsWorkflow.ts`) состоит из двух шагов, выполняемых последовательно через `createWorkflow`:
  1. **generateMorningTasksReport** — получает брони, созданные вчера, фильтрует по неполной предоплате, формирует утренний отчёт и отправляет его в чат администратора. Учитывает часовой пояс из `TZ` и проверяет наличие `TELEGRAM_ADMIN_CHAT_ID_NEW`.
  2. **generateTodayCheckinsReport** — собирает заезды на текущий день, форматирует отчёт и отправляет его в чат заездов. Зависит от `TELEGRAM_CHECKINS_CHAT_ID_NEW` и получает метки даты в соответствии с `TZ`.
- Оба шага взаимодействуют с агентом через `generateLegacy`, что позволяет ему самостоятельно вызывать инструменты и формировать текстовые ответы.

## Инструменты
- **Bnovo API** (`src/mastra/tools/bnovoTools.ts`):
  - `getBnovoBookingsCreatedBetween` — выгружает брони, созданные в указанном ISO-диапазоне, с пагинацией и последующей фильтрацией по точным timestamp. Требует `BNOVO_API_BASE_URL`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_KEY`, `BNOVO_HOTEL_ID`.
  - `getBnovoBookingsByArrivalDate` — собирает брони, созданные за последние 180 дней, и фильтрует их по дате заезда. Использует те же переменные окружения.
  - Вспомогательный `mapBookingFromApi` преобразует сырой ответ API к унифицированной схеме (имена гостей, номера, теги, суммы, валюту BYN).
- **Форматирование отчётов** (`src/mastra/tools/reportFormattingTools.ts`):
  - `formatMorningTasksReport` — генерирует список задач по звонкам для брони с неполной предоплатой, добавляя даты проживания и суммы оплаты.
  - `formatTodayCheckinsReport` — формирует перечень заездов на сегодня, включая гостей, время заезда, услуги и комментарии.
- **Отправка Telegram** (`src/mastra/tools/telegramTools.ts`) — отправляет текстовые сообщения в указанный `chatId` через Telegram Bot API.

## Сервер и интеграции
- Сервер Mastra слушает на `0.0.0.0:5000` и добавляет middleware для логирования запросов и классификации ошибок (включая non-retriable для ошибок валидации и отсутствия ресурсов памяти агента).
- API маршрут `/api/inngest` регистрирует workflows в Inngest и обеспечивает real-time мониторинг через каналы `workflow:{workflowId}:{runId}`.
- При загрузке выполняются sanity-checks, запрещающие наличие более одного workflow или агента из-за ограничений UI.

## Ключевые переменные окружения
- **Bnovo**: `BNOVO_API_BASE_URL`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_KEY`, `BNOVO_HOTEL_ID`.
- **Telegram**: `TELEGRAM_ADMIN_CHAT_ID_NEW`, `TELEGRAM_CHECKINS_CHAT_ID_NEW`, токен бота (используется в `telegramTools`).
- **AI**: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`.
- **Общие**: `TZ` (часовой пояс для дат и расписаний), `DAILY_REPORT_CRON` (крон-выражение регистрации workflow).
