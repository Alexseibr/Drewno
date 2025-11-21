import { Context, Telegraf } from 'telegraf';
import { messagingHubService } from '../messaging';

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
