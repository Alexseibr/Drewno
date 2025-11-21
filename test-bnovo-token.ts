import axios from "axios";

async function testAuthFlow() {
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;

  console.log("🔍 Тестирование flow авторизации Bnovo API:\n");

  // Попробуем получить токен через /auth
  console.log("📡 Шаг 1: Получение токена через /auth");
  
  const authMethods = [
    {
      name: "POST /auth с X-Api-Key",
      method: "post",
      headers: { "X-Api-Key": apiKey },
      data: { hotel_id: hotelId },
    },
    {
      name: "POST /auth с api_key в body",
      method: "post",
      headers: {},
      data: { api_key: apiKey, hotel_id: hotelId },
    },
    {
      name: "GET /auth с X-Api-Key",
      method: "get",
      headers: { "X-Api-Key": apiKey },
      params: { hotel_id: hotelId },
    },
  ];

  for (const authMethod of authMethods) {
    console.log(`\n   Пробуем: ${authMethod.name}`);
    
    try {
      const response = await axios({
        method: authMethod.method as any,
        url: `${baseUrl}/auth`,
        headers: authMethod.headers,
        data: (authMethod as any).data,
        params: (authMethod as any).params,
        timeout: 10000,
        validateStatus: () => true,
      });

      console.log(`   Статус: ${response.status}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ Успех!`);
        console.log(`   Ответ:`, JSON.stringify(response.data).substring(0, 200));
        
        // Если получили токен, попробуем сделать запрос с ним
        const token = response.data?.token || response.data?.access_token || response.data?.auth_token;
        if (token) {
          console.log(`\n📡 Шаг 2: Запрос броней с полученным токеном`);
          const bookingsResponse = await axios.get(`${baseUrl}/bookings`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
            params: { hotel_id: hotelId, limit: 1 },
            timeout: 10000,
            validateStatus: () => true,
          });
          
          console.log(`   Статус: ${bookingsResponse.status}`);
          if (bookingsResponse.status === 200) {
            console.log(`   ✅ УСПЕХ! Получены брони!`);
            console.log(`   Данные:`, JSON.stringify(bookingsResponse.data).substring(0, 300));
          } else {
            console.log(`   ❌ ${bookingsResponse.status}: ${bookingsResponse.data?.error?.message || bookingsResponse.statusText}`);
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
  }
}

testAuthFlow().catch(console.error);
