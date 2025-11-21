# Drewno

## План по группе

### 9. Ежедневные отчёты

Модуль `dailyReports` собирает ежедневные отчёты и отправляет их в Telegram:

- Утренний отчёт администратору (`sendMorningTasksReport`): ищет вчерашние брони без полной предоплаты, формирует список звонков и шлёт его в чат `TELEGRAM_ADMIN_CHAT_ID`.
- Отчёт «Заселения на сегодня» (`sendTodayCheckinsReport`): группирует сегодняшние заезды по домикам/номерам и отправляет информацию по гостям и услугам в чат `TELEGRAM_CHECKINS_CHAT_ID`.

Запуск расписания настраивается через `dailyReports.scheduler` и cron-выражения в переменных окружения:

- `DAILY_REPORT_CRON_ADMIN` — время отправки утреннего отчёта (формат cron или `HH:mm`).
- `DAILY_REPORT_CRON_CHECKINS` — время отправки отчёта по заездам (формат cron или `HH:mm`).
- `TZ` — часовой пояс для расчёта дат.

Для работы также нужны:

- `TELEGRAM_ADMIN_CHAT_ID` — чат для администраторских задач.
- `TELEGRAM_CHECKINS_CHAT_ID` — чат с заездами на сегодня.

Пример подключения планировщика после инициализации Bnovo и Telegram-сервисов:

```ts
import { initDailyReportsScheduler } from './src/modules/dailyReports/dailyReports.scheduler';
import { DailyReportsService } from './src/modules/dailyReports/dailyReports.service';
import { bnovoService } from './src/modules/bnovo/bnovo.service'; // путь подправьте под проект
import { telegramService } from './src/modules/telegram/telegram.service';

const dailyReportsService = new DailyReportsService(bnovoService, telegramService);
initDailyReportsScheduler(dailyReportsService);
```

## Быстрые проверки модулей

### NLU

1. Скопируйте `.env.example` в `.env` и при необходимости заполните переменные.
2. Установите зависимости: `npm install`.
3. Запустите проверку: `npm run test:nlu` или передайте свой текст `npm run test:nlu -- "Привет, сколько стоит?"`.

### Messaging Hub + MongoDB

1. Убедитесь, что в `.env` указан `MONGODB_URI`.
2. Выполните `npm run test:messaging` — скрипт создаст/найдёт контакт, диалог, сохранит сообщение и свяжет бронирование.
