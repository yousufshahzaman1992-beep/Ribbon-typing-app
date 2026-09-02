import sharp from 'sharp';
import { buildScorecardSvg } from '../../src/lib/ogCard';

// Dynamic OG scorecard PNG for shared "beat me" challenge links.
export const handler = async (event: any) => {
  const q = event.queryStringParameters || {};
  const name = typeof q.name === 'string' ? q.name : 'A friend';
  const wpm = parseInt(q.wpm || '0', 10);
  const acc = parseInt(q.acc || '0', 10);
  const minutes = parseInt(q.minutes || '1', 10);

  try {
    const svg = buildScorecardSvg({ name, wpm, acc, minutes });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
      body: png.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'Failed to render scorecard' }) };
  }
};
