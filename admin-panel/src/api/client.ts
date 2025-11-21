import axios from 'axios';
import { BookingSummary, ConversationDetails, ConversationSummary, MessageItem } from '../types';
import { fetchConversationDetails, fetchConversations, sendMessage } from './mock';

const api = axios.create({
  baseURL: '/api',
});

// In a real integration, replace these wrappers with api.get/post calls.
export const messagingApi = {
  listConversations: async (): Promise<ConversationSummary[]> => fetchConversations(),
  getConversation: async (conversationId: string): Promise<ConversationDetails> =>
    fetchConversationDetails(conversationId),
  sendMessage: async (conversationId: string, channel: 'telegram' | 'instagram', text: string): Promise<MessageItem> =>
    sendMessage(conversationId, channel, text),
  getBookings: async (conversationId: string): Promise<BookingSummary[]> => {
    const details = await fetchConversationDetails(conversationId);
    return details.bookings;
  },
};

export { api };
