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
