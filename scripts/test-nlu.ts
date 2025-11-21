import 'dotenv/config';
import { nluService } from '../src/modules/nlu';

async function main(): Promise<void> {
  const text = process.argv[2] || 'Привет, сколько стоит?';
  const result = await nluService.detectIntent(text);
  console.log('NLU detectIntent result for:', text);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('[scripts/test-nlu] Failed to detect intent', error);
  process.exit(1);
});
