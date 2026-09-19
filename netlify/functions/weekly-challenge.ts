import { getStore } from '@netlify/blobs';
import { generateStory } from '../../src/lib/llmProvider';

// Weekly challenge stories are generated once per ISO week and shared by every
// visitor, so the result is cached in Netlify Blobs (persists across invocations).
const STORE_NAME = 'ribbon-weekly-challenge';
const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

// Monday of the current week in UTC — matches the client and Express server.
function getCurrentWeekId(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setUTCDate(diff));
  return monday.toISOString().split('T')[0];
}

const FALLBACK: Record<'english' | 'hindi', string> = {
  english:
    'The grand typing championship of the digital realm was underway, drawing thousands of aspiring wordsmiths from all corners of the globe. Each competitor sat before a glowing screen, their fingers poised over mechanical switches like concert pianists preparing for a challenging sonata. The atmosphere was filled with the rhythmic click-clack of keys, a modern symphony of concentration and speed. To win this prestigious event required more than just fast hands; it demanded an intense focus, a rhythm of breath, and an unshakeable mind. As the timer ticked down, a single typist reached perfect harmony, typing flawless prose in an incredible blur of speed and accuracy, claiming the golden trophy of the legendary ribbon.',
  hindi:
    'डिजिटल युग की महान टाइपिंग प्रतियोगिता शुरू हो चुकी थी, जिसमें देश के कोने-कोने से हजारों आकांक्षी शामिल हुए थे। प्रत्येक प्रतियोगी एक चमकती स्क्रीन के सामने बैठा था, उनकी उंगलियां कुंजीपटल पर पियानो वादक की तरह तैर रही थीं। वातावरण कुंजियों की मधुर ध्वनि से गूंज रहा था। इस प्रतिष्ठित प्रतियोगिता को जीतने के लिए केवल गति की नहीं, बल्कि एकाग्रता और शुद्धता की भी आवश्यकता थी। जैसे-जैसे समय बीतता गया, एक धावक ने पूर्ण तालमेल हासिल कर लिया और स्वर्ण पदक जीता।',
};

async function readCache(script: string): Promise<{ weekId: string; story: string } | null> {
  try {
    const store = getStore({ name: STORE_NAME });
    const raw = await store.get(`challenge-${script}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err: any) {
    console.warn('[weekly-challenge] cache read unavailable:', err?.message);
    return null;
  }
}

async function writeCache(script: string, weekId: string, story: string): Promise<void> {
  try {
    const store = getStore({ name: STORE_NAME });
    await store.set(`challenge-${script}`, JSON.stringify({ weekId, story }));
  } catch (err: any) {
    console.warn('[weekly-challenge] cache write unavailable:', err?.message);
  }
}

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const targetScript: 'english' | 'hindi' = body.script === 'hindi' ? 'hindi' : 'english';
    const isHindi = targetScript === 'hindi';
    const weekId = getCurrentWeekId();

    const cached = await readCache(targetScript);
    if (cached && cached.weekId === weekId && cached.story) {
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ weekId, story: cached.story }) };
    }

    const prompt = isHindi
      ? `Write a unique, engaging story in Hindi (Devanagari script, about 120-150 words) for a typing competition. The story should be coherent, written in fluent and clean Hindi, use standard Hindi punctuation (like ।). Do NOT include a title, formatting, markdown, quotes, or introduction.`
      : `Write a unique, engaging story for a typing competition. The story should be coherent, written in fluent and clean English, use standard punctuation, and contain interesting themes (science fiction, mystery, adventure, philosophy, or history). Do NOT include a title, formatting, markdown, quotes, or introduction.`;

    try {
      const story = await generateStory(prompt, 200, isHindi ? 'Hindi (Devanagari script)' : 'English');
      if (story && story.trim()) {
        await writeCache(targetScript, weekId, story);
        return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ weekId, story }) };
      }
    } catch (err: any) {
      console.error('[weekly-challenge] generation failed:', err?.message);
    }

    // Not cached: a fallback this week should not block a real story once the LLM
    // becomes available again (e.g. a temporarily missing/unset API key).
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ weekId, story: FALLBACK[targetScript] }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: err?.message || 'Failed to generate weekly challenge' }),
    };
  }
};
