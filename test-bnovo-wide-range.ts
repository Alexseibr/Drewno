import axios from "axios";

async function testWideRange() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Проверка броней за широкий период:\n");

  // Авторизация
  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  // Период: с сегодня на 30 дней вперёд
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const future = new Date(now);
  future.setDate(future.getDate() + 30);
  const futureDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;

  console.log(`📅 Период: ${today} - ${futureDate}\n`);

  // Запрос всех броней
  const response = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: today,
      date_to: futureDate,
      offset: 0,
      limit: 20,
    },
  });

  const bookings = response.data?.data?.bookings || [];
  
  console.log(`📊 Найдено броней: ${bookings.length}\n`);

  if (bookings.length > 0) {
    console.log("📋 Список броней (первые 10):\n");
    bookings.slice(0, 10).forEach((booking: any, index: number) => {
      console.log(`${index + 1}. ID: ${booking.id} | Гость: ${booking.guest?.name || 'N/A'} | Комната: ${booking.room?.title || 'N/A'}`);
      console.log(`   Заезд: ${booking.arrival || 'N/A'} | Выезд: ${booking.departure || 'N/A'}`);
      console.log(`   Сумма: ${booking.amount || 0} ${booking.currency || 'BYN'} | Предоплата: ${booking.prepayment || 0}`);
      console.log(`   Статус: ${booking.status || 'N/A'}`);
      console.log();
    });
    
    // Группируем по датам заезда
    const byArrivalDate: { [key: string]: number } = {};
    bookings.forEach((b: any) => {
      const arrival = b.arrival || b.arrivalDate || 'N/A';
      byArrivalDate[arrival] = (byArrivalDate[arrival] || 0) + 1;
    });
    
    console.log("📅 Распределение по датам заезда:");
    Object.entries(byArrivalDate).sort().forEach(([date, count]) => {
      console.log(`   ${date}: ${count} брон(ей/и)`);
    });
  } else {
    console.log("ℹ️  Броней не найдено в указанном периоде");
  }
}

testWideRange().catch((error) => {
  console.error("❌ Ошибка:", error.message);
  if (error.response) {
    console.error("Статус:", error.response.status);
    console.error("Данные:", JSON.stringify(error.response.data, null, 2));
  }
});
