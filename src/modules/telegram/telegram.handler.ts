import { dialogLogicService } from "../dialog/dialogLogic.service";
import { messagingHubService } from "../messagingHub/messagingHub.service";
import { TelegramUpdate } from "./telegram.service";

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const text = update.message?.text;
  const chatId = update.message?.chat?.id?.toString();

  if (!text || !chatId) {
    return;
  }

  const contact = await messagingHubService.findOrCreateContactByExternalId("telegram", chatId);
  const conversation = await messagingHubService.findOrCreateConversation(contact.id, "telegram");

  await messagingHubService.appendMessage({
    contactId: contact.id,
    conversationId: conversation.id,
    channel: "telegram",
    direction: "in",
    text,
    timestamp: new Date(),
    externalMessageId: update.message?.message_id?.toString(),
  });

  await dialogLogicService.handleIncomingMessage(
    {
      channel: "telegram",
      contactId: contact.id,
      conversationId: conversation.id,
      externalUserId: chatId,
    },
    { text, timestamp: new Date() },
  );
}
