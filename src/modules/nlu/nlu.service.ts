import fs from "fs";

interface IntentDefinition {
  intent: IntentName;
  examples: string[];
  response?: string;
}

export type IntentName =
  | "availability"
  | "price"
  | "addons"
  | "booking"
  | "fallback";

interface DetectedIntent {
  intent: IntentName;
  confidence: number;
}

const defaultIntents: IntentDefinition[] = [
  {
    intent: "availability",
    examples: ["есть домик", "свободные даты", "хочу забронировать", "дата"],
    response: "Давайте проверим свободные даты и домики.",
  },
  {
    intent: "price",
    examples: ["сколько стоит", "цена", "стоимость", "почём"],
    response: "Сейчас посчитаю стоимость проживания.",
  },
  {
    intent: "addons",
    examples: ["баня", "купель", "дополнения", "доп услуги"],
    response: "Можем предложить баню и купель.",
  },
  {
    intent: "booking",
    examples: ["оплатить", "бронь", "ссылка", "резерв"],
    response: "Подготовлю ссылку на бронь.",
  },
  {
    intent: "fallback",
    examples: [],
    response:
      "Напишите, пожалуйста, дату прибытия/выезда и количество гостей, чтобы подсказать по свободным домикам.",
  },
];

function loadIntentFile(): IntentDefinition[] {
  const candidatePaths = [
    "/mnt/data/drevno_bot_faq_ru.json",
    "/mnt/d/mnt/data/drevno_bot_faq_ru.json",
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf-8");
        const parsed = JSON.parse(content) as IntentDefinition[];

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("[nluService] Failed to read intents file", {
        candidate,
        error,
      });
    }
  }

  return defaultIntents;
}

const intentDefinitions = loadIntentFile();

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export const nluService = {
  detectIntent(text: string): DetectedIntent {
    const normalized = normalize(text);

    for (const intent of intentDefinitions) {
      if (intent.examples.some((example) => normalized.includes(example.toLowerCase()))) {
        return { intent: intent.intent, confidence: 0.9 };
      }
    }

    return { intent: "fallback", confidence: 0.2 };
  },
};

export type { DetectedIntent };
