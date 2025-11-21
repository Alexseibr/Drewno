import axios from "axios";

async function exchangeApiKeyForToken() {
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Попытка обменять API ключ на Bearer token:\n");

  // Разные варианты обмена ключа на токен
  const attempts = [
    {
      name: "POST /auth - username/password формат",
      data: {
        username: apiKey,
        password: "",
        hotel_id: hotelId,
      },
    },
    {
      name: "POST /auth - api_key формат",
      data: {
        api_key: apiKey,
        hotel_id: hotelId,
      },
    },
    {
      name: "POST /auth - token формат",
      data: {
        token: apiKey,
        hotel_id: hotelId,
      },
    },
    {
      name: "POST /auth - client_credentials формат",
      data: {
        grant_type: "client_credentials",
        client_id: hotelId,
        client_secret: apiKey,
      },
    },
    {
      name: "POST /auth - key формат",
      data: {
        key: apiKey,
        hotel_id: hotelId,
      },
    },
    {
      name: "POST /auth - только api_key",
      data: {
        api_key: apiKey,
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
          console.log(`\n   🎟️  Получен токен: ${token.substring(0, 50)}...`);
          
          // Проверим токен
          console.log(`\n   📡 Проверка токена на /bookings`);
          const testResponse = await axios.get(`${baseUrl}/bookings`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
            params: { hotel_id: hotelId, limit: 1 },
            timeout: 10000,
            validateStatus: () => true,
          });
          
          console.log(`   Статус: ${testResponse.status}`);
          if (testResponse.status === 200) {
            console.log(`   ✅ Токен работает!`);
          } else {
            console.log(`   ❌ Токен не работает: ${testResponse.status}`);
          }
        }
        break;
      } else if (response.status === 406) {
        console.log(`   ❌ 406 Validation error`);
        if (response.data?.error?.fields) {
          console.log(`   Отсутствующие поля:`, response.data.error.fields);
        }
        if (response.data) {
          console.log(`   Детали:`, JSON.stringify(response.data).substring(0, 200));
        }
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

exchangeApiKeyForToken().catch(console.error);
