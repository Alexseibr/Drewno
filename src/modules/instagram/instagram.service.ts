import axios, { AxiosInstance } from 'axios';
import { instagramConfig } from './instagram.config';
import { mapWebhookToIncomingMessages } from './instagram.mapper';
import { InstagramIncomingMessage, InstagramWebhookPayload } from './instagram.types';

export interface Contact {
  id: string;
  instagramId?: string;
  // Extend with other contact fields as needed.
}

export interface MessagingHubService {
  findOrCreateContactByInstagramId: (instagramId: string) => Promise<Contact>;
  appendMessageToConversation: (options: {
    contactId: string;
    channel: 'instagram';
    direction: 'in' | 'out';
    externalId?: string;
    text?: string;
    attachments?: unknown[];
    timestamp: Date;
  }) => Promise<void>;
}

// TODO: Replace this stub with an actual implementation from the messaging hub.
export const messagingHubService: MessagingHubService = {
  async findOrCreateContactByInstagramId(instagramId: string): Promise<Contact> {
    console.warn('[InstagramService] messagingHubService.findOrCreateContactByInstagramId is not implemented.');
    return { id: instagramId, instagramId };
  },
  async appendMessageToConversation(): Promise<void> {
    console.warn('[InstagramService] messagingHubService.appendMessageToConversation is not implemented.');
  },
};

export class InstagramService {
  private readonly httpClient: AxiosInstance;

  constructor(private readonly hubService: MessagingHubService = messagingHubService) {
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
    const url = `/me/messages`;

    try {
      await this.httpClient.post(
        url,
        {
          recipient: { id: instagramUserId },
          message: { text },
          access_token: instagramConfig.pageAccessToken,
        },
        {
          // TODO: confirm whether token should be passed via params or body for the selected endpoint.
          params: { access_token: instagramConfig.pageAccessToken },
        },
      );
    } catch (error) {
      console.error('[InstagramService] Failed to send message to Instagram user', error);
    }
  }

  private async processIncomingMessage(message: InstagramIncomingMessage): Promise<void> {
    const contact = await this.hubService.findOrCreateContactByInstagramId(message.senderId);

    await this.hubService.appendMessageToConversation({
      contactId: contact.id,
      channel: 'instagram',
      direction: 'in',
      externalId: message.raw && typeof message.raw === 'object' && 'message' in (message.raw as Record<string, unknown>)
        ? (message.raw as { message?: { mid?: string } }).message?.mid
        : undefined,
      text: message.text,
      attachments: message.attachments,
      timestamp: new Date(message.timestamp),
    });

    // TODO: trigger optional autoresponder/bot workflow if required.
  }
}

export const instagramService = new InstagramService();
