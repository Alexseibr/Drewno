import dayjs from 'dayjs';
import { BookingSummary, Channel, Contact, ConversationDetails, ConversationSummary, MessageItem } from '../types';

const sampleContacts: Contact[] = [
  { id: 'c1', name: 'Иван Иванов', phone: '+375 29 123-45-67', channel: 'telegram' },
  { id: 'c2', name: 'Анна Петрова', phone: '+375 33 765-43-21', channel: 'instagram' },
];

const conversationSummaries: ConversationSummary[] = [
  {
    id: 'conv-1',
    contactName: 'Иван Иванов',
    channel: 'telegram',
    lastMessageText: 'Спасибо, подтвердите бронь.',
    lastMessageAt: dayjs().subtract(5, 'minute').toISOString(),
  },
  {
    id: 'conv-2',
    contactName: 'Анна Петрова',
    channel: 'instagram',
    lastMessageText: 'Можно ли заезд в 13:00?',
    lastMessageAt: dayjs().subtract(45, 'minute').toISOString(),
  },
];

const messagesByConversation: Record<string, MessageItem[]> = {
  'conv-1': [
    {
      id: 'm1',
      conversationId: 'conv-1',
      direction: 'in',
      text: 'Здравствуйте! Хочу уточнить про домик "Сосна".',
      timestamp: dayjs().subtract(2, 'hour').toISOString(),
    },
    {
      id: 'm2',
      conversationId: 'conv-1',
      direction: 'out',
      text: 'Добрый день! Даты подскажите, пожалуйста?',
      timestamp: dayjs().subtract(1.5, 'hour').toISOString(),
    },
    {
      id: 'm3',
      conversationId: 'conv-1',
      direction: 'in',
      text: '12–14 ноября, 2 взрослых.',
      timestamp: dayjs().subtract(65, 'minute').toISOString(),
    },
    {
      id: 'm4',
      conversationId: 'conv-1',
      direction: 'out',
      text: 'Есть свободно. Стоимость от 320 BYN. Подтверждаем?',
      timestamp: dayjs().subtract(40, 'minute').toISOString(),
    },
    {
      id: 'm5',
      conversationId: 'conv-1',
      direction: 'in',
      text: 'Спасибо, подтвердите бронь.',
      timestamp: dayjs().subtract(5, 'minute').toISOString(),
    },
  ],
  'conv-2': [
    {
      id: 'm6',
      conversationId: 'conv-2',
      direction: 'in',
      text: 'Можно ли заезд в 13:00?',
      timestamp: dayjs().subtract(45, 'minute').toISOString(),
    },
    {
      id: 'm7',
      conversationId: 'conv-2',
      direction: 'out',
      text: 'Да, оформим ранний заезд, отметили.',
      timestamp: dayjs().subtract(30, 'minute').toISOString(),
    },
  ],
};

const bookingByConversation: Record<string, BookingSummary[]> = {
  'conv-1': [
    {
      id: 'BN-3042',
      roomTitle: 'Домик "Сосна"',
      arrivalDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      departureDate: dayjs().add(5, 'day').format('YYYY-MM-DD'),
      status: 'подтверждена',
    },
  ],
  'conv-2': [
    {
      id: 'BN-3045',
      roomTitle: 'Домик "Берёза"',
      arrivalDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      departureDate: dayjs().add(9, 'day').format('YYYY-MM-DD'),
      status: 'оплачена',
    },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchConversations(): Promise<ConversationSummary[]> {
  await delay(150);
  return conversationSummaries;
}

export async function fetchConversationDetails(conversationId: string): Promise<ConversationDetails> {
  await delay(150);
  const conversation = conversationSummaries.find((c) => c.id === conversationId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const contact: Contact =
    sampleContacts.find((c) => c.name === conversation.contactName && c.channel === conversation.channel) ||
    sampleContacts[0];

  const messages = messagesByConversation[conversationId] || [];
  const bookings = bookingByConversation[conversationId] || [];

  return {
    conversation,
    messages,
    contact,
    bookings,
  };
}

export async function sendMessage(
  conversationId: string,
  channel: Channel,
  text: string,
): Promise<MessageItem> {
  await delay(100);
  const newMessage: MessageItem = {
    id: `out-${Date.now()}`,
    conversationId,
    direction: 'out',
    text,
    timestamp: new Date().toISOString(),
  };

  messagesByConversation[conversationId] = [...(messagesByConversation[conversationId] || []), newMessage];
  const summary = conversationSummaries.find((c) => c.id === conversationId);
  if (summary) {
    summary.lastMessageAt = newMessage.timestamp;
    summary.lastMessageText = text;
  }

  return newMessage;
}
