import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";

/**
 * Tool: Send Telegram message
 */
export const sendTelegramMessage = createTool({
  id: "telegram-send-message",
  description: "Отправляет текстовое сообщение в Telegram чат",
  
  inputSchema: z.object({
    chatId: z.string().describe("ID чата в Telegram"),
    text: z.string().describe("Текст сообщения для отправки"),
    parseMode: z.enum(["HTML", "Markdown", "MarkdownV2"]).optional().describe("Режим форматирования текста"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.number().optional(),
    error: z.string().optional(),
  }),

  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [sendTelegramMessage] Отправка сообщения в Telegram", {
      chatId: context.chatId,
      textLength: context.text.length,
    });

    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        throw new Error("TELEGRAM_BOT_TOKEN not configured");
      }

      const response = await axios.post(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          chat_id: context.chatId,
          text: context.text,
          parse_mode: context.parseMode,
        },
        {
          timeout: 10000,
        }
      );

      if (response.data?.ok) {
        logger?.info("✅ [sendTelegramMessage] Сообщение отправлено успешно", {
          messageId: response.data.result?.message_id,
        });

        return {
          success: true,
          messageId: response.data.result?.message_id,
        };
      } else {
        logger?.error("❌ [sendTelegramMessage] Telegram API вернул ошибку", {
          response: response.data,
        });

        return {
          success: false,
          error: response.data?.description || "Unknown error",
        };
      }
    } catch (error: any) {
      logger?.error("❌ [sendTelegramMessage] Ошибка отправки", {
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  },
});
