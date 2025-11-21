import { InstagramIncomingAttachment, InstagramIncomingMessage, InstagramWebhookPayload } from './instagram.types';

export function mapWebhookToIncomingMessages(payload: InstagramWebhookPayload): InstagramIncomingMessage[] {
  if (!payload.entry) {
    return [];
  }

  const messages: InstagramIncomingMessage[] = [];

  payload.entry.forEach((entry) => {
    entry.messaging?.forEach((event) => {
      if (!event.message) {
        return;
      }

      const attachments: InstagramIncomingAttachment[] | undefined = event.message.attachments?.map((attachment) => ({
        type: attachment.type,
        url: attachment.payload?.url,
      }));

      messages.push({
        senderId: event.sender.id,
        recipientId: event.recipient.id,
        text: event.message.text,
        attachments,
        timestamp: event.timestamp || Date.now(),
        raw: event,
      });
    });
  });

  return messages;
}
