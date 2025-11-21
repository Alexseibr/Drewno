import axios, { AxiosInstance } from 'axios';
import { bnovoConfig } from './bnovo.config';
import {
  BnovoAvailabilityItem,
  BnovoAvailabilityRequest,
  BnovoBooking,
  BnovoCreateBookingPayload,
  BnovoCreateBookingResult,
  BnovoServiceItem,
} from './bnovo.types';

export class BnovoService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: bnovoConfig.baseUrl,
      timeout: 10000,
      headers: {
        'X-Api-Key': bnovoConfig.apiKey, // TODO: адаптировать под реальную схему авторизации
      },
    });
  }

  async getBookingsCreatedBetween(fromIso: string, toIso: string): Promise<BnovoBooking[]> {
    try {
      const response = await this.client.get('/bookings', {
        // TODO: заменить endpoint/параметры под реальное API Bnovo
        params: {
          hotel_id: bnovoConfig.hotelId,
          created_from: fromIso,
          created_to: toIso,
        },
      });

      const rawBookings = response.data?.bookings || response.data || [];
      return Array.isArray(rawBookings) ? rawBookings.map((raw) => this.mapBookingFromApi(raw)) : [];
    } catch (error) {
      console.error('[BnovoService] Ошибка получения броней по дате создания', error);
      return [];
    }
  }

  async getBookingsByArrivalDate(arrivalDate: string): Promise<BnovoBooking[]> {
    try {
      const response = await this.client.get('/bookings', {
        // TODO: заменить endpoint/параметры под реальное API Bnovo
        params: {
          hotel_id: bnovoConfig.hotelId,
          arrival_date: arrivalDate,
        },
      });

      const rawBookings = response.data?.bookings || response.data || [];
      return Array.isArray(rawBookings) ? rawBookings.map((raw) => this.mapBookingFromApi(raw)) : [];
    } catch (error) {
      console.error('[BnovoService] Ошибка получения броней по дате заезда', error);
      return [];
    }
  }

  async getBookingById(bookingId: string): Promise<BnovoBooking | null> {
    try {
      const response = await this.client.get(`/bookings/${bookingId}`, {
        // TODO: заменить endpoint/параметры под реальное API Bnovo
        params: {
          hotel_id: bnovoConfig.hotelId,
        },
      });

      const data = response.data?.booking || response.data;
      if (!data) {
        return null;
      }

      return this.mapBookingFromApi(data);
    } catch (error) {
      console.error('[BnovoService] Ошибка получения брони по ID', error);
      return null;
    }
  }

  async getAvailability(params: BnovoAvailabilityRequest): Promise<BnovoAvailabilityItem[]> {
    try {
      const response = await this.client.get('/availability', {
        // TODO: заменить endpoint/параметры под реальное API Bnovo
        params: {
          hotel_id: bnovoConfig.hotelId,
          arrival_date: params.arrivalDate,
          departure_date: params.departureDate,
          adults: params.adults,
          children: params.children ?? 0,
        },
      });

      const rawItems = response.data?.rooms || response.data || [];
      if (!Array.isArray(rawItems)) {
        return [];
      }

      return rawItems.map((room: any) => ({
        roomId: String(room.id ?? room.room_id ?? ''),
        roomTitle: room.title || room.room_title || 'Номер',
        availableUnits: room.available_units ?? room.available ?? 0,
        minPrice: room.min_price ?? room.price ?? 0,
        currency: room.currency || 'BYN',
      }));
    } catch (error) {
      console.error('[BnovoService] Ошибка получения доступности номеров', error);
      return [];
    }
  }

  async createBooking(payload: BnovoCreateBookingPayload): Promise<BnovoCreateBookingResult> {
    try {
      const response = await this.client.post('/bookings', {
        // TODO: заменить endpoint/формат тела под реальное API Bnovo
        hotel_id: bnovoConfig.hotelId,
        guest: {
          name: payload.guestName,
          phone: payload.phone,
          email: payload.email,
        },
        room_id: payload.roomId,
        arrival_date: payload.arrivalDate,
        departure_date: payload.departureDate,
        adults: payload.adults,
        children: payload.children ?? 0,
        comment: payload.comment,
        services: payload.services?.map((service) => ({
          id: service.serviceId,
          quantity: service.quantity ?? 1,
        })),
        prepayment_amount: payload.prepaymentAmount ?? 0,
      });

      return {
        id: String(response.data?.id ?? response.data?.booking_id ?? ''),
        confirmationNumber: response.data?.confirmation_number,
      };
    } catch (error) {
      console.error('[BnovoService] Ошибка создания брони', error);
      throw error;
    }
  }

  private mapBookingFromApi(raw: any): BnovoBooking {
    // TODO: адаптировать под реальный формат ответа Bnovo
    const guest = raw.guest || {};
    const room = raw.room || {};

    const services: BnovoServiceItem[] | undefined = Array.isArray(raw.services || raw.service_items)
      ? (raw.services || raw.service_items).map((service: any) => ({
          id: String(service.id ?? service.service_id ?? ''),
          code: service.code,
          title: service.title || service.name || 'Услуга',
          price: service.price ?? service.amount,
          quantity: service.quantity ?? 1,
        }))
      : undefined;

    return {
      id: String(raw.id ?? raw.booking_id ?? ''),
      externalId: raw.external_id,
      createdAt: raw.created_at || raw.createdAt || '',
      arrivalDate: raw.arrival_date || raw.arrivalDate || '',
      departureDate: raw.departure_date || raw.departureDate || '',
      guestName: raw.guest_name || guest.name || '',
      phone: raw.phone || guest.phone,
      email: raw.email || guest.email,
      roomId: String(raw.room_id ?? room.id ?? ''),
      roomTitle: raw.room_title || room.title || 'Номер',
      adults: Number(raw.adults ?? 0),
      children: Number(raw.children ?? 0),
      totalAmount: Number(raw.total_amount ?? raw.total ?? 0),
      prepaymentAmount: Number(raw.prepayment_amount ?? raw.prepayment ?? 0),
      currency: raw.currency || 'BYN',
      status: raw.status || raw.booking_status || '',
      arrivalTimeFrom: raw.arrival_time_from || raw.arrivalTimeFrom,
      arrivalTimeTo: raw.arrival_time_to || raw.arrivalTimeTo,
      comment: raw.comment || raw.notes,
      services,
    };
  }
}

export const bnovoService = new BnovoService();
