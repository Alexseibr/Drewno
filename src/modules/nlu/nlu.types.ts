export interface IntentMatch {
  name: string;
  confidence: number;
  shortAnswer?: string;
  fullAnswer?: string;
  action?: string;
  raw?: any; // TODO: Replace `any` once the actual intent JSON structure is finalized.
}
