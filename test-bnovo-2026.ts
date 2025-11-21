import axios from "axios";

async function test2026() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  console.log("🔍 Проверка броней на 2026 год:\n");

  // Март 2026 (видели бронь на 8 марта)
  const response = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: "2026-01-01",
      date_to: "2026-12-31",
      offset: 0,
      limit: 20,
    },
  });

  const bookings = response.data?.data?.bookings || [];
  
  console.log(`📊 Найдено броней на 2026: ${bookings.length}\n`);

  if (bookings.length > 0) {
    console.log("📋 Список броней:\n");
    bookings.forEach((b: any, index: number) => {
      const arrival = b.dates?.arrival || b.dates?.real_arrival || 'N/A';
      const departure = b.dates?.departure || b.dates?.real_departure || 'N/A';
      const guest = `${b.customer?.name || ''} ${b.customer?.surname || ''}`.trim();
      
      console.log(`${index + 1}. ID: ${b.id} | №${b.number}`);
      console.log(`   Гость: ${guest || 'N/A'}`);
      console.log(`   Комната: ${b.room_name || 'N/A'}`);
      console.log(`   Заезд: ${arrival}`);
      console.log(`   Выезд: ${departure}`);
      console.log(`   Сумма: ${b.amount || 0} BYN`);
      console.log(`   Статус: ${b.status?.name || 'N/A'}`);
      console.log(`   Взрослых: ${b.extra?.adults || 0}, Детей: ${b.extra?.children || 0}`);
      console.log();
    });
  }
  
  console.log("\n✅ Интеграция работает! Теперь обновлю tools под правильную структуру данных.");
}

test2026().catch(console.error);
