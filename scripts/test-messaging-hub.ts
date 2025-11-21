import 'dotenv/config';
import mongoose from 'mongoose';
import { messagingHubService } from '../src/modules/messaging';
import { MessageDirection } from '../src/modules/messaging/messaging.models';

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Please provide MONGODB_URI in your environment to run messaging hub tests.');
  }

  await mongoose.connect(mongoUri);

  try {
    const contact = await messagingHubService.findOrCreateContactByTelegramId('messaging-hub-test-user', {
      name: 'Messaging Hub Test User',
    });

    const conversation = await messagingHubService.getOrCreateConversation(contact.id, 'telegram');

    const message = await messagingHubService.appendMessage({
      contactId: contact.id,
      conversationId: conversation.id,
      channel: 'telegram',
      direction: 'in' as MessageDirection,
      text: 'Тестовое входящее сообщение',
    });

    const bookingLink = await messagingHubService.linkBookingToConversation(
      contact.id,
      conversation.id,
      'bnovo-booking-demo-id',
    );

    console.log('Contact created:', contact.id);
    console.log('Conversation created:', conversation.id);
    console.log('Message stored with id:', message.id);
    console.log('Booking link created:', bookingLink.id);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('[scripts/test-messaging-hub] Failed to run messaging hub test', error);
  process.exit(1);
});
