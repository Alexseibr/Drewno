import { Context, Telegraf } from 'telegraf';
import { bnovoService } from '../bnovo/bnovo.service';
import { BnovoAvailabilityItem, BnovoAvailabilityRequest, BnovoCreateBookingPayload } from '../bnovo/bnovo.types';
import { messagingHubService } from '../messaging';
import { Contact, Conversation } from '../messaging/messaging.models';
import { nluService } from '../nlu';

function buildContactName(ctx: Context): string | undefined {
  if (!ctx.from) {
    return undefined;
  }

  const fullName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ').trim();
  return fullName || undefined;
}

export function registerTelegramMessagingHubHandlers(bot: Telegraf<Context>): void {
  bot.on('text', async (ctx, next) => {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) {
      if (next) {
        await next();
      }
      return;
    }

    try {
      const contact = await messagingHubService.findOrCreateContactByTelegramId(String(ctx.from.id), {
        name: buildContactName(ctx),
      });

      const conversation = await messagingHubService.getOrCreateConversation(contact.id, 'telegram');

      await messagingHubService.appendMessage({
        contactId: contact.id,
        conversationId: conversation.id,
        channel: 'telegram',
        direction: 'in',
        externalId: String(ctx.message.message_id),
        text: ctx.message.text,
        timestamp: ctx.message.date ? new Date(ctx.message.date * 1000) : new Date(),
      });

      await handleIntent(bot, ctx, contact, conversation, ctx.message.text);
    } catch (error) {
      console.error('[TelegramBot] Failed to process incoming message', error);
    }

    if (next) {
      await next();
    }
  });
}

export async function sendReplyToUser(bot: Telegraf<Context>, contactId: string, text: string): Promise<void> {
  const contact = await messagingHubService.getContactById(contactId);

  if (!contact || !contact.telegramId) {
    throw new Error('Contact not found or missing telegramId');
  }

  const conversation = await messagingHubService.getOrCreateConversation(contact.id, 'telegram');
  const sentMessage = await bot.telegram.sendMessage(contact.telegramId, text);

  await messagingHubService.appendMessage({
    contactId: contact.id,
    conversationId: conversation.id,
    channel: 'telegram',
    direction: 'out',
    externalId: String(sentMessage.message_id),
    text,
    timestamp: sentMessage.date ? new Date(sentMessage.date * 1000) : new Date(),
  });
}

async function handleIntent(
  bot: Telegraf<Context>,
  ctx: Context,
  contact: Contact,
  conversation: Conversation,
  text: string,
): Promise<void> {
  const match = await nluService.detectIntent(text);

  if (!match.action || match.confidence < 0.5) {
    await sendFallback(bot, contact, conversation, match.shortAnswer);
    return;
  }

  switch (match.action) {
    case 'check_availability':
      await handleAvailability(bot, contact, conversation, text);
      break;
    case 'create_booking':
      await handleCreateBooking(bot, contact, conversation, text);
      break;
    case 'send_admin_alert':
      await handleAdminAlert(bot, ctx, contact, conversation, text, match.shortAnswer);
      break;
    default:
      await sendFallback(bot, contact, conversation, match.shortAnswer);
      break;
  }
}

async function handleAvailability(
  bot: Telegraf<Context>,
  contact: Contact,
  conversation: Conversation,
  text: string,
): Promise<void> {
  const availabilityRequest = extractAvailabilityRequest(text);

  if (!availabilityRequest) {
    await sendAndLogMessage(
      bot,
      contact,
      conversation,
      'Напишите, пожалуйста, даты заезда/выезда и сколько будет взрослых/детей.',
    );
    return;
  }

  try {
    const availability = await bnovoService.getAvailability(availabilityRequest);
    const response = formatAvailabilityResponse(availabilityRequest, availability);
    await sendAndLogMessage(bot, contact, conversation, response);
  } catch (error) {
    console.error('[TelegramBot] Failed to fetch availability', error);
    await sendAndLogMessage(
      bot,
      contact,
      conversation,
      'Не удалось получить доступность. Попробуйте позже или уточните данные.',
    );
  }
}

