import axios from "axios";

export interface AvailabilityRequest {
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
}

export interface AvailabilityItem {
  roomId: string;
  available: boolean;
  totalPrice?: number;
  currency?: string;
}

async function getBnovoAuthToken(): Promise<string> {
  const baseUrl = process.env.BNOVO_API_BASE_URL;
  const accountId = process.env.BNOVO_ACCOUNT_ID;
  const apiKey = process.env.BNOVO_API_KEY;

  if (!baseUrl || !accountId || !apiKey) {
    throw new Error("Bnovo API credentials are not configured");
  }

  const response = await axios.post(
    `${baseUrl}api/v1/auth`,
    { id: accountId, password: apiKey },
    { headers: { "Content-Type": "application/json" }, timeout: 10000 },
  );

  const token = response.data?.data?.access_token;
  if (!token) {
    throw new Error("Failed to obtain Bnovo token");
  }

  return token;
}

async function tryFetchAvailability(
  request: AvailabilityRequest,
): Promise<AvailabilityItem[]> {
  const baseUrl = process.env.BNOVO_API_BASE_URL;
  const hotelId = process.env.BNOVO_HOTEL_ID;

  if (!baseUrl || !hotelId) {
    return [];
  }

  try {
    const token = await getBnovoAuthToken();
    const response = await axios.get(`${baseUrl}api/v1/availability`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        hotel_id: hotelId,
        arrival_date: request.arrivalDate,
        departure_date: request.departureDate,
        adults: request.adults,
        children: request.children ?? 0,
      },
      timeout: 10000,
    });

    const items = response.data?.data?.rooms as
      | { id: string; available: boolean; price?: number; currency?: string }[]
      | undefined;

    if (!items || items.length === 0) {
      return [];
    }

    return items.map((item) => ({
      roomId: item.id,
      available: Boolean(item.available),
      totalPrice: item.price,
      currency: item.currency,
    }));
  } catch (error) {
    console.warn("[bnovoService] Failed to fetch availability, fallback to mock", { error });
    return [];
  }
}

export const bnovoService = {
  async getAvailability(request: AvailabilityRequest): Promise<AvailabilityItem[]> {
    const liveAvailability = await tryFetchAvailability(request);

    if (liveAvailability.length > 0) {
      return liveAvailability;
    }

    // Fallback mock data keeps dialog logic working even without API access
    return [
      { roomId: "h1", available: true, totalPrice: 15000, currency: "RUB" },
      { roomId: "h2", available: true, totalPrice: 15000, currency: "RUB" },
      { roomId: "h3", available: false },
      { roomId: "h4", available: true, totalPrice: 24000, currency: "RUB" },
    ];
  },
};
