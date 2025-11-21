import axios from "axios";

async function testArrivalFilter() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  console.log("🔍 Тестирование разных параметров фильтрации:\n");

  const tests = [
    {
      name: "Без date_from/date_to - все брони",
      params: {
        hotel_id: hotelId,
        offset: 0,
        limit: 10,
      },
    },
    {
      name: "Только статус (новые)",
      params: {
        hotel_id: hotelId,
        status_id: 1,  // "Новое"
        offset: 0,
        limit: 10,
      },
    },
  ];

  for (const test of tests) {
    console.log(`\n📡 ${test.name}`);
    
    try {
      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: { "Authorization": `Bearer ${token}` },
        params: test.params,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        const bookings = response.data?.data?.bookings || [];
        console.log(`   ✅ Найдено: ${bookings.length} броней`);
        
        if (bookings.length > 0) {
          console.log(`\n   Примеры (первые 5):`);
          bookings.slice(0, 5).forEach((b: any) => {
            const arrival = (b.dates?.arrival || '').substring(0, 10);
            const guest = `${b.customer?.name || ''} ${b.customer?.surname || ''}`.trim();
            console.log(`   - ${arrival}: ${guest} | Комната: ${b.room_name || 'N/A'} | Статус: ${b.status?.name}`);
          });
        }
      } else {
        console.log(`   ❌ Статус: ${response.status} - ${response.data?.error?.message}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }
}

testArrivalFilter().catch(console.error);