async function handleCreateBooking(
  bot: Telegraf<Context>,
  contact: Contact,
  conversation: Conversation,
  text: string,
): Promise<void> {
  const payload = extractBookingPayload(text);

  if (!payload) {
    await sendAndLogMessage(
      bot,
      contact,
      conversation,
      'Для оформления брони напишите, пожалуйста, ФИО, телефон, даты заезда/выезда и желаемый домик.',
    );
    return;
  }

  try {
    const booking = await bnovoService.createBooking(payload);
    await messagingHubService.linkBookingToConversation(contact.id, conversation.id, booking.id);
    await sendAndLogMessage(
      bot,
      contact,
      conversation,
      `Бронь создана, номер брони: ${booking.confirmationNumber || booking.id}.`,
    );
  } catch (error) {
    console.error('[TelegramBot] Failed to create booking', error);
    await sendAndLogMessage(
      bot,
      contact,
      conversation,
      'Не удалось создать бронь. Пожалуйста, уточните данные или попробуйте позже.',
    );
  }
}

async function handleAdminAlert(
  bot: Telegraf<Context>,
  ctx: Context,
  contact: Contact,
  conversation: Conversation,
  text: string,
  shortAnswer?: string,
): Promise<void> {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId) {
    const username = ctx.from?.username ? `@${ctx.from.username}` : buildContactName(ctx) || 'неизвестный пользователь';
    const alertText = `Новая заявка/сложный вопрос от ${username}, текст: ${text}`;

    try {
      await bot.telegram.sendMessage(adminChatId, alertText);
    } catch (error) {
      console.error('[TelegramBot] Failed to send admin alert', error);
    }
  } else {
    console.warn('[TelegramBot] TELEGRAM_ADMIN_CHAT_ID is not set; cannot send admin alert');
  }

  const responseText = shortAnswer || 'Спасибо! Передал вопрос администратору.';
  await sendAndLogMessage(bot, contact, conversation, responseText);
}

async function sendFallback(
  bot: Telegraf<Context>,
  contact: Contact,
  conversation: Conversation,
  shortAnswer?: string,
): Promise<void> {
  const fallbackText =
    shortAnswer || 'Чтобы помочь с бронью, напишите, пожалуйста, даты заезда/выезда и сколько гостей.';
  await sendAndLogMessage(bot, contact, conversation, fallbackText);
}

async function sendAndLogMessage(
  bot: Telegraf<Context>,
  contact: Contact,
  conversation: Conversation,
  text: string,
): Promise<void> {
  if (!contact.telegramId) {
    console.error('[TelegramBot] Cannot send message: contact missing telegramId');
    return;
  }

  const sentMessage = await bot.telegram.sendMessage(contact.telegramId, text);

  await messagingHubService.appendMessage({
    contactId: contact.id,
    conversationId: conversation.id,
    channel: 'telegram',
    direction: 'out',
    externalId: sentMessage ? String(sentMessage.message_id) : undefined,
    text,
    timestamp: sentMessage?.date ? new Date(sentMessage.date * 1000) : new Date(),
  });
}

function extractAvailabilityRequest(text: string): BnovoAvailabilityRequest | null {
  // TODO: parse text or conversation context to extract arrival/departure dates and guest counts.
  // Placeholder returns null to trigger a clarification prompt.
  return null;
}

function formatAvailabilityResponse(
  request: BnovoAvailabilityRequest,
  availability: BnovoAvailabilityItem[],
): string {
  if (!availability.length) {
    return 'К сожалению, на указанные даты нет свободных вариантов.';
  }

  const lines = availability.map(
    (item, index) =>
      `${index + 1}) ${item.roomTitle} — мин. цена: ${item.minPrice} ${item.currency} (доступно: ${item.availableUnits})`,
  );

  const childrenText = request.children ? ` + ${request.children} дет.` : '';

  return [
    `Доступность на ${request.arrivalDate}–${request.departureDate} для ${request.adults} взр.${childrenText}`,
    '',
    ...lines,
  ].join('\n');
}

function extractBookingPayload(text: string): BnovoCreateBookingPayload | null {
  // TODO: parse user message or stored context to build a full booking payload.
  // Placeholder returns null to ask the user for missing details.
  return null;
}
