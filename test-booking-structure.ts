import { getBnovoBookingsByArrivalDate } from "./src/mastra/tools/bnovoTools";
import axios from "axios";

async function testBookingStructure() {
  console.log("🔍 Проверка структуры данных из Bnovo API\n");

  // Используем готовый tool для получения броней
  const result = await getBnovoBookingsByArrivalDate.execute({
    context: {
      arrivalDate: "2025-11-22",
    },
    mastra: undefined as any,
  });

  console.log(`✅ Найдено броней: ${result.count}\n`);

  if (result.bookings.length > 0) {
    const booking = result.bookings[0];
    
    console.log("📋 Структура обработанной брони:");
    console.log(JSON.stringify(booking, null, 2));
    
    console.log("\n\n🔍 Теперь получим RAW данные из API...\n");
    
    // Получаем RAW данные напрямую
    const baseUrl = process.env.BNOVO_API_BASE_URL;
    const accountId = "112070";
    const apiKey = process.env.BNOVO_API_KEY;

    const authResponse = await axios.post(
      `${baseUrl}api/v1/auth`,
      {
        id: accountId,
        password: apiKey,
      }
    );

    const token = authResponse.data?.data?.token;

    const rawResponse = await axios.get(`${baseUrl}api/v1/bookings`, {
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

    const rawBooking = rawResponse.data?.data?.bookings?.[0];
    
    if (rawBooking) {
      console.log("📋 RAW структура брони из API:");
      console.log(JSON.stringify(rawBooking, null, 2));
      
      console.log("\n\n🔑 Важные поля:");
      console.log("- room_name:", rawBooking.room_name);
      console.log("- customer.notes:", rawBooking.customer?.notes);
      console.log("- services:", rawBooking.services);
      console.log("- comment:", rawBooking.comment);
      console.log("- extra:", JSON.stringify(rawBooking.extra, null, 2));
    }
  }
}

testBookingStructure().catch(console.error);
