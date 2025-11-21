import mongoose, { Document, Model, Schema } from 'mongoose';

export type MessagingChannel = 'telegram' | 'instagram';
export type MessageDirection = 'in' | 'out';

export interface Contact extends Document {
  name?: string;
  phone?: string;
  email?: string;
  telegramId?: string;
  instagramId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<Contact>(
  {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    telegramId: { type: String, index: true },
    instagramId: { type: String, index: true },
  },
  { timestamps: true },
);

export const ContactModel: Model<Contact> =
  mongoose.models.Contact || mongoose.model<Contact>('Contact', ContactSchema);

export interface Conversation extends Document {
  contactId: Schema.Types.ObjectId;
  channel: MessagingChannel;
  title?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<Conversation>(
  {
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    channel: { type: String, enum: ['telegram', 'instagram'], required: true },
    title: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

ConversationSchema.index({ contactId: 1, channel: 1 }, { unique: true });

export const ConversationModel: Model<Conversation> =
  mongoose.models.Conversation || mongoose.model<Conversation>('Conversation', ConversationSchema);

export interface Message extends Document {
  conversationId: Schema.Types.ObjectId;
  contactId: Schema.Types.ObjectId;
  channel: MessagingChannel;
  direction: MessageDirection;
  externalId?: string;
  text?: string;
  attachments?: unknown[];
  timestamp: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<Message>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    channel: { type: String, enum: ['telegram', 'instagram'], required: true },
    direction: { type: String, enum: ['in', 'out'], required: true },
    externalId: { type: String },
    text: { type: String },
    attachments: { type: [Schema.Types.Mixed], default: undefined },
    timestamp: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const MessageModel: Model<Message> =
  mongoose.models.Message || mongoose.model<Message>('Message', MessageSchema);

export interface BookingLink extends Document {
  contactId: Schema.Types.ObjectId;
  conversationId: Schema.Types.ObjectId;
  bnovoBookingId: string;
  createdAt: Date;
}

const BookingLinkSchema = new Schema<BookingLink>(
  {
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    bnovoBookingId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

BookingLinkSchema.index({ contactId: 1, conversationId: 1, bnovoBookingId: 1 }, { unique: true });

export const BookingLinkModel: Model<BookingLink> =
  mongoose.models.BookingLink || mongoose.model<BookingLink>('BookingLink', BookingLinkSchema);
