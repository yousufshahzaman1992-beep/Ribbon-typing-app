import { generateStory } from '../../src/lib/llmProvider';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { topic, duration = 2, script = 'english' } = JSON.parse(event.body || '{}');

    if (!topic || typeof topic !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'A valid "topic" string is required.' }),
      };
    }

    const wordCount = Math.max(80, Math.min(Number(duration) * 40 || 80, 500));
    
    let prompt = "";
    if (script === 'hindi') {
      prompt = `Write a clean, engaging story in Hindi (Devanagari script) about "${topic}". The story should be around ${wordCount} words long. Use standard Devnagari characters and spaces suitable for Hindi typing test. Do NOT use special symbols, smart quotes, or dashes. Output ONLY the story text.`;
    } else {
      prompt = `Write an engaging typing practice story about "${topic}". The story should be approximately ${wordCount} words long. Use clear sentences, standard punctuation, and vocabulary suitable for a touch-typing exercise. Do NOT include a title, markdown header, or any meta text—output ONLY the raw story paragraphs.`;
    }

    const story = await generateStory(prompt, wordCount);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story, topic, wordCount, script }),
    };
  } catch (err: any) {
    console.error('[Netlify Function generate-story Error]:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to generate story' }),
    };
  }
}
