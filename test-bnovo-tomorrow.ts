import axios from "axios";

async function testTomorrowBookings() {
  const accountId = "112070";
  const password = process.env.BNOVO_API_KEY;
  const hotelId = process.env.BNOVO_HOTEL_ID;
  const baseUrl = "https://api.pms.bnovo.ru/api/v1";

  console.log("🔍 Проверка броней на завтра:\n");

  // Авторизация
  const authResponse = await axios.post(`${baseUrl}/auth`, {
    id: accountId,
    password: password,
  });

  const token = authResponse.data.data.access_token;

  // Завтрашняя дата
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const tomorrowDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const dayAfterDate = `${dayAfterTomorrow.getFullYear()}-${String(dayAfterTomorrow.getMonth() + 1).padStart(2, "0")}-${String(dayAfterTomorrow.getDate()).padStart(2, "0")}`;

  console.log(`📅 Дата завтра: ${tomorrowDate}\n`);

  // Запрос броней на завтра
  const response = await axios.get(`${baseUrl}/bookings`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: {
      hotel_id: hotelId,
      date_from: tomorrowDate,
      date_to: dayAfterDate,
      arrival: tomorrowDate,
      offset: 0,
      limit: 20,
    },
  });

  const bookings = response.data?.data?.bookings || [];
  
  console.log(`📊 Найдено заездов на завтра: ${bookings.length}\n`);

  if (bookings.length > 0) {
    console.log("📋 Список заездов:\n");
    bookings.forEach((booking: any, index: number) => {
      console.log(`${index + 1}. Бронь ID: ${booking.id}`);
      console.log(`   Гость: ${booking.guest?.name || booking.guestName || 'N/A'}`);
      console.log(`   Телефон: ${booking.guest?.phone || booking.phone || 'N/A'}`);
      console.log(`   Комната: ${booking.room?.title || booking.roomTitle || 'N/A'}`);
      console.log(`   Заезд: ${booking.arrival || booking.arrivalDate || 'N/A'}`);
      console.log(`   Выезд: ${booking.departure || booking.departureDate || 'N/A'}`);
      console.log(`   Взрослых: ${booking.adults || 0}, Детей: ${booking.children || 0}`);
      console.log(`   Сумма: ${booking.amount || booking.totalAmount || 0} ${booking.currency || 'BYN'}`);
      console.log(`   Предоплата: ${booking.prepayment || booking.prepaymentAmount || 0} ${booking.currency || 'BYN'}`);
      console.log(`   Статус: ${booking.status || 'N/A'}`);
      
      if (booking.services && booking.services.length > 0) {
        console.log(`   Услуги:`);
        booking.services.forEach((service: any) => {
          console.log(`     - ${service.title || service.name}: ${service.price || 0} x ${service.quantity || 1}`);
        });
      }
      
      console.log();
    });
  } else {
    console.log("ℹ️  На завтра заездов не найдено");
  }
}

testTomorrowBookings().catch((error) => {
  console.error("❌ Ошибка:", error.message);
  if (error.response) {
    console.error("Статус:", error.response.status);
    console.error("Данные:", JSON.stringify(error.response.data, null, 2));
  }
});
