import axios from "axios";

async function testDifferentFilters() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  console.log("🔍 Тестирование разных фильтров для поиска броней:\n");

  const tests = [
    {
      name: "Брони на сегодня - фильтр arrival",
      params: {
        hotel_id: hotelId,
        date_from: today,
        date_to: tomorrowDate,
        arrival: today,
        offset: 0,
        limit: 20,
      },
    },
    {
      name: "Брони на завтра - фильтр arrival",
      params: {
        hotel_id: hotelId,
        date_from: tomorrowDate,
        date_to: `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate() + 1).padStart(2, "0")}`,
        arrival: tomorrowDate,
        offset: 0,
        limit: 20,
      },
    },
    {
      name: "Все активные брони без arrival",
      params: {
        hotel_id: hotelId,
        date_from: today,
        date_to: tomorrowDate,
        offset: 0,
        limit: 20,
      },
    },
    {
      name: "Брони по статусу (если есть параметр status)",
      params: {
        hotel_id: hotelId,
        date_from: today,
        date_to: tomorrowDate,
        status: "confirmed",
        offset: 0,
        limit: 20,
      },
    },
  ];

  for (const test of tests) {
    console.log(`\n📡 ${test.name}`);
    console.log(`   Параметры: ${JSON.stringify(test.params).substring(0, 100)}...`);
    
    try {
      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: { "Authorization": `Bearer ${token}` },
        params: test.params,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        const bookings = response.data?.data?.bookings || [];
        console.log(`   ✅ Статус 200 | Найдено: ${bookings.length} броней`);
        
        if (bookings.length > 0) {
          const first = bookings[0];
          console.log(`   📋 Первая бронь - полные данные:`);
          console.log(JSON.stringify(first, null, 2));
          break; // Нашли данные, можем остановиться
        }
      } else {
        console.log(`   ❌ Статус: ${response.status}`);
        if (response.data?.error) {
          console.log(`   Ошибка: ${response.data.error.message}`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }
  }
}

testDifferentFilters().catch(console.error);
