export interface BookingLinkParams {
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
  houseId?: string;
}

export function buildBookingLink(params: BookingLinkParams) {
  const baseUrl = process.env.BOOKING_BASE_URL;

  if (!baseUrl) {
    return "";
  }

  const url = new URL(baseUrl);
  url.searchParams.set("arrival", params.arrivalDate);
  url.searchParams.set("departure", params.departureDate);
  url.searchParams.set("adults", params.adults.toString());
  url.searchParams.set("children", (params.children || 0).toString());
  if (params.houseId) url.searchParams.set("house", params.houseId);
  return url.toString();
}
