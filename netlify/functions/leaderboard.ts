import { getStore } from '@netlify/blobs';
import {
  insertScore,
  toLeaderboardResponse,
  seedLeaderboard,
} from '../../src/lib/leaderboard';
import type { LeaderboardEntry, LeaderboardResponse } from '../../src/lib/leaderboard';

// Shared weekly leaderboard backed by Netlify Blobs (persists across invocations).
const STORE_NAME = 'ribbon-leaderboard';
const LIMIT = 100;
const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

// Seed with sample competitors only when no blob exists yet (first run). Existing
// stores are never touched, so later weeks start empty until real typists submit.
async function ensureSeeded(store: any, weekId: string): Promise<LeaderboardEntry[]> {
  const raw = await store.get('entries');
  if (raw) {
    return JSON.parse(raw);
  }
  const seeds = seedLeaderboard(weekId);
  await store.set('entries', JSON.stringify(seeds));
  return seeds;
}

export const handler = async (event: any) => {
  try {
    const store = getStore({ name: STORE_NAME });
    const method = (event.httpMethod || 'GET').toUpperCase();

    if (method === 'GET') {
      const weekId = (event.queryStringParameters || {}).weekId;
      if (!weekId) {
        return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'weekId is required' }) };
      }
      const entries = await ensureSeeded(store, weekId);
      const response: LeaderboardResponse = toLeaderboardResponse(entries, weekId, 10);
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(response) };
    }

    if (method === 'POST') {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
      const { name, wpm, accuracy, weekId } = body;
      if (!weekId) {
        return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'weekId is required' }) };
      }
      const entries = await ensureSeeded(store, weekId);
      const score: LeaderboardEntry = {
        name: typeof name === 'string' ? name : 'Anonymous',
        wpm: typeof wpm === 'number' ? wpm : 0,
        accuracy: typeof accuracy === 'number' ? accuracy : 0,
        weekId,
        timestamp: Date.now(),
      };
      const next = insertScore(entries, score, LIMIT);
      await store.set('entries', JSON.stringify(next));
      const response: LeaderboardResponse = toLeaderboardResponse(next, weekId, 10);
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(response) };
    }

    return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: e?.message || 'Internal error' }),
    };
  }
};
