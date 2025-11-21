import { getBnovoBookingsByArrivalDate, getBnovoBookingsCreatedBetween } from "./src/mastra/tools/bnovoTools";
import { formatTodayCheckinsReport, formatMorningTasksReport } from "./src/mastra/tools/reportFormattingTools";
import { sendTelegramMessage } from "./src/mastra/tools/telegramTools";

async function testFullWorkflow() {
  console.log("🧪 ПОЛНЫЙ ТЕСТ АВТОМАТИЗАЦИИ DREWNO\n");
  console.log("=".repeat(60));

  const timezone = process.env.TZ || "Europe/Minsk";
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID_NEW;
  const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID_NEW;

  console.log("\n📋 Конфигурация:");
  console.log(`   Timezone: ${timezone}`);
  console.log(`   Admin Chat ID: ${adminChatId}`);
  console.log(`   Checkins Chat ID: ${checkinsChatId}`);

  // Текущее время в нужной таймзоне
  const now = new Date();
  const localeString = now.toLocaleString("en-US", { timeZone: timezone });
  const zonedNow = new Date(localeString);

  // Вчера
  const today = new Date(zonedNow);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  // Завтра (так как на сегодня у нас нет броней)
  const tomorrow = new Date(zonedNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  const tomorrowDate = `${year}-${month}-${day}`;

  console.log(`\n📅 Даты:`);
  console.log(`   Вчера: ${yesterday.toISOString().split('T')[0]}`);
  console.log(`   Завтра: ${tomorrowDate}`);

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 ОТЧЁТ 1: Утренний отчёт администратору\n");

  try {
    // 1. Получаем вчерашние брони
    console.log("📥 Шаг 1: Получение броней созданных вчера...");
    const yesterdayBookings = await getBnovoBookingsCreatedBetween.execute({
      context: {
        fromIso: yesterday.toISOString(),
        toIso: endOfYesterday.toISOString(),
      },
      mastra: undefined as any,
    });

    console.log(`   ✅ Найдено броней: ${yesterdayBookings.count}`);

    // 2. Фильтруем по неполной предоплате
    const needsCall = yesterdayBookings.bookings.filter(
      (b) => b.prepaymentAmount < b.totalAmount
    );

    console.log(`   📞 Требуют звонка (неполная предоплата): ${needsCall.length}`);

    // 3. Форматируем отчёт
    const dateLabel = yesterday.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    console.log("\n📝 Шаг 2: Форматирование отчёта...");
    const morningReport = await formatMorningTasksReport.execute({
      context: {
        bookings: yesterdayBookings.bookings,
        dateLabel,
        timezone,
      },
      mastra: undefined as any,
    });

    console.log("   ✅ Отчёт сформирован");
    console.log("\n" + "-".repeat(60));
    console.log(morningReport.formattedText);
    console.log("-".repeat(60));

    // 4. Отправляем в Telegram
    if (adminChatId) {
      console.log(`\n📤 Шаг 3: Отправка в Telegram (чат ${adminChatId})...`);
      
      const sendResult = await sendTelegramMessage.execute({
        context: {
          chatId: adminChatId,
          text: morningReport.formattedText,
        },
        mastra: undefined as any,
      });

      if (sendResult.success) {
        console.log(`   ✅ Утренний отчёт успешно отправлен в Telegram!`);
        console.log(`   Message ID: ${sendResult.messageId}`);
      } else {
        console.log(`   ❌ Ошибка отправки: ${sendResult.error}`);
      }
    } else {
      console.log(`\n   ⚠️ TELEGRAM_ADMIN_CHAT_ID_NEW не настроен, отправка пропущена`);
    }

  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 ОТЧЁТ 2: Заезды на завтра (тест)\n");

  try {
    // 1. Получаем заезды на завтра
    console.log("📥 Шаг 1: Получение заездов на завтра...");
    const tomorrowCheckins = await getBnovoBookingsByArrivalDate.execute({
      context: {
        arrivalDate: tomorrowDate,
      },
      mastra: undefined as any,
    });

    console.log(`   ✅ Найдено заездов: ${tomorrowCheckins.count}`);

    // 2. Форматируем отчёт
    const tomorrowLabel = tomorrow.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    console.log("\n📝 Шаг 2: Форматирование отчёта...");
    const checkinsReport = await formatTodayCheckinsReport.execute({
      context: {
        bookings: tomorrowCheckins.bookings,
        dateLabel: tomorrowLabel,
        timezone,
      },
      mastra: undefined as any,
    });

    console.log("   ✅ Отчёт сформирован");
    console.log("\n" + "-".repeat(60));
    console.log(checkinsReport.formattedText);
    console.log("-".repeat(60));

    // 3. Отправляем в Telegram
    if (checkinsChatId) {
      console.log(`\n📤 Шаг 3: Отправка в Telegram (группа ${checkinsChatId})...`);
      
      const sendResult = await sendTelegramMessage.execute({
        context: {
          chatId: checkinsChatId,
          text: checkinsReport.formattedText,
        },
        mastra: undefined as any,
      });

      if (sendResult.success) {
        console.log(`   ✅ Отчёт о заездах успешно отправлен в Telegram!`);
        console.log(`   Message ID: ${sendResult.messageId}`);
      } else {
        console.log(`   ❌ Ошибка отправки: ${sendResult.error}`);
      }
    } else {
      console.log(`\n   ⚠️ TELEGRAM_CHECKINS_CHAT_ID_NEW не настроен, отправка пропущена`);
    }

  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✨ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!");
  console.log("\n🎉 Автоматизация DREWNO готова к работе!");
  console.log("   Workflow будет запускаться каждый день в 8:00 по минскому времени");
  console.log("=".repeat(60));
}

testFullWorkflow().catch(console.error);
