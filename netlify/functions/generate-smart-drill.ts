import { generateText } from '../../src/lib/llmProvider';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fumbles = [], bigrams = [], script = 'english' } = JSON.parse(event.body || '{}');

    const fumblesStr = Array.isArray(fumbles) ? fumbles.join(', ') : '';
    const bigramsStr = Array.isArray(bigrams) ? bigrams.join(', ') : '';

    let prompt = "";
    if (script === 'hindi') {
      prompt = `Create a 40-word Hindi typing drill (Devanagari script) targeting key fumbles: [${fumblesStr}] and slow bigrams: [${bigramsStr}]. Output ONLY the raw drill text.`;
    } else {
      prompt = `Create a 40-word English typing drill targeting key fumbles: [${fumblesStr}] and slow bigrams: [${bigramsStr}]. Output ONLY the raw drill text.`;
    }

    const drill = await generateText(prompt);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drill, fumbles, bigrams, script }),
    };
  } catch (err: any) {
    console.error('[Netlify Function generate-smart-drill Error]:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to generate smart drill' }),
    };
  }
}
