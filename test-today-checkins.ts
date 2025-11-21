import { getBnovoBookingsByArrivalDate } from "./src/mastra/tools/bnovoTools";
import { formatTodayCheckinsReport } from "./src/mastra/tools/reportFormattingTools";
import { sendTelegramMessage } from "./src/mastra/tools/telegramTools";

async function testTodayCheckins() {
  const timezone = process.env.TZ || "Europe/Minsk";
  const checkinsChatId = process.env.TELEGRAM_CHECKINS_CHAT_ID_NEW;

  console.log("🧪 Тестирование заездов на СЕГОДНЯ (21.11)\n");

  const now = new Date();
  const localeString = now.toLocaleString("en-US", { timeZone: timezone });
  const zonedNow = new Date(localeString);

  const year = zonedNow.getFullYear();
  const month = String(zonedNow.getMonth() + 1).padStart(2, "0");
  const day = String(zonedNow.getDate()).padStart(2, "0");
  const todayDate = `${year}-${month}-${day}`;

  console.log(`📅 Дата: ${todayDate}\n`);

  // 1. Получаем заезды на сегодня
  console.log("📥 Получение заездов на сегодня...");
  const todayCheckins = await getBnovoBookingsByArrivalDate.execute({
    context: {
      arrivalDate: todayDate,
    },
    mastra: undefined as any,
  });

  console.log(`✅ Найдено заездов: ${todayCheckins.count}\n`);

  if (todayCheckins.bookings.length > 0) {
    console.log("📋 Детали броней:\n");
    todayCheckins.bookings.forEach((b, i) => {
      console.log(`${i + 1}. ${b.guestName}`);
      console.log(`   Номер брони: ${b.bookingNumber}`);
      console.log(`   roomNumber: ${b.roomNumber || "не указан"}`);
      console.log(`   roomTitle: ${b.roomTitle || "не указан"}`);
      console.log(`   roomTags: ${b.roomTags || "не указаны"}`);
      console.log(`   planName: ${b.planName || "не указан"}`);
      console.log();
    });

    // 2. Форматируем отчёт
    const todayLabel = zonedNow.toLocaleDateString("ru-RU", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
    });

    console.log("📝 Форматирование отчёта...\n");
    const checkinsReport = await formatTodayCheckinsReport.execute({
      context: {
        bookings: todayCheckins.bookings,
        dateLabel: todayLabel,
        timezone,
      },
      mastra: undefined as any,
    });

    console.log("─".repeat(60));
    console.log(checkinsReport.formattedText);
    console.log("─".repeat(60));

    // 3. Отправляем в Telegram
    if (checkinsChatId) {
      console.log(`\n📤 Отправка в Telegram (группа ${checkinsChatId})...`);
      
      const sendResult = await sendTelegramMessage.execute({
        context: {
          chatId: checkinsChatId,
          text: checkinsReport.formattedText,
        },
        mastra: undefined as any,
      });

      if (sendResult.success) {
        console.log(`✅ Отчёт отправлен! Message ID: ${sendResult.messageId}`);
      } else {
        console.log(`❌ Ошибка отправки: ${sendResult.error}`);
      }
    }
  }

  console.log("\n✨ Тест завершён!");
}

testTodayCheckins().catch(console.error);
