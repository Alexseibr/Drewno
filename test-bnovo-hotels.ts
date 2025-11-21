import axios from "axios";

async function testHotels() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Проверка доступных отелей:\n");

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;
  console.log(`✅ Авторизован\n`);

  // Попробуем разные эндпоинты для получения списка отелей
  const endpoints = [
    "/hotels",
    "/hotel",
    "/objects",
    "/properties",
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 Пробую GET ${endpoint}`);
    
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` },
        validateStatus: () => true,
      });

      console.log(`   Статус: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   ✅ Найден! Данные:`);
        console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
      } else if (response.status === 404) {
        console.log(`   ❌ Эндпоинт не найден`);
      } else {
        console.log(`   ⚠️ Ответ:`, JSON.stringify(response.data).substring(0, 200));
      }
    } catch (error: any) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
    
    console.log();
  }

  console.log("\n📝 Текущие настройки:");
  console.log(`   BNOVO_HOTEL_ID: ${process.env.BNOVO_HOTEL_ID}`);
  console.log(`   BNOVO_ACCOUNT_ID: ${accountId}`);
}

testHotels().catch(console.error);
