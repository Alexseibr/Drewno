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

    try {
      const baseUrl = process.env.BNOVO_API_BASE_URL;
      const apiKey = process.env.BNOVO_API_KEY;
      const hotelId = process.env.BNOVO_HOTEL_ID;

      if (!baseUrl || !apiKey || !hotelId) {
        throw new Error("Bnovo API credentials not configured");
      }

      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: {
          "X-Api-Key": apiKey,
        },
        params: {
          hotel_id: hotelId,
          created_from: context.fromIso,
          created_to: context.toIso,
        },
        timeout: 10000,
      });

      const rawBookings = response.data?.bookings || response.data || [];
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
      logger?.error("❌ [getBnovoBookingsCreatedBetween] Ошибка", {
        error: error.message,
      });
      return {
        bookings: [],
        count: 0,
      };
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

    try {
      const baseUrl = process.env.BNOVO_API_BASE_URL;
      const apiKey = process.env.BNOVO_API_KEY;
      const hotelId = process.env.BNOVO_HOTEL_ID;

      if (!baseUrl || !apiKey || !hotelId) {
        throw new Error("Bnovo API credentials not configured");
      }

      const response = await axios.get(`${baseUrl}/bookings`, {
        headers: {
          "X-Api-Key": apiKey,
        },
        params: {
          hotel_id: hotelId,
          arrival_date: context.arrivalDate,
        },
        timeout: 10000,
      });

      const rawBookings = response.data?.bookings || response.data || [];
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
      logger?.error("❌ [getBnovoBookingsByArrivalDate] Ошибка", {
        error: error.message,
      });
      return {
        bookings: [],
        count: 0,
      };
    }
  },
});

/**
 * Helper function to map Bnovo API response to our schema
 */
function mapBookingFromApi(raw: any): z.infer<typeof BnovoBookingSchema> {
  const guest = raw.guest || {};
  const room = raw.room || {};

  const services = Array.isArray(raw.services || raw.service_items)
    ? (raw.services || raw.service_items).map((service: any) => ({
        id: String(service.id ?? service.service_id ?? ""),
        code: service.code,
        title: service.title || service.name || "Услуга",
        price: service.price ?? service.amount,
        quantity: service.quantity ?? 1,
        comment: service.comment,
      }))
    : undefined;

  return {
    id: String(raw.id ?? raw.booking_id ?? ""),
    createdAt: raw.created_at || raw.createdAt || "",
    arrivalDate: raw.arrival_date || raw.arrivalDate || "",
    departureDate: raw.departure_date || raw.departureDate || "",
    guestName: raw.guest_name || guest.name || "",
    phone: raw.phone || guest.phone,
    roomId: String(raw.room_id ?? room.id ?? ""),
    roomTitle: raw.room_title || room.title || "Номер",
    adults: Number(raw.adults ?? 0),
    children: Number(raw.children ?? 0),
    totalAmount: Number(raw.total_amount ?? raw.total ?? 0),
    prepaymentAmount: Number(raw.prepayment_amount ?? raw.prepayment ?? 0),
    currency: raw.currency || "BYN",
    status: raw.status || raw.booking_status || "",
    arrivalTimeFrom: raw.arrival_time_from || raw.arrivalTimeFrom,
    arrivalTimeTo: raw.arrival_time_to || raw.arrivalTimeTo,
    comment: raw.comment || raw.notes,
    services,
  };
}
