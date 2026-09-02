import { getStore } from '@netlify/blobs';
import {
  insertScore,
  toLeaderboardResponse,
} from '../../src/lib/leaderboard';
import type { LeaderboardEntry, LeaderboardResponse } from '../../src/lib/leaderboard';

// Shared weekly leaderboard backed by Netlify Blobs (persists across invocations).
const STORE_NAME = 'ribbon-leaderboard';
const LIMIT = 100;
const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export const handler = async (event: any) => {
  try {
    const store = getStore({ name: STORE_NAME });
    const method = (event.httpMethod || 'GET').toUpperCase();

    if (method === 'GET') {
      const weekId = (event.queryStringParameters || {}).weekId;
      if (!weekId) {
        return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'weekId is required' }) };
      }
      const raw = await store.get('entries');
      const entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      const response: LeaderboardResponse = toLeaderboardResponse(entries, weekId, 10);
      return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify(response) };
    }

    if (method === 'POST') {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
      const { name, wpm, accuracy, weekId } = body;
      if (!weekId) {
        return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'weekId is required' }) };
      }
      const raw = await store.get('entries');
      const entries: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
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
