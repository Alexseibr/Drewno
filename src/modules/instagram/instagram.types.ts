export interface InstagramMessagingValue {
  messaging?: Array<{
    sender?: { id?: string };
    message?: {
      mid?: string;
      text?: string;
      timestamp?: number;
    };
  }>;
}

export interface InstagramWebhookEntry {
  id?: string;
  time?: number;
  messaging?: InstagramMessagingValue["messaging"];
}

export interface InstagramWebhookPayload {
  object?: string;
  entry?: InstagramWebhookEntry[];
}

export interface InstagramIncomingMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp?: Date;
}
