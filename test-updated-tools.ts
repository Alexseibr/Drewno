import { getBnovoBookingsByArrivalDate, getBnovoBookingsCreatedBetween } from "./src/mastra/tools/bnovoTools";

async function testUpdatedTools() {
  console.log("🧪 Тестирование обновлённых Bnovo tools:\n");

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  console.log(`📅 Тест 1: Заезды на завтра (${tomorrowDate})`);
  try {
    const result = await getBnovoBookingsByArrivalDate.execute({
      context: {
        arrivalDate: tomorrowDate,
      },
      mastra: undefined as any,
    });

    console.log(`   ✅ Найдено: ${result.count} броней\n`);
    
    if (result.bookings && result.bookings.length > 0) {
      console.log("   📋 Брони:");
      result.bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.guestName} - ${b.roomTitle}`);
        console.log(`      Заезд: ${b.arrivalDate}, Выезд: ${b.departureDate}`);
        console.log(`      Сумма: ${b.totalAmount} BYN, Предоплата: ${b.prepaymentAmount} BYN`);
        console.log();
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}\n`);
  }

  // Тест 2: Брони созданные вчера
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  console.log(`📅 Тест 2: Брони созданные вчера`);
  try {
    const result = await getBnovoBookingsCreatedBetween.execute({
      context: {
        fromIso: yesterday.toISOString(),
        toIso: endOfYesterday.toISOString(),
      },
      mastra: undefined as any,
    });

    console.log(`   ✅ Найдено: ${result.count} броней\n`);
    
    if (result.bookings && result.bookings.length > 0) {
      console.log("   📋 Брони:");
      result.bookings.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.guestName} - ${b.roomTitle}`);
        console.log(`      Создана: ${b.createdAt}`);
        console.log(`      Сумма: ${b.totalAmount} BYN`);
        console.log();
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}\n`);
  }

  console.log("✨ Тестирование завершено!");
}

testUpdatedTools().catch(console.error);
