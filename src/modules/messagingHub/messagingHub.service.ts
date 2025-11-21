import crypto from "crypto";

export type MessagingChannel = "telegram" | "instagram";

export interface Contact {
  id: string;
  channel: MessagingChannel;
  externalId: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  contactId: string;
  channel: MessagingChannel;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface StoredMessage {
  id: string;
  contactId: string;
  conversationId: string;
  channel: MessagingChannel;
  direction: "in" | "out";
  text: string;
  timestamp: Date;
  externalMessageId?: string;
}

class MessagingHubService {
  private contacts: Contact[] = [];
  private conversations: Conversation[] = [];
  private messages: StoredMessage[] = [];

  async findOrCreateContactByExternalId(
    channel: MessagingChannel,
    externalId: string,
  ): Promise<Contact> {
    const existing = this.contacts.find(
      (c) => c.channel === channel && c.externalId === externalId,
    );

    if (existing) {
      return existing;
    }

    const contact: Contact = {
      id: crypto.randomUUID(),
      channel,
      externalId,
      createdAt: new Date(),
    };

    this.contacts.push(contact);
    return contact;
  }

  async findOrCreateConversation(
    contactId: string,
    channel: MessagingChannel,
  ): Promise<Conversation> {
    const existing = this.conversations.find(
      (conversation) =>
        conversation.contactId === contactId && conversation.channel === channel,
    );

    if (existing) {
      return existing;
    }

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      contactId,
      channel,
      createdAt: new Date(),
    };

    this.conversations.push(conversation);
    return conversation;
  }

  async appendMessage(message: Omit<StoredMessage, "id">): Promise<StoredMessage> {
    const stored: StoredMessage = { id: crypto.randomUUID(), ...message };
    this.messages.push(stored);
    return stored;
  }

  async listMessages(conversationId: string): Promise<StoredMessage[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const messagingHubService = new MessagingHubService();
