import axios from "axios";

async function debugBnovoAPI() {
  const baseUrl = process.env.BNOVO_API_BASE_URL;
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;

  console.log("🔍 Debug Bnovo API:");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Hotel ID: ${hotelId}`);
  console.log(`API Key length: ${apiKey?.length}\n`);

  // Попробуем несколько вариантов эндпоинтов
  const endpoints = [
    `/bookings`,
    `/v2/bookings`,
    `/v1/bookings`,
    `/booking`,
  ];

  for (const endpoint of endpoints) {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`\n📡 Пробуем: ${fullUrl}`);
    
    try {
      const response = await axios.get(fullUrl, {
        headers: {
          "X-Api-Key": apiKey!,
        },
        params: {
          hotel_id: hotelId,
        },
        timeout: 10000,
        validateStatus: () => true, // Не бросать ошибку на любом статусе
      });

      console.log(`   Статус: ${response.status}`);
      if (response.status === 200) {
        console.log(`   ✅ УСПЕХ!`);
        console.log(`   Тип данных: ${typeof response.data}`);
        if (response.data) {
          console.log(`   Ключи ответа: ${Object.keys(response.data).join(", ")}`);
        }
      } else {
        console.log(`   ❌ Ошибка: ${response.status} - ${response.statusText}`);
        if (response.data) {
          console.log(`   Сообщение: ${JSON.stringify(response.data).substring(0, 200)}`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }
  }
}

debugBnovoAPI().catch(console.error);
