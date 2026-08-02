import { generateText } from '../../src/lib/llmProvider';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { bigram, script = 'english' } = JSON.parse(event.body || '{}');

    if (!bigram || typeof bigram !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'A valid "bigram" string is required.' }),
      };
    }

    const cleanBigram = bigram.trim().toLowerCase();
    let prompt = "";
    if (script === 'hindi') {
      prompt = `Create a 25-word typing practice sentence in Hindi (Devanagari script) featuring character pair "${cleanBigram}". Do NOT use special symbols or titles. Output ONLY the raw practice sentence.`;
    } else {
      prompt = `Create a 25-word typing practice sentence in English with a high frequency of the letter pair "${cleanBigram}". Do NOT include any intro or quote marks—output ONLY the raw sentence.`;
    }

    const drill = await generateText(prompt);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drill, bigram: cleanBigram, script }),
    };
  } catch (err: any) {
    console.error('[Netlify Function generate-drill Error]:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to generate drill' }),
    };
  }
}
