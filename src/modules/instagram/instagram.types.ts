export interface InstagramWebhookPayload {
  object?: string;
  entry: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp?: number;
      message?: {
        mid?: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload?: {
            url?: string;
            [key: string]: unknown;
          };
        }>;
      };
    }>;
    changes?: unknown[];
    [key: string]: unknown;
  }>;
}

export interface InstagramIncomingAttachment {
  type: string;
  url?: string;
  // TODO: extend with other attachment payload fields if needed.
}

export interface InstagramIncomingMessage {
  senderId: string;
  recipientId: string;
  text?: string;
  attachments?: InstagramIncomingAttachment[];
  timestamp: number;
  raw: unknown;
}
