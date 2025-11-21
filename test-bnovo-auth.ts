import axios from "axios";

async function testAuthMethods() {
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;

  console.log("🔍 Тестирование методов авторизации Bnovo API:\n");

  const authVariants = [
    {
      name: "X-Api-Key header",
      config: {
        headers: { "X-Api-Key": apiKey },
        params: { hotel_id: hotelId, limit: 1 },
      }
    },
    {
      name: "X-API-Key header (uppercase)",
      config: {
        headers: { "X-API-Key": apiKey },
        params: { hotel_id: hotelId, limit: 1 },
      }
    },
    {
      name: "Authorization Bearer header",
      config: {
        headers: { "Authorization": `Bearer ${apiKey}` },
        params: { hotel_id: hotelId, limit: 1 },
      }
    },
    {
      name: "api_key in params",
      config: {
        params: { api_key: apiKey, hotel_id: hotelId, limit: 1 },
      }
    },
    {
      name: "X-Auth-Token header",
      config: {
        headers: { "X-Auth-Token": apiKey },
        params: { hotel_id: hotelId, limit: 1 },
      }
    },
  ];

  for (const variant of authVariants) {
    console.log(`📡 Пробуем: ${variant.name}`);
    
    try {
      const response = await axios.get(`${baseUrl}/bookings`, {
        ...variant.config,
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`   Статус: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ УСПЕХ! Работающий метод найден!`);
        const data = response.data;
        console.log(`   Тип данных: ${typeof data}`);
        if (data) {
          console.log(`   Ключи: ${Object.keys(data).join(", ")}`);
          if (data.bookings) {
            console.log(`   Количество броней: ${data.bookings?.length || 0}`);
          }
        }
        break;
      } else {
        const msg = response.data?.error?.message || response.data?.message || response.statusText;
        console.log(`   ❌ ${response.status}: ${msg}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }
    
    console.log();
  }
}

testAuthMethods().catch(console.error);
