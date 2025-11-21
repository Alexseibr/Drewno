import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";

/**
 * Bnovo Service Types
 */
const BnovoServiceItemSchema = z.object({
  id: z.string(),
  code: z.string().optional(),
  title: z.string(),
  price: z.number().optional(),
  quantity: z.number().optional(),
  comment: z.string().optional(),
});

const BnovoBookingSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  arrivalDate: z.string(),
  departureDate: z.string(),
  guestName: z.string(),
  phone: z.string().optional(),
  roomId: z.string(),
  roomTitle: z.string(),
  adults: z.number(),
  children: z.number(),
  totalAmount: z.number(),
  prepaymentAmount: z.number(),
  currency: z.string(),
  status: z.string(),
  arrivalTimeFrom: z.string().optional(),
  arrivalTimeTo: z.string().optional(),
  comment: z.string().optional(),
  services: z.array(BnovoServiceItemSchema).optional(),
});

/**
 * Get Bearer Token from Bnovo API
 */
async function getBnovoAuthToken(logger?: any): Promise<string> {
  const baseUrl = process.env.BNOVO_API_BASE_URL;
  const accountId = process.env.BNOVO_ACCOUNT_ID;
  const apiKey = process.env.BNOVO_API_KEY;

  if (!baseUrl || !accountId || !apiKey) {
    const error = "Bnovo API credentials not configured (BNOVO_API_BASE_URL, BNOVO_ACCOUNT_ID, BNOVO_API_KEY)";
    logger?.error("❌ [getBnovoAuthToken]", { error });
    throw new Error(error);
  }

  try {
    logger?.info("🔑 [getBnovoAuthToken] Получение Bearer token");
    
    const response = await axios.post(
      `${baseUrl}api/v1/auth`,
      {
        id: accountId,
        password: apiKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const token = response.data?.data?.access_token;
    
    if (!token) {
      throw new Error("Access token not found in response");
    }

    logger?.info("✅ [getBnovoAuthToken] Bearer token получен");
    return token;
  } catch (error: any) {
    logger?.error("❌ [getBnovoAuthToken] Ошибка получения токена", {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Fetch all bookings with pagination (API returns max 20 per request)
 */
async function fetchAllBookings(
  token: string,
  baseUrl: string,
  hotelId: string,
  dateFrom: string,
  dateTo: string,
  logger?: any
): Promise<any[]> {
  const allBookings: any[] = [];
  let offset = 0;
  const limit = 20;
  
  while (true) {
    const response = await axios.get(`${baseUrl}api/v1/bookings`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      params: {
        hotel_id: hotelId,
        date_from: dateFrom,
        date_to: dateTo,
        offset,
        limit,
      },
      timeout: 15000,
    });

    const bookings = response.data?.data?.bookings || [];
    allBookings.push(...bookings);
    
    const total = response.data?.data?.meta?.total || 0;
    
    logger?.info(`📦 [fetchAllBookings] Получено ${bookings.length} броней (offset=${offset}, total=${total})`);
    
    // Если получили меньше limit или достигли total, останавливаемся
    if (bookings.length < limit || allBookings.length >= total) {
      break;
    }
    
    offset += limit;
  }
  
  return allBookings;
}

/**
 * Tool: Get bookings created between dates
 */
export const getBnovoBookingsCreatedBetween = createTool({
  id: "bnovo-get-bookings-created-between",
  description: "Получает список броней из Bnovo, созданных в указанный период времени",
  
  inputSchema: z.object({
    fromIso: z.string().describe("Начало периода в формате ISO (например, 2024-01-01T00:00:00.000Z)"),
    toIso: z.string().describe("Конец периода в формате ISO (например, 2024-01-02T23:59:59.999Z)"),
  }),

  outputSchema: z.object({
    bookings: z.array(BnovoBookingSchema),
    count: z.number(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [getBnovoBookingsCreatedBetween] Запрос броней из Bnovo", {
      fromIso: context.fromIso,
      toIso: context.toIso,
    });

    const baseUrl = process.env.BNOVO_API_BASE_URL;
    const hotelId = process.env.BNOVO_HOTEL_ID;

    if (!baseUrl || !hotelId) {
      const error = "Bnovo API credentials not configured (BNOVO_API_BASE_URL, BNOVO_HOTEL_ID)";
      logger?.error("❌ [getBnovoBookingsCreatedBetween]", { error });
      throw new Error(error);
    }

    try {
      const token = await getBnovoAuthToken(logger);

      const dateFrom = context.fromIso.split('T')[0];
      const dateTo = context.toIso.split('T')[0];

      logger?.info(`📅 [getBnovoBookingsCreatedBetween] Период создания: ${dateFrom} - ${dateTo}`);

      // Получаем все брони за период создания
      const rawBookings = await fetchAllBookings(token, baseUrl, hotelId, dateFrom, dateTo, logger);
      
      // Фильтруем по точной дате создания (ISO timestamp)
      const fromDate = new Date(context.fromIso);
      const toDate = new Date(context.toIso);
      
      const filtered = rawBookings.filter((b: any) => {
        const createDate = new Date(b.dates?.create_date || '');
        return createDate >= fromDate && createDate <= toDate;
      });

      const bookings = filtered.map((raw: any) => mapBookingFromApi(raw));

      logger?.info("✅ [getBnovoBookingsCreatedBetween] Получено броней", {
        count: bookings.length,
      });

      return {
        bookings,
        count: bookings.length,
      };
    } catch (error: any) {
      logger?.error("❌ [getBnovoBookingsCreatedBetween] Ошибка API", {
        error: error.message,
      });
      throw error;
    }
  },
});

/**
 * Tool: Get bookings by arrival date
 */
export const getBnovoBookingsByArrivalDate = createTool({
  id: "bnovo-get-bookings-by-arrival-date",
  description: "Получает список броней из Bnovo с заездом в указанную дату",
  
  inputSchema: z.object({
    arrivalDate: z.string().describe("Дата заезда в формате YYYY-MM-DD (например, 2024-01-15)"),
  }),

  outputSchema: z.object({
    bookings: z.array(BnovoBookingSchema),
    count: z.number(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [getBnovoBookingsByArrivalDate] Запрос броней по дате заезда", {
      arrivalDate: context.arrivalDate,
    });

    const baseUrl = process.env.BNOVO_API_BASE_URL;
    const hotelId = process.env.BNOVO_HOTEL_ID;

    if (!baseUrl || !hotelId) {
      const error = "Bnovo API credentials not configured (BNOVO_API_BASE_URL, BNOVO_HOTEL_ID)";
      logger?.error("❌ [getBnovoBookingsByArrivalDate]", { error });
      throw new Error(error);
    }

    try {
      const token = await getBnovoAuthToken(logger);

      // API фильтрует по дате СОЗДАНИЯ, а не заезда
      // Поэтому запрашиваем брони, созданные за последние 180 дней
      const now = new Date();
      const past = new Date(now);
      past.setDate(past.getDate() - 180);
      
      const dateFrom = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;
      const dateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      logger?.info(`📅 [getBnovoBookingsByArrivalDate] Запрос броней созданных: ${dateFrom} - ${dateTo}`);
      logger?.info(`🎯 [getBnovoBookingsByArrivalDate] Фильтруем по дате заезда: ${context.arrivalDate}`);

      // Получаем все брони
      const rawBookings = await fetchAllBookings(token, baseUrl, hotelId, dateFrom, dateTo, logger);

      // Фильтруем по дате заезда на клиентской стороне
      const targetDate = context.arrivalDate;
      const filtered = rawBookings.filter((b: any) => {
        const arrival = (b.dates?.arrival || '').substring(0, 10);
        return arrival === targetDate;
      });

      const bookings = filtered.map((raw: any) => mapBookingFromApi(raw));

      logger?.info("✅ [getBnovoBookingsByArrivalDate] Получено броней", {
        count: bookings.length,
      });

      return {
        bookings,
        count: bookings.length,
      };
    } catch (error: any) {
      logger?.error("❌ [getBnovoBookingsByArrivalDate] Ошибка API", {
        error: error.message,
      });
      throw error;
    }
  },
});

/**
 * Helper function to map booking from API format to our schema
 */
function mapBookingFromApi(raw: any): z.infer<typeof BnovoBookingSchema> {
  const customerName = raw.customer?.name || "";
  const customerSurname = raw.customer?.surname || "";
  const fullName = `${customerName} ${customerSurname}`.trim();

  return {
    id: String(raw.id || ""),
    createdAt: raw.dates?.create_date || "",
    arrivalDate: (raw.dates?.arrival || "").substring(0, 19),
    departureDate: (raw.dates?.departure || "").substring(0, 19),
    guestName: fullName || "Не указано",
    phone: raw.customer?.phone ? String(raw.customer.phone) : undefined,
    roomId: String(raw.id || ""),
    roomTitle: raw.room_name || "Не указана",
    adults: Number(raw.extra?.adults || 0),
    children: Number(raw.extra?.children || 0),
    totalAmount: Number(raw.amount || 0),
    prepaymentAmount: Number(raw.prepayment || raw.amount_provider || 0),
    currency: "BYN",
    status: raw.status?.name || "",
    arrivalTimeFrom: undefined,
    arrivalTimeTo: undefined,
    comment: raw.customer?.notes || undefined,
    services: undefined,
  };
}
