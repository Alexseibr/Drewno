import axios from "axios";

async function testHistoricalDetails() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Детальная проверка исторических броней:\n");

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  // Последние 90 дней для увеличения шансов найти данные
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 90);
  
  const pastDate = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  console.log(`📅 Период: ${pastDate} - ${today}\n`);

  // Тест 1: С hotel_id
  console.log("📡 Тест 1: С параметром hotel_id");
  const response1 = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: pastDate,
      date_to: today,
      offset: 0,
      limit: 3,
    },
  });

  const bookings1 = response1.data?.data?.bookings || [];
  console.log(`   Найдено: ${bookings1.length} броней\n`);
  
  if (bookings1.length > 0) {
    console.log("   ПОЛНАЯ СТРУКТУРА первой брони:");
    console.log(JSON.stringify(bookings1[0], null, 2));
    console.log("\n");
  }

  // Тест 2: БЕЗ hotel_id (может определяется автоматически)
  console.log("📡 Тест 2: БЕЗ параметра hotel_id");
  const response2 = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      date_from: pastDate,
      date_to: today,
      offset: 0,
      limit: 3,
    },
    validateStatus: () => true,
  });

  console.log(`   Статус: ${response2.status}`);
  if (response2.status === 200) {
    const bookings2 = response2.data?.data?.bookings || [];
    console.log(`   Найдено: ${bookings2.length} броней`);
    
    if (bookings2.length > 0 && bookings2[0] !== bookings1[0]) {
      console.log("   ⚠️ ДРУГИЕ брони! Возможно hotel_id определяется автоматически");
      console.log("   Первая бронь:");
      console.log(JSON.stringify(bookings2[0], null, 2));
    }
  } else {
    console.log(`   Ошибка: ${response2.data?.error?.message || response2.statusText}`);
  }

  // Тест 3: Попробуем с object_id вместо hotel_id
  console.log("\n📡 Тест 3: С параметром object_id");
  const response3 = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      object_id: hotelId,
      date_from: pastDate,
      date_to: today,
      offset: 0,
      limit: 3,
    },
    validateStatus: () => true,
  });

  console.log(`   Статус: ${response3.status}`);
  const bookings3 = response3.data?.data?.bookings || [];
  console.log(`   Найдено: ${bookings3.length} броней`);
}

testHistoricalDetails().catch(console.error);
