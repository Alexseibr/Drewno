import axios, { AxiosInstance } from 'axios';
import { instagramConfig } from './instagram.config';
import { mapWebhookToIncomingMessages } from './instagram.mapper';
import { InstagramIncomingMessage, InstagramWebhookPayload } from './instagram.types';
import { messagingHubService } from '../messaging';

export class InstagramService {
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      baseURL: 'https://graph.facebook.com/v19.0',
      timeout: 10000,
    });
  }

  async handleIncomingWebhook(payload: InstagramWebhookPayload): Promise<void> {
    const incomingMessages = mapWebhookToIncomingMessages(payload);

    for (const message of incomingMessages) {
      try {
        await this.processIncomingMessage(message);
      } catch (error) {
        console.error('[InstagramService] Failed to process incoming message', error);
      }
    }
  }

  async sendMessageToUser(instagramUserId: string, text: string): Promise<void> {
    // TODO: confirm the exact endpoint/body for Instagram messaging; adjust if Graph API version changes.
    const url = `/me/messages`;

    try {
      await this.httpClient.post(
        url,
        {
          recipient: { id: instagramUserId },
          message: { text },
        },
        {
          params: { access_token: instagramConfig.pageAccessToken },
        },
      );
    } catch (error) {
      console.error('[InstagramService] Failed to send message to Instagram user', error);
    }
  }

  private async processIncomingMessage(message: InstagramIncomingMessage): Promise<void> {
    const contact = await messagingHubService.findOrCreateContactByInstagramId(message.senderId);
    const conversation = await messagingHubService.getOrCreateConversation(contact.id, 'instagram');

    await messagingHubService.appendMessage({
      contactId: contact.id,
      conversationId: conversation.id,
      channel: 'instagram',
      direction: 'in',
      externalId: typeof message.raw === 'object' && message.raw && 'message' in (message.raw as Record<string, unknown>)
        ? (message.raw as { message?: { mid?: string } }).message?.mid
        : undefined,
      text: message.text,
      attachments: message.attachments,
      timestamp: new Date(message.timestamp),
    });
  }
}

export const instagramService = new InstagramService();
