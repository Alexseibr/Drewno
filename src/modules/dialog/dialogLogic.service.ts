import { bnovoService } from "../bnovo/bnovo.service";
import { buildBookingLink } from "../booking/bookingLink";
import { selectAvailableHouses } from "../booking/houseSelection";
import { instagramClient } from "../instagram/instagram.client";
import { messagingHubService, MessagingChannel } from "../messagingHub/messagingHub.service";
import { nluService, IntentName } from "../nlu/nlu.service";
import { telegramService } from "../telegram/telegram.service";

export interface DialogContext {
  channel: MessagingChannel;
  contactId: string;
  conversationId: string;
  externalUserId: string;
}

export interface IncomingDialogPayload {
  text: string;
  timestamp?: Date;
  adults?: number;
  children?: number;
  arrivalDate?: string;
  departureDate?: string;
}

async function sendReply(ctx: DialogContext, text: string) {
  await messagingHubService.appendMessage({
    contactId: ctx.contactId,
    conversationId: ctx.conversationId,
    channel: ctx.channel,
    direction: "out",
    text,
    timestamp: new Date(),
  });

  if (ctx.channel === "telegram") {
    await telegramService.sendMessage(ctx.externalUserId, text);
  } else if (ctx.channel === "instagram") {
    await instagramClient.sendMessageToUser(ctx.externalUserId, text);
  }
}

function extractDates(text: string): { arrival?: string; departure?: string } {
  // Supports DD.MM.YYYY or YYYY-MM-DD
  const datePattern = /(\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})/g;
  const matches = text.match(datePattern) || [];

  if (matches.length >= 2) {
    return { arrival: matches[0], departure: matches[1] };
  }

  return {};
}

function extractNumbers(text: string): number[] {
  return (text.match(/\d+/g) || []).map((n) => Number(n));
}

function extractGuests(text: string): { adults?: number; children?: number } {
  const numbers = extractNumbers(text);
  if (numbers.length === 0) {
    return {};
  }

  if (numbers.length === 1) {
    return { adults: numbers[0] };
  }

  return { adults: numbers[0], children: numbers[1] };
}

function summarizeAvailability(
  availableHouses: ReturnType<typeof selectAvailableHouses>,
  currency?: string,
  price?: number,
): string {
  if (availableHouses.length === 0) {
    return "К сожалению, подходящих домиков на эти даты нет.";
  }

  const housesList = availableHouses.map((house) => `• ${house.title}`).join("\n");
  const priceLine = price ? `\nПримерная стоимость: ${price} ${currency ?? "RUB"}.` : "";
  return `Свободные варианты:\n${housesList}${priceLine}`;
}

class DialogLogicService {
  async handleIncomingMessage(
    ctx: DialogContext,
    payload: IncomingDialogPayload,
  ) {
    const intent = nluService.detectIntent(payload.text);

    switch (intent.intent) {
      case "availability":
        await this.handleAvailability(ctx, payload, intent.intent);
        break;
      case "price":
        await this.handlePrice(ctx, payload, intent.intent);
        break;
      case "addons":
        await sendReply(ctx, "Можем предложить баню и купель. Добавить что-то из этого к бронированию?");
        break;
      case "booking":
        await this.handleBooking(ctx, payload);
        break;
      default:
        await sendReply(
          ctx,
          "Напишите, пожалуйста, дату прибытия/выезда и количество гостей, чтобы подсказать по свободным домикам.",
        );
    }
  }

