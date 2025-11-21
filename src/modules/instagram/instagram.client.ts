import axios from "axios";
import { instagramConfig } from "./instagram.config";

export class InstagramClient {
  async sendMessageToUser(instagramUserId: string, text: string): Promise<void> {
    if (!instagramConfig.pageAccessToken) {
      throw new Error("INSTAGRAM_PAGE_ACCESS_TOKEN is not configured");
    }

    await axios.post(
      "https://graph.facebook.com/v20.0/me/messages",
      {
        recipient: { id: instagramUserId },
        message: { text },
      },
      {
        params: { access_token: instagramConfig.pageAccessToken },
      },
    );
  }
}

export const instagramClient = new InstagramClient();
