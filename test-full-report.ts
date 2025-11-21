import { getBnovoBookingsByArrivalDate, getBnovoBookingsCreatedBetween } from "./src/mastra/tools/bnovoTools";
import { formatTodayCheckinsReport, formatMorningTasksReport } from "./src/mastra/tools/reportFormattingTools";
import { sendTelegramMessage } from "./src/mastra/tools/telegramTools";

async function testFullReport() {
  console.log("🧪 Тестирование полной генерации и отправки отчётов:\n");

  const timezone = process.env.TZ || "Europe/Minsk";
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID;

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

  // Сегодня
  const year = zonedNow.getFullYear();
  const month = String(zonedNow.getMonth() + 1).padStart(2, "0");
  const day = String(zonedNow.getDate()).padStart(2, "0");
  const todayDate = `${year}-${month}-${day}`;

  console.log("📅 Даты:");
  console.log(`   Вчера: ${yesterday.toISOString().split('T')[0]}`);
  console.log(`   Сегодня: ${todayDate}\n`);

  // ========== ОТЧЁТ 1: Утренний отчёт администратору ==========
  console.log("📊 ОТЧЁТ 1: Утренний отчёт администратору\n");

  try {
    // 1. Получаем вчерашние брони
    const yesterdayBookings = await getBnovoBookingsCreatedBetween.execute({
      context: {
        fromIso: yesterday.toISOString(),
        toIso: endOfYesterday.toISOString(),
      },
      mastra: undefined as any,
    });

    console.log(`   ✅ Получено броней за вчера: ${yesterdayBookings.count}`);

    // 2. Фильтруем по неполной предоплате
    const needsCall = yesterdayBookings.bookings.filter(
      (b) => b.prepaymentAmount < b.totalAmount
    );

    console.log(`   📞 Требуют звонка: ${needsCall.length}`);

    // 3. Форматируем отчёт
    const dateLabel = yesterday.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    const morningReport = await formatMorningTasksReport.execute({
      context: {
        bookings: yesterdayBookings.bookings,
        dateLabel,
        timezone,
      },
      mastra: undefined as any,
    });

    console.log(`\n   📝 Сформированный отчёт:\n`);
    console.log(morningReport.formattedText);
    console.log();

    // 4. Отправляем в Telegram
    if (adminChatId) {
      console.log(`   📤 Отправка в Telegram (чат ${adminChatId})...`);
      
      const sendResult = await sendTelegramMessage.execute({
        context: {
          chatId: adminChatId,
          text: morningReport.formattedText,
        },
        mastra: undefined as any,
      });

      if (sendResult.success) {
        console.log(`   ✅ Утренний отчёт отправлен в Telegram!`);
      } else {
        console.log(`   ❌ Ошибка отправки`);
      }
    } else {
      console.log(`   ⚠️ TELEGRAM_ADMIN_CHAT_ID не настроен`);
    }

  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // ========== ОТЧЁТ 2: Заезды на сегодня ==========
  console.log("📊 ОТЧЁТ 2: Заезды на сегодня\n");

  try {
    // 1. Получаем заезды на сегодня
    const todayCheckins = await getBnovoBookingsByArrivalDate.execute({
      context: {
        arrivalDate: todayDate,
      },
      mastra: undefined as any,
    });

    console.log(`   ✅ Получено заездов: ${todayCheckins.count}`);

    // 2. Форматируем отчёт
    const todayLabel = zonedNow.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    const checkinsReport = await formatTodayCheckinsReport.execute({
      context: {
        bookings: todayCheckins.bookings,
        dateLabel: todayLabel,
        timezone,
      },
      mastra: undefined as any,
    });

    console.log(`\n   📝 Сформированный отчёт:\n`);
    console.log(checkinsReport.formattedText);
    console.log();

    // 3. Отправляем в Telegram
    if (checkinsChatId) {
      console.log(`   📤 Отправка в Telegram (чат ${checkinsChatId})...`);
      
      const sendResult = await sendTelegramMessage.execute({
        context: {
          chatId: checkinsChatId,
          text: checkinsReport.formattedText,
        },
        mastra: undefined as any,
      });

      if (sendResult.success) {
        console.log(`   ✅ Отчёт о заездах отправлен в Telegram!`);
      } else {
        console.log(`   ❌ Ошибка отправки`);
      }
    } else {
      console.log(`   ⚠️ TELEGRAM_CHECKINS_CHAT_ID не настроен`);
    }

  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Тестирование завершено!");
  console.log("=".repeat(60));
}

testFullReport().catch(console.error);
