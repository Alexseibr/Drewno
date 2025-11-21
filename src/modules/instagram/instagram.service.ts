import { dialogLogicService } from "../dialog/dialogLogic.service";
import { messagingHubService } from "../messagingHub/messagingHub.service";
import { InstagramIncomingMessage, InstagramWebhookPayload } from "./instagram.types";
import { mapWebhookToIncomingMessages } from "./instagram.mapper";

class InstagramService {
  async handleIncomingWebhook(payload: InstagramWebhookPayload): Promise<void> {
    const messages = mapWebhookToIncomingMessages(payload);

    for (const message of messages) {
      await this.processIncomingMessage(message);
    }
  }

  private async processIncomingMessage(message: InstagramIncomingMessage): Promise<void> {
    const contact = await this.findOrCreateContactByInstagramId(message.senderId);
    const conversation = await this.getOrCreateConversation(contact.id);

    await messagingHubService.appendMessage({
      contactId: contact.id,
      conversationId: conversation.id,
      channel: "instagram",
      direction: "in",
      text: message.text,
      timestamp: message.timestamp ?? new Date(),
      externalMessageId: message.id,
    });

    await dialogLogicService.handleIncomingMessage(
      {
        channel: "instagram",
        contactId: contact.id,
        conversationId: conversation.id,
        externalUserId: message.senderId,
      },
      {
        text: message.text,
        timestamp: message.timestamp,
      },
    );
  }

  async findOrCreateContactByInstagramId(instagramId: string) {
    return messagingHubService.findOrCreateContactByExternalId("instagram", instagramId);
  }

  async getOrCreateConversation(contactId: string) {
    return messagingHubService.findOrCreateConversation(contactId, "instagram");
  }
}

export const instagramService = new InstagramService();
