export type Channel = 'telegram' | 'instagram';

export interface Contact {
  id: string;
  name?: string;
  phone?: string;
  channel: Channel;
}

export interface ConversationSummary {
  id: string;
  contactName: string;
  channel: Channel;
  lastMessageText?: string;
  lastMessageAt: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  direction: 'in' | 'out';
  text?: string;
  timestamp: string;
}

export interface BookingSummary {
  id: string;
  roomTitle: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
}

export interface ConversationDetails {
  conversation: ConversationSummary;
  messages: MessageItem[];
  contact: Contact;
  bookings: BookingSummary[];
}
