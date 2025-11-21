import axios from "axios";

async function testHistory() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Проверка исторических данных:\n");

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  // Период: последние 60 дней
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 60);
  
  const pastDate = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  console.log(`📅 Период: ${pastDate} - ${today} (последние 60 дней)\n`);

  const response = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: pastDate,
      date_to: today,
      offset: 0,
      limit: 20,
    },
  });

  const bookings = response.data?.data?.bookings || [];
  
  console.log(`📊 Найдено броней: ${bookings.length}\n`);

  if (bookings.length > 0) {
    console.log("📋 Примеры броней:\n");
    bookings.slice(0, 5).forEach((booking: any, index: number) => {
      console.log(`${index + 1}. ID: ${booking.id}`);
      console.log(`   Гость: ${booking.guest?.name || 'N/A'}`);
      console.log(`   Комната: ${booking.room?.title || 'N/A'}`);
      console.log(`   Заезд: ${booking.arrival || 'N/A'} | Выезд: ${booking.departure || 'N/A'}`);
      console.log(`   Создана: ${booking.created_at || 'N/A'}`);
      console.log(`   Сумма: ${booking.amount || 0} / Предоплата: ${booking.prepayment || 0}`);
      console.log();
    });
    
    console.log("\n✅ Интеграция с Bnovo работает! API возвращает данные корректно.");
  } else {
    console.log("ℹ️  Исторических броней тоже не найдено");
    console.log("   Возможно, это новый аккаунт или тестовая среда");
  }
}

testHistory().catch((error) => {
  console.error("❌ Ошибка:", error.message);
});
