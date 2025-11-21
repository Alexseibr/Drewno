export interface BnovoServiceItem {
  id: string;
  code?: string;
  title: string;
  price?: number;
  quantity?: number;
}

export interface BnovoBooking {
  id: string;
  createdAt: string;
  arrivalDate: string;
  departureDate: string;
  guestName: string;
  phone?: string;
  roomId: string;
  roomTitle: string;
  adults: number;
  children: number;
  totalAmount: number;
  prepaymentAmount: number;
  currency: string;
  status: string;
  arrivalTimeFrom?: string;
  arrivalTimeTo?: string;
  comment?: string;
  services?: BnovoServiceItem[];
}

export interface BnovoAvailabilityRequest {
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
}

export interface BnovoAvailabilityItem {
  roomId: string;
  roomTitle: string;
  availableUnits: number;
  minPrice: number;
  currency: string;
}

export interface BnovoCreateBookingPayload {
  guestName: string;
  phone?: string;
  email?: string;
  arrivalDate: string;
  departureDate: string;
  roomId: string;
  adults: number;
  children?: number;
  comment?: string;
  services?: { serviceId: string; quantity?: number }[];
  prepaymentAmount?: number;
}

export interface BnovoCreateBookingResult {
  id: string;
  confirmationNumber?: string;
}
