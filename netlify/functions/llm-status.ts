import { getLLMProviderStatus } from '../../src/lib/llmProvider';

// Debug endpoint: reports which LLM providers can see an API key in the Netlify
// function runtime. Returns only booleans and counters — never key values.
export const handler = async (event: any) => {
  if ((event.httpMethod || 'GET').toUpperCase() !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const status = getLLMProviderStatus();
  const anyConfigured = Object.values(status).some((s: any) => s.configured);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ anyConfigured, providers: status }, null, 2),
  };
};
