import { generateStory } from '../../src/lib/llmProvider';

// Last-resort content so the "AI Story" control never returns an empty result
// (e.g. every LLM provider is rate-limited, over quota, or misconfigured).
const FALLBACK: Record<'english' | 'hindi', string> = {
  english:
    'The quiet morning light spread slowly across the practice room as the typist settled into a steady rhythm. Each keystroke landed with a soft, deliberate click, building momentum one word at a time. There was no rush, only the calm discipline of repetition, the steady pursuit of accuracy over raw speed. Slowly the sentences grew longer, the pauses grew shorter, and the hands began to move with a confidence that only patient practice can create. By the end of the session, the page was full, the mind was clear, and the next challenge already felt a little easier than the one before it.',
  hindi:
    'सुबह की शांत रोशनी अभ्यास कक्ष में धीरे-धीरे फैल रही थी और टाइपिस्ट ने एक स्थिर लय में काम शुरू किया। हर कुंजी एक कोमल आवाज के साथ दब रही थी, शब्द एक-एक करके आगे बढ़ रहे थे। कोई जल्दबाजी नहीं थी, केवल धैर्य और निरंतर अभ्यास का अनुशासन था। धीरे-धीरे वाक्य लंबे होते गए, रुकावटें कम होती गईं, और हाथ आत्मविश्वास के साथ चलने लगे। सत्र के अंत तक मन शांत था और अगली चुनौती पहले से आसान लग रही थी।',
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let topic = '';
  let script = 'english';
  let wordCount = 80;

  try {
    const body = JSON.parse(event.body || '{}');
    topic = body.topic;
    script = body.script === 'hindi' ? 'hindi' : 'english';
    const duration = Number(body.duration) || 2;

    if (!topic || typeof topic !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'A valid "topic" string is required.' }),
      };
    }

    wordCount = Math.max(80, Math.min(duration * 40, 500));

    const prompt = script === 'hindi'
      ? `Write a clean, engaging story in Hindi (Devanagari script) about "${topic}". The story should be around ${wordCount} words long. Use standard Devnagari characters and spaces suitable for Hindi typing test. Do NOT use special symbols, smart quotes, or dashes. Output ONLY the story text.`
      : `Write an engaging typing practice story about "${topic}". The story should be approximately ${wordCount} words long. Use clear sentences, standard punctuation, and vocabulary suitable for a touch-typing exercise. Do NOT include a title, markdown header, or any meta text—output ONLY the raw story paragraphs.`;

    const story = await generateStory(prompt, wordCount);
    // Guard against truncated / empty output from an overloaded or thinking
    // model: if the result is far shorter than requested, use the fallback.
    if (story && countWords(story) >= Math.max(40, wordCount * 0.4)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, topic, wordCount, script }),
      };
    }

    console.warn(
      `[generate-story] LLM returned ${story ? countWords(story) : 0} words (target ${wordCount}); using fallback.`
    );
  } catch (err: any) {
    console.error('[Netlify Function generate-story Error]:', err?.message || err);
  }

  // Never leave the client empty-handed — always return usable practice text.
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      story: FALLBACK[script === 'hindi' ? 'hindi' : 'english'],
      topic,
      wordCount,
      script,
    }),
  };
}
