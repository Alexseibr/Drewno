import axios from "axios";

async function testFullPaths() {
  const baseUrl = process.env.BNOVO_API_BASE_URL;
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;

  console.log("🔍 Тестирование полных путей Bnovo API:\n");

  // Попробуем различные варианты полного пути
  const fullUrls = [
    `${baseUrl}api/v1/bookings`,
    `${baseUrl}api/v2/bookings`,
    `${baseUrl}api/bookings`,
    `${baseUrl}v1/bookings`,
    `${baseUrl}v2/bookings`,
  ];

  for (const url of fullUrls) {
    console.log(`📡 Пробуем: ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          "X-Api-Key": apiKey!,
        },
        params: {
          hotel_id: hotelId,
          limit: 1, // Ограничим для теста
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`   Статус: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ УСПЕХ!`);
        console.log(`   Данные:`, JSON.stringify(response.data).substring(0, 300));
        break;
      } else if (response.status === 401) {
        console.log(`   ⚠️ Ошибка авторизации - проверьте API ключ`);
      } else if (response.status === 403) {
        console.log(`   ⚠️ Доступ запрещен - проверьте права API ключа`);
      } else {
        console.log(`   ❌ ${response.status}: ${response.data?.error?.message || response.statusText}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }
    
    console.log();
  }
}

testFullPaths().catch(console.error);
