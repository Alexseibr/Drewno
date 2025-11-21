import { InstagramIncomingMessage, InstagramWebhookPayload } from "./instagram.types";

export function mapWebhookToIncomingMessages(
  payload: InstagramWebhookPayload,
): InstagramIncomingMessage[] {
  const messages: InstagramIncomingMessage[] = [];

  payload.entry?.forEach((entry) => {
    entry.messaging?.forEach((m) => {
      const senderId = m.sender?.id;
      const messageId = m.message?.mid;
      const text = m.message?.text;

      if (!senderId || !messageId || !text) {
        return;
      }

      messages.push({
        id: messageId,
        senderId,
        text,
        timestamp: m.message?.timestamp ? new Date(m.message.timestamp) : undefined,
      });
    });
  });

  return messages;
}