  private async handleAvailability(
    ctx: DialogContext,
    payload: IncomingDialogPayload,
    _intent: IntentName,
  ) {
    const { arrivalDate, departureDate, adults, children } = this.resolveBookingParams(payload);

    if (!arrivalDate || !departureDate) {
      await sendReply(ctx, "Уточните, пожалуйста, даты заезда и выезда.");
      return;
    }

    if (!adults) {
      await sendReply(ctx, "Сколько взрослых и детей поедет?");
      return;
    }

    const availability = await bnovoService.getAvailability({
      arrivalDate,
      departureDate,
      adults,
      children,
    });

    const availableHouses = selectAvailableHouses(availability, adults + (children ?? 0));
    const price = availability.find((room) => room.roomId === availableHouses[0]?.id)?.totalPrice;
    const currency = availability.find((room) => room.roomId === availableHouses[0]?.id)?.currency;

    const summary = summarizeAvailability(availableHouses, currency, price);
    const bookingLink = buildBookingLink({ arrivalDate, departureDate, adults, children, houseId: availableHouses[0]?.id });

    const reply = bookingLink
      ? `${summary}\n\nСсылка на бронирование: ${bookingLink}`
      : `${summary}\n\nГотов оформить бронь? Могу прислать ссылку.`;

    await sendReply(ctx, reply);
  }

  private async handlePrice(ctx: DialogContext, payload: IncomingDialogPayload, _intent: IntentName) {
    const { arrivalDate, departureDate, adults, children } = this.resolveBookingParams(payload);

    if (!arrivalDate || !departureDate) {
      await sendReply(ctx, "Чтобы подсчитать стоимость, пришлите даты заезда и выезда.");
      return;
    }

    if (!adults) {
      await sendReply(ctx, "Напишите, сколько взрослых и детей планируется.");
      return;
    }

    const availability = await bnovoService.getAvailability({
      arrivalDate,
      departureDate,
      adults,
      children,
    });

    const availableHouses = selectAvailableHouses(availability, adults + (children ?? 0));
    const price = availability.find((room) => room.roomId === availableHouses[0]?.id)?.totalPrice;
    const currency = availability.find((room) => room.roomId === availableHouses[0]?.id)?.currency;

    if (!availableHouses.length) {
      await sendReply(ctx, "На выбранные даты нет свободных домиков. Предложить другие даты?");
      return;
    }

    const priceLine = price
      ? `Стоимость от ${price} ${currency ?? "RUB"} за весь период.\n`
      : "";
    const housesList = availableHouses.map((house) => `• ${house.title}`).join("\n");

    await sendReply(
      ctx,
      `${priceLine}Свободные варианты:\n${housesList}\nХотите оформить бронь?`,
    );
  }

  private async handleBooking(ctx: DialogContext, payload: IncomingDialogPayload) {
    const { arrivalDate, departureDate, adults, children } = this.resolveBookingParams(payload);

    if (!arrivalDate || !departureDate || !adults) {
      await sendReply(
        ctx,
        "Пришлите даты заезда/выезда и количество гостей, чтобы я сформировал ссылку на бронь.",
      );
      return;
    }

    const availability = await bnovoService.getAvailability({
      arrivalDate,
      departureDate,
      adults,
      children,
    });

    const availableHouses = selectAvailableHouses(availability, adults + (children ?? 0));
    const bookingLink = buildBookingLink({
      arrivalDate,
      departureDate,
      adults,
      children,
      houseId: availableHouses[0]?.id,
    });

    if (!availableHouses.length) {
      await sendReply(ctx, "Не вижу доступных домиков на эти даты. Подскажете альтернативные даты?");
      return;
    }

    const housesList = availableHouses.map((house) => `• ${house.title}`).join("\n");
    const linkLine = bookingLink ? `\nСсылка на бронь: ${bookingLink}` : "";

    await sendReply(ctx, `Готово! Свободные варианты:\n${housesList}${linkLine}`);
  }

  private resolveBookingParams(payload: IncomingDialogPayload) {
    const dates = extractDates(payload.text);
    const guests = extractGuests(payload.text);

    return {
      arrivalDate: payload.arrivalDate ?? dates.arrival,
      departureDate: payload.departureDate ?? dates.departure,
      adults: payload.adults ?? guests.adults,
      children: payload.children ?? guests.children,
    };
  }
}

export const dialogLogicService = new DialogLogicService();
export { sendReply };
