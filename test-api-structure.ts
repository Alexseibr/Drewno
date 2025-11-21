import axios from "axios";

async function testApiStructure() {
  const baseUrl = process.env.BNOVO_API_BASE_URL;
  const accountId = "112070";
  const apiKey = process.env.BNOVO_API_KEY;

  console.log("🔍 Проверка структуры данных из Bnovo API\n");

  // Получаем токен
  const authResponse = await axios.post(
    `${baseUrl}api/v1/auth`,
    {
      id: accountId,
      password: apiKey,
    }
  );

  const token = authResponse.data?.data?.token;

  // Получаем брони
  const response = await axios.get(`${baseUrl}api/v1/bookings`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    params: {
      date_from: "2025-08-01",
      date_to: "2025-11-22",
      offset: 0,
      limit: 1,
    },
  });

  const booking = response.data?.data?.bookings?.[0];

  if (booking) {
    console.log("📋 Полная структура брони:\n");
    console.log(JSON.stringify(booking, null, 2));
    
    console.log("\n\n🔑 Доступные поля:");
    console.log("- ID:", booking.id);
    console.log("- room_name:", booking.room_name);
    console.log("- customer.name:", booking.customer?.name);
    console.log("- customer.notes:", booking.customer?.notes);
    console.log("- services:", booking.services);
    console.log("- extra:", booking.extra);
    console.log("- amount:", booking.amount);
    console.log("- prepayment:", booking.prepayment);
  } else {
    console.log("⚠️ Брони не найдены");
  }
}

testApiStructure().catch(console.error);
