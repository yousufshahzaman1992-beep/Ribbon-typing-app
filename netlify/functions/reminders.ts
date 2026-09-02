import { getStore } from '@netlify/blobs';

// Practice reminder email opt-ins backed by Netlify Blobs.
const STORE_NAME = 'ribbon-reminders';
const KEY = 'emails';
const jsonHeaders = { 'Content-Type': 'application/json' };

export const handler = async (event: any) => {
  try {
    if ((event.httpMethod || 'POST').toUpperCase() !== 'POST') {
      return { statusCode: 405, headers: jsonHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
    const clean = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return { statusCode: 400, headers: jsonHeaders, body: JSON.stringify({ error: 'A valid email is required' }) };
    }
    const store = getStore({ name: STORE_NAME });
    const raw = await store.get(KEY);
    const emails: string[] = raw ? JSON.parse(raw) : [];
    if (!emails.includes(clean)) {
      emails.push(clean);
      await store.set(KEY, JSON.stringify(emails));
    }
    return { statusCode: 200, headers: jsonHeaders, body: JSON.stringify({ ok: true }) };
  } catch (e: any) {
    return { statusCode: 500, headers: jsonHeaders, body: JSON.stringify({ error: e?.message || 'Internal error' }) };
  }
};
