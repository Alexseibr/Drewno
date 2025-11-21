export interface TelegramSendOptions {
  [key: string]: any;
}

export class TelegramService {
  // TODO: Подключить реальный экземпляр Telegraf/Telegram Bot API.
  async sendMessage(chatId: string, text: string, options?: TelegramSendOptions): Promise<void> {
    // Заглушка для интеграции: замените на bot.telegram.sendMessage(...)
    console.info(`[TelegramService] sendMessage → chatId=${chatId}`, { text, options });
  }
}

export const telegramService = new TelegramService();
