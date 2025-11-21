import fs from 'fs';
import path from 'path';
import { IntentMatch } from './nlu.types';

interface IntentDefinition {
  name: string;
  examples?: string[];
  synonyms?: string[];
  short_answer?: string;
  full_answer?: string;
  action?: string;
  // TODO: Align fields with the real drevno_bot_faq_ru.json structure once confirmed.
  [key: string]: any;
}

interface IntentConfig {
  intents: IntentDefinition[];
}

class NluService {
  private readonly intents: IntentDefinition[];

  constructor() {
    this.intents = this.loadIntents();
  }

  async detectIntent(text: string): Promise<IntentMatch> {
    const normalized = this.normalize(text);
    if (!normalized) {
      return this.buildFallback();
    }

    let bestIntent: IntentDefinition | null = null;
    let bestConfidence = 0;

    for (const intent of this.intents) {
      const confidence = this.scoreIntent(intent, normalized);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestIntent = intent;
      }
    }

    if (!bestIntent || bestConfidence < 0.5) {
      return this.buildFallback();
    }

    return {
      name: bestIntent.name,
      confidence: bestConfidence,
      shortAnswer: bestIntent.short_answer,
      fullAnswer: bestIntent.full_answer,
      action: bestIntent.action,
      raw: bestIntent,
    };
  }

  private loadIntents(): IntentDefinition[] {
    try {
      const configPath = path.resolve(__dirname, '../../config/drewno_bot_faq_ru.json');
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw) as IntentConfig;
      return parsed.intents || [];
    } catch (error) {
      console.error('[NLU] Failed to load intents from JSON config', error);
      return [];
    }
  }

  private scoreIntent(intent: IntentDefinition, normalizedText: string): number {
    const triggers = (intent.synonyms || []).map((s) => this.normalize(s)).filter(Boolean);
    const examples = (intent.examples || []).map((s) => this.normalize(s)).filter(Boolean);

    // High confidence for direct trigger words.
    if (triggers.some((trigger) => trigger && normalizedText.includes(trigger))) {
      return 0.9;
    }

    // Medium confidence for example phrase inclusion.
    if (examples.some((example) => example && normalizedText.includes(example))) {
      // Slight boost if exact match to an example.
      return examples.some((example) => example === normalizedText) ? 0.8 : 0.7;
    }

    // Weak partial overlap based on token presence from examples.
    for (const example of examples) {
      const tokens = example.split(' ').filter((token) => token.length > 3);
      const matchedTokens = tokens.filter((token) => normalizedText.includes(token));
      if (matchedTokens.length >= Math.max(1, Math.floor(tokens.length / 2))) {
        return 0.6;
      }
    }

    return 0;
  }

  private normalize(text: string | undefined | null): string {
    return (text || '').trim().toLowerCase();
  }

  private buildFallback(): IntentMatch {
    return {
      name: 'fallback',
      confidence: 0.3,
      raw: null,
    };
  }
}

export const nluService = new NluService();
