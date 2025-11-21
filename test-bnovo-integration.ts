import { getBnovoBookingsCreatedBetween, getBnovoBookingsByArrivalDate } from "./src/mastra/tools/bnovoTools";

async function testBnovoIntegration() {
  console.log("🧪 Тестирование интеграции с Bnovo API...\n");

  // Получаем даты для тестирования
  const timezone = process.env.TZ || "Europe/Minsk";
  const now = new Date();
  const localeString = now.toLocaleString("en-US", { timeZone: timezone });
  const zonedNow = new Date(localeString);

  // Вчера (для теста броней созданных вчера)
  const today = new Date(zonedNow);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  // Сегодня (для теста заездов)
  const year = zonedNow.getFullYear();
  const month = String(zonedNow.getMonth() + 1).padStart(2, "0");
  const day = String(zonedNow.getDate()).padStart(2, "0");
  const todayDate = `${year}-${month}-${day}`;

  console.log(`📅 Часовой пояс: ${timezone}`);
  console.log(`📅 Тестовые даты:`);
  console.log(`   - Вчера: ${yesterday.toISOString()} - ${endOfYesterday.toISOString()}`);
  console.log(`   - Сегодня: ${todayDate}\n`);

  // Тест 1: Получение броней созданных вчера
  console.log("🔍 Тест 1: Получение броней созданных вчера");
  try {
    const result1 = await getBnovoBookingsCreatedBetween.execute({
      context: {
        fromIso: yesterday.toISOString(),
        toIso: endOfYesterday.toISOString(),
      },
      mastra: undefined as any,
    });

    console.log(`✅ Успешно получено ${result1.count} броней`);
    if (result1.bookings && result1.bookings.length > 0) {
      console.log(`   Первая бронь: ID=${result1.bookings[0].id}, Гость=${result1.bookings[0].guestName}`);
    }
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
  }

  console.log();

  // Тест 2: Получение заездов на сегодня
  console.log("🔍 Тест 2: Получение заездов на сегодня");
  try {
    const result2 = await getBnovoBookingsByArrivalDate.execute({
      context: {
        arrivalDate: todayDate,
      },
      mastra: undefined as any,
    });

    console.log(`✅ Успешно получено ${result2.count} заездов`);
    if (result2.bookings && result2.bookings.length > 0) {
      console.log(`   Первый заезд: ID=${result2.bookings[0].id}, Гость=${result2.bookings[0].guestName}, Комната=${result2.bookings[0].roomName}`);
    }
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
  }

  console.log("\n✨ Тестирование завершено!");
}

testBnovoIntegration().catch(console.error);
