import axios from "axios";

export interface TelegramUpdate {
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number };
  };
}

export class TelegramService {
  async sendMessage(chatId: string, text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    });
  }
}

export const telegramService = new TelegramService();
