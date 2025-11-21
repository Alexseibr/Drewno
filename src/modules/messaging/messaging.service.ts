import { FilterQuery, UpdateQuery } from 'mongoose';
import {
  BookingLink,
  BookingLinkModel,
  Contact,
  ContactModel,
  Conversation,
  ConversationModel,
  Message,
  MessageDirection,
  MessageModel,
  MessagingChannel,
} from './messaging.models';

export class MessagingHubService {
  async findOrCreateContactByTelegramId(
    telegramId: string,
    data?: { name?: string; phone?: string },
  ): Promise<Contact> {
    const update: UpdateQuery<Contact> = {
      telegramId,
    };

    if (data?.name) {
      update.name = data.name;
    }

    if (data?.phone) {
      update.phone = data.phone;
    }

    const contact = await ContactModel.findOneAndUpdate({ telegramId } as FilterQuery<Contact>, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).exec();

    if (!contact) {
      throw new Error('Failed to create or retrieve contact by telegramId');
    }

    return contact;
  }

  async findOrCreateContactByInstagramId(instagramId: string, data?: { name?: string }): Promise<Contact> {
    const update: UpdateQuery<Contact> = {
      instagramId,
    };

    if (data?.name) {
      update.name = data.name;
    }

    const contact = await ContactModel.findOneAndUpdate({ instagramId } as FilterQuery<Contact>, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).exec();

    if (!contact) {
      throw new Error('Failed to create or retrieve contact by instagramId');
    }

    return contact;
  }

  async getOrCreateConversation(contactId: string, channel: MessagingChannel): Promise<Conversation> {
    const conversation = await ConversationModel.findOneAndUpdate(
      { contactId, channel } as FilterQuery<Conversation>,
      { contactId, channel },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    if (!conversation) {
      throw new Error('Failed to create or retrieve conversation');
    }

    return conversation;
  }

  async appendMessage(options: {
    contactId: string;
    conversationId: string;
    channel: MessagingChannel;
    direction: MessageDirection;
    externalId?: string;
    text?: string;
    attachments?: unknown[];
    timestamp?: Date;
  }): Promise<Message> {
    const timestamp = options.timestamp || new Date();

    const message = await MessageModel.create({
      contactId: options.contactId,
      conversationId: options.conversationId,
      channel: options.channel,
      direction: options.direction,
      externalId: options.externalId,
      text: options.text,
      attachments: options.attachments,
      timestamp,
    });

    await ConversationModel.findByIdAndUpdate(options.conversationId, { lastMessageAt: timestamp }).exec();

    return message;
  }

  async linkBookingToConversation(contactId: string, conversationId: string, bnovoBookingId: string): Promise<BookingLink> {
    const bookingLink = await BookingLinkModel.findOneAndUpdate(
      { contactId, conversationId, bnovoBookingId } as FilterQuery<BookingLink>,
      { contactId, conversationId, bnovoBookingId },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).exec();

    if (!bookingLink) {
      throw new Error('Failed to create or retrieve booking link');
    }

    return bookingLink;
  }
}

export const messagingHubService = new MessagingHubService();
