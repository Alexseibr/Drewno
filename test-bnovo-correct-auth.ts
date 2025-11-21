import axios from "axios";

async function testCorrectAuth() {
  const accountId = "112070"; // Account ID из интерфейса
  const password = process.env.BNOVO_API_KEY; // Пароль (ключ)
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Авторизация с правильными учётными данными:\n");
  console.log(`Account ID: ${accountId}`);
  console.log(`Hotel ID: ${hotelId}\n`);

  // Шаг 1: Получаем Bearer token через /auth
  console.log("📡 Шаг 1: Получение Bearer token через POST /auth");
  
  try {
    const authResponse = await axios.post(
      `${baseUrl}/auth`,
      {
        id: accountId,
        password: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    console.log(`   Статус: ${authResponse.status}`);
    
    if (authResponse.status === 200 || authResponse.status === 201) {
      console.log(`   ✅ Авторизация успешна!`);
      
      const token = authResponse.data?.token || authResponse.data?.access_token || authResponse.data?.bearer_token;
      
      if (token) {
        console.log(`   🎟️  Получен Bearer token: ${token.substring(0, 50)}...\n`);
        
        // Шаг 2: Проверяем токен на получении броней
        console.log("📡 Шаг 2: Тестирование получения броней с токеном");
        
        const bookingsResponse = await axios.get(`${baseUrl}/bookings`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          params: {
            hotel_id: hotelId,
            limit: 3,
          },
          timeout: 15000,
          validateStatus: () => true,
        });

        console.log(`   Статус: ${bookingsResponse.status}`);
        
        if (bookingsResponse.status === 200) {
          console.log(`   ✅ ✅ ✅ ИНТЕГРАЦИЯ РАБОТАЕТ!\n`);
          
          const data = bookingsResponse.data;
          const bookings = data?.bookings || data;
          
          console.log(`   📊 Найдено броней: ${bookings?.length || 0}`);
          
          if (bookings && bookings.length > 0) {
            console.log(`\n   Пример первой брони:`);
            const first = bookings[0];
            console.log(`   - ID: ${first.id}`);
            console.log(`   - Гость: ${first.guest?.name || first.guestName || first.guest_name || 'N/A'}`);
            console.log(`   - Заезд: ${first.arrival || first.arrivalDate || first.arrival_date || 'N/A'}`);
            console.log(`   - Выезд: ${first.departure || first.departureDate || first.departure_date || 'N/A'}`);
            console.log(`   - Комната: ${first.room?.title || first.roomTitle || first.room_title || 'N/A'}`);
            console.log(`   - Сумма: ${first.totalAmount || first.total_amount || first.amount || 'N/A'}`);
          }
          
          console.log(`\n   ✅ Правильная конфигурация:`);
          console.log(`   - Base URL: ${baseUrl}`);
          console.log(`   - Account ID: ${accountId}`);
          console.log(`   - Password: используйте BNOVO_API_KEY`);
          console.log(`   - Hotel ID: ${hotelId}`);
          
        } else {
          console.log(`   ❌ Ошибка получения броней: ${bookingsResponse.status}`);
          console.log(`   Ответ: ${JSON.stringify(bookingsResponse.data).substring(0, 200)}`);
        }
      } else {
        console.log(`   ⚠️  Токен не найден в ответе`);
        console.log(`   Ответ:`, JSON.stringify(authResponse.data));
      }
    } else {
      console.log(`   ❌ Ошибка авторизации: ${authResponse.status}`);
      console.log(`   Ответ:`, JSON.stringify(authResponse.data).substring(0, 300));
    }
  } catch (error: any) {
    console.log(`   ❌ Исключение: ${error.message}`);
    if (error.response) {
      console.log(`   Статус: ${error.response.status}`);
      console.log(`   Данные: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
  }
}

testCorrectAuth().catch(console.error);
