import { generateText } from '../../src/lib/llmProvider';
import {
  buildSmartDrillFallback,
  buildSmartDrillPrompt,
  normalizeSmartDrillInput,
  parseSmartDrillResponse,
  type SmartDrillInput,
} from '../../src/lib/smartDrill';

function json(statusCode: number, payload: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let input: SmartDrillInput | null = null;
  try {
    const body = JSON.parse(event.body || '{}');
    input = normalizeSmartDrillInput(body);

    const prompt = buildSmartDrillPrompt(input);
    const raw = await generateText(prompt);
    const drills = parseSmartDrillResponse(raw, input);

    return json(200, {
      drills,
      fumbles: input.fumbles,
      bigrams: input.bigrams,
      weakestFinger: input.weakestFinger,
      script: input.script,
    });
  } catch (err: any) {
    console.error('[Netlify Function generate-smart-drill Error]:', err?.message || err);
  }

  // Never leave the client empty-handed: return deterministic drills on failure.
  const fallbackInput = input ?? normalizeSmartDrillInput({});
  return json(200, {
    drills: buildSmartDrillFallback(fallbackInput),
    fumbles: fallbackInput.fumbles,
    bigrams: fallbackInput.bigrams,
    weakestFinger: fallbackInput.weakestFinger,
    script: fallbackInput.script,
  });
}
