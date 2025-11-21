import axios from "axios";

async function testDecember() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Проверка броней на декабрь 2025:\n");

  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  // Период: весь декабрь 2025
  const dateFrom = "2025-12-01";
  const dateTo = "2025-12-31";

  console.log(`📅 Период: ${dateFrom} - ${dateTo}\n`);

  const response = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: dateFrom,
      date_to: dateTo,
      offset: 0,
      limit: 20,
    },
  });

  const bookings = response.data?.data?.bookings || [];
  
  console.log(`📊 Найдено броней: ${bookings.length}\n`);

  if (bookings.length > 0) {
    console.log("📋 ПЕРВАЯ БРОНЬ - полная структура:\n");
    console.log(JSON.stringify(bookings[0], null, 2));
    
    console.log("\n\n📋 Список всех броней:\n");
    bookings.forEach((booking: any, index: number) => {
      console.log(`${index + 1}. ID: ${booking.id}`);
      console.log(`   Гость: ${booking.guest?.name || booking.guestName || booking.guest_name || 'N/A'}`);
      console.log(`   Комната: ${booking.room?.title || booking.roomTitle || booking.room_name || 'N/A'}`);
      console.log(`   Заезд: ${booking.arrival || booking.arrivalDate || booking.arrival_date || 'N/A'}`);
      console.log(`   Выезд: ${booking.departure || booking.departureDate || booking.departure_date || 'N/A'}`);
      console.log();
    });
  } else {
    console.log("ℹ️  Брони на декабрь не найдены через API");
    console.log("\n⚠️  Возможные причины:");
    console.log("   1. Неправильный BNOVO_HOTEL_ID (сейчас: 38797)");
    console.log("   2. У API ключа нет доступа к этим данным");
    console.log("   3. Брони имеют специальный статус, который API не возвращает");
  }
}

testDecember().catch(console.error);
