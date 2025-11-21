import { instagramConfig } from "./instagram.config";
import { instagramService } from "./instagram.service";
import { InstagramWebhookPayload } from "./instagram.types";

export function handleInstagramWebhookVerification(query: Record<string, string | undefined>) {
  const mode = query["hub.mode"];
  const verifyToken = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode === "subscribe" && verifyToken === instagramConfig.verifyToken) {
    return { status: 200, body: challenge ?? "" };
  }

  return { status: 403, body: "Forbidden" };
}

export async function handleInstagramWebhookEvent(payload: InstagramWebhookPayload) {
  await instagramService.handleIncomingWebhook(payload);
  return { status: 200 };
}
