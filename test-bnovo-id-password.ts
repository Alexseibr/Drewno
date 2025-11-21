import axios from "axios";

async function testIdPassword() {
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Тестирование с полями id и password:\n");

  const attempts = [
    {
      name: "id=hotel_id, password=api_key",
      data: {
        id: hotelId,
        password: apiKey,
      },
    },
    {
      name: "id=api_key, password=hotel_id",
      data: {
        id: apiKey,
        password: hotelId,
      },
    },
    {
      name: "id=hotel_id, password=api_key + hotel_id в params",
      data: {
        id: hotelId,
        password: apiKey,
        hotel_id: hotelId,
      },
    },
  ];

  for (const attempt of attempts) {
    console.log(`📡 ${attempt.name}`);
    
    try {
      const response = await axios.post(
        `${baseUrl}/auth`,
        attempt.data,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      console.log(`   Статус: ${response.status}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ УСПЕХ!`);
        console.log(`   Ответ:`, JSON.stringify(response.data, null, 2));
        
        const token = response.data?.token || response.data?.access_token || response.data?.bearer_token;
        if (token) {
          console.log(`\n   🎟️  Получен токен, проверяю...`);
          
          const testResponse = await axios.get(`${baseUrl}/bookings`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
            params: { hotel_id: hotelId, limit: 1 },
            timeout: 10000,
            validateStatus: () => true,
          });
          
          console.log(`   📡 Тест /bookings: ${testResponse.status}`);
          if (testResponse.status === 200) {
            console.log(`   ✅ ✅ ✅ ВСЁ РАБОТАЕТ!`);
            console.log(`   Брони:`, JSON.stringify(testResponse.data).substring(0, 200));
          }
        }
        break;
      } else {
        const msg = response.data?.error?.message || response.data?.message || response.statusText;
        console.log(`   ❌ ${response.status}: ${msg}`);
        if (response.data) {
          console.log(`   Детали:`, JSON.stringify(response.data).substring(0, 200));
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Исключение: ${error.message}`);
    }
    
    console.log();
  }
}

testIdPassword().catch(console.error);
