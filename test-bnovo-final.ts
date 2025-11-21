import axios from "axios";

async function testFinalIntegration() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Финальное тестирование интеграции Bnovo:\n");

  // Шаг 1: Авторизация
  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;
  console.log(`✅ Получен Bearer token\n`);

  // Подготовка дат
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayDate = `${year}-${month}-${day}`;

  // Шаг 2: Тест получения броней созданных вчера
  console.log("📡 Тест 1: Получение броней созданных вчера");
  const yesterdayResponse = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: yesterday.toISOString().split('T')[0],
      date_to: endOfYesterday.toISOString().split('T')[0],
      created_from: yesterday.toISOString(),
      created_to: endOfYesterday.toISOString(),
      offset: 0,
      limit: 20,
    },
  });

  console.log(`   Ответ:`, JSON.stringify(yesterdayResponse.data).substring(0, 300));
  const yesterdayData = yesterdayResponse.data?.data || yesterdayResponse.data;
  const yesterdayBookings = Array.isArray(yesterdayData) ? yesterdayData : (yesterdayData?.bookings || []);
  console.log(`   ✅ Найдено ${yesterdayBookings.length} броней созданных вчера`);
  
  if (yesterdayBookings.length > 0) {
    const first = yesterdayBookings[0];
    console.log(`   Пример: Гость=${first.guest?.name || first.guestName || 'N/A'}\n`);
  } else {
    console.log(`   (брони отсутствуют)\n`);
  }

  // Шаг 3: Тест получения заездов на сегодня
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  
  console.log("📡 Тест 2: Получение заездов на сегодня");
  const todayResponse = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: todayDate,
      date_to: tomorrowDate,
      arrival: todayDate,
      offset: 0,
      limit: 20,
    },
  });

  console.log(`   Ответ:`, JSON.stringify(todayResponse.data).substring(0, 300));
  const todayData = todayResponse.data?.data || todayResponse.data;
  const todayBookings = Array.isArray(todayData) ? todayData : (todayData?.bookings || []);
  console.log(`   ✅ Найдено ${todayBookings.length} заездов на сегодня`);
  
  if (todayBookings.length > 0) {
    const first = todayBookings[0];
    console.log(`   Пример: Гость=${first.guest?.name || first.guestName || 'N/A'}, Комната=${first.room?.title || first.roomTitle || 'N/A'}\n`);
  } else {
    console.log(`   (заезды отсутствуют)\n`);
  }

  // Шаг 4: Тест общего списка броней за последний месяц
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthAgoDate = monthAgo.toISOString().split('T')[0];

  console.log("📡 Тест 3: Получение всех броней за последний месяц");
  const monthResponse = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: monthAgoDate,
      date_to: todayDate,
      offset: 0,
      limit: 5,
    },
  });

  const monthBookings = monthResponse.data?.bookings || monthResponse.data?.data || [];
  console.log(`   ✅ Найдено ${monthBookings.length} броней за последний месяц (лимит 5)`);
  
  if (monthBookings.length > 0) {
    console.log(`   Примеры:`);
    monthBookings.slice(0, 3).forEach((b: any, i: number) => {
      console.log(`   ${i + 1}. ID=${b.id}, Гость=${b.guest?.name || b.guestName || 'N/A'}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!");
  console.log("=".repeat(60));
  console.log("\n🎉 Интеграция с Bnovo API работает корректно!");
  console.log("\n📝 Найденные требуемые параметры:");
  console.log("   - date_from: начальная дата (YYYY-MM-DD)");
  console.log("   - date_to: конечная дата (YYYY-MM-DD)");
  console.log("   - offset: смещение (обычно 0)");
  console.log("   - hotel_id: ID отеля");
  console.log("   - created_from/created_to: фильтр по дате создания (ISO)");
  console.log("   - arrival: фильтр по дате заезда (YYYY-MM-DD)");
}

testFinalIntegration().catch((error) => {
  console.error("❌ Ошибка:", error.message);
  if (error.response) {
    console.error("Статус:", error.response.status);
    console.error("Данные:", JSON.stringify(error.response.data, null, 2));
  }
});
