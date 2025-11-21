import type { Express, Request, Response } from 'express';
import { instagramConfig } from './instagram.config';
import { instagramService } from './instagram.service';

export function registerInstagramWebhookRoutes(app: Express): void {
  app.get('/webhook/instagram', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === instagramConfig.verifyToken && challenge) {
      res.status(200).send(String(challenge));
      return;
    }

    res.sendStatus(403);
  });

  app.post('/webhook/instagram', (req: Request, res: Response) => {
    res.sendStatus(200);

    Promise.resolve(instagramService.handleIncomingWebhook(req.body))
      .catch((error) => {
        console.error('[InstagramWebhook] Failed to handle webhook payload', error);
      });
  });
}
