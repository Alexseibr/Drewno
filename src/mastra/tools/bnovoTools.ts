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
      `${baseUrl}/auth`,
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

      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        params: {
          hotel_id: hotelId,
          date_from: dateFrom,
          date_to: dateTo,
          created_from: context.fromIso,
          created_to: context.toIso,
          offset: 0,
          limit: 20,
        },
        timeout: 15000,
      });

      const rawBookings = response.data?.data?.bookings || [];
      const bookings = Array.isArray(rawBookings)
        ? rawBookings.map((raw: any) => mapBookingFromApi(raw))
        : [];

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

      const arrivalDate = new Date(context.arrivalDate);
      const nextDay = new Date(arrivalDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dateTo = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`;

      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        params: {
          hotel_id: hotelId,
          date_from: context.arrivalDate,
          date_to: dateTo,
          arrival: context.arrivalDate,
          offset: 0,
          limit: 20,
        },
        timeout: 15000,
      });

      const rawBookings = response.data?.data?.bookings || [];
      const bookings = Array.isArray(rawBookings)
        ? rawBookings.map((raw: any) => mapBookingFromApi(raw))
        : [];

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
  return {
    id: String(raw.id || raw.booking_id || ""),
    createdAt: raw.created_at || raw.createdAt || "",
    arrivalDate: raw.arrival || raw.arrival_date || raw.arrivalDate || "",
    departureDate: raw.departure || raw.departure_date || raw.departureDate || "",
    guestName: raw.guest?.name || raw.guest_name || raw.guestName || "",
    phone: raw.guest?.phone || raw.phone || raw.guest_phone || undefined,
    roomId: String(raw.room?.id || raw.room_id || raw.roomId || ""),
    roomTitle: raw.room?.title || raw.room_name || raw.roomTitle || "",
    adults: Number(raw.adults || raw.adults_count || 0),
    children: Number(raw.children || raw.children_count || 0),
    totalAmount: Number(raw.amount || raw.total_amount || raw.totalAmount || 0),
    prepaymentAmount: Number(raw.prepayment || raw.prepayment_amount || raw.prepaymentAmount || 0),
    currency: raw.currency || "BYN",
    status: raw.status || "",
    arrivalTimeFrom: raw.arrival_time?.from || raw.arrival_time_from || undefined,
    arrivalTimeTo: raw.arrival_time?.to || raw.arrival_time_to || undefined,
    comment: raw.comment || raw.notes || undefined,
    services: raw.services?.map((s: any) => ({
      id: String(s.id || ""),
      code: s.code || undefined,
      title: s.title || s.name || "",
      price: s.price ? Number(s.price) : undefined,
      quantity: s.quantity ? Number(s.quantity) : undefined,
      comment: s.comment || undefined,
    })) || undefined,
  };
}
