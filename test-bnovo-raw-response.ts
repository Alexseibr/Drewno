import axios from "axios";

async function testRawResponse() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Проверка реальной структуры данных:\n");

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  // Сегодня и завтра
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterDate = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, "0")}-${String(dayAfter.getDate()).padStart(2, "0")}`;

  console.log(`📅 Период: ${today} - ${dayAfterDate}\n`);

  const response = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: today,
      date_to: dayAfterDate,
      offset: 0,
      limit: 5,
    },
  });

  const bookings = response.data?.data?.bookings || [];
  
  console.log(`📊 Найдено броней: ${bookings.length}\n`);

  if (bookings.length > 0) {
    console.log("📋 СЫРОЙ JSON первой брони:\n");
    console.log(JSON.stringify(bookings[0], null, 2));
    
    console.log("\n\n📋 Все ключи первой брони:");
    console.log(Object.keys(bookings[0]).join(", "));
  } else {
    console.log("⚠️ Брони не найдены. Проверю без фильтра по arrival:");
    
    const response2 = await axios.get(`${baseUrl}/bookings`, {
      headers: { "Authorization": `Bearer ${token}` },
      params: {
        hotel_id: hotelId,
        date_from: today,
        date_to: dayAfterDate,
        offset: 0,
        limit: 3,
      },
    });
    
    const bookings2 = response2.data?.data?.bookings || [];
    console.log(`\n📊 Найдено без фильтра: ${bookings2.length}\n`);
    
    if (bookings2.length > 0) {
      console.log("📋 СЫРОЙ JSON первой брони:\n");
      console.log(JSON.stringify(bookings2[0], null, 2));
    }
  }
}

testRawResponse().catch((error) => {
  console.error("❌ Ошибка:", error.message);
});
