import axios from "axios";

async function testBearerAuth() {
  const apiKey = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;

  console.log("🔍 Тестирование Bearer Token авторизации:\n");

  const domains = [
    "https://api.bnovo.ru/api/v1",
    "https://api.pms.bnovo.ru/api/v1",
  ];

  for (const baseUrl of domains) {
    console.log(`📡 Тестирую домен: ${baseUrl}`);
    
    try {
      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
        params: {
          hotel_id: hotelId,
          limit: 3,
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      console.log(`   Статус: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ УСПЕХ! Работает!`);
        const data = response.data;
        console.log(`   Тип данных: ${typeof data}`);
        
        if (data) {
          console.log(`   Ключи ответа: ${Object.keys(data).slice(0, 10).join(", ")}`);
          
          if (data.bookings || Array.isArray(data)) {
            const bookings = data.bookings || data;
            console.log(`   📊 Найдено броней: ${bookings.length}`);
            
            if (bookings.length > 0) {
              const first = bookings[0];
              console.log(`\n   Пример брони:`);
              console.log(`   - ID: ${first.id}`);
              console.log(`   - Гость: ${first.guest?.name || first.guestName || first.guest_name || 'N/A'}`);
              console.log(`   - Заезд: ${first.arrival || first.arrivalDate || first.arrival_date || 'N/A'}`);
              console.log(`   - Комната: ${first.room?.title || first.roomTitle || first.room_title || 'N/A'}`);
            }
          } else {
            console.log(`   Данные:`, JSON.stringify(data).substring(0, 300));
          }
        }
        
        console.log(`\n   ✅ Правильный домен найден: ${baseUrl}`);
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

testBearerAuth().catch(console.error);
