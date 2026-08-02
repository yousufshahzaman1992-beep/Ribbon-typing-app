/**
 * llmProvider.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Multi-provider LLM fallback system for Ribbon's story / drill generation.
 *
 * Priority order (all OpenAI-compatible chat endpoints):
 *   1. Google AI Studio  (Gemini Flash)   ~1500 req/day  10-15 RPM
 *   2. Cerebras                            ~450 req/day   varies
 *   3. Groq                                ~85 req/day    30 RPM
 *   4. OpenRouter (:free)                  ~50 req/day    20 RPM
 *
 * Public API:
 *   generateStory(prompt, wordCount?)  → Promise<string>
 *   generateText(prompt)               → Promise<string>  (short completions)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderConfig {
  /** Human-readable name used in logs */
  name: string;
  /** Env-var name(s) that hold comma-separated API keys for this provider */
  envVars: string[];
  /** OpenAI-compatible chat completions endpoint */
  endpoint: string;
  /** Model identifier to send in the request body */
  model: string;
  /** Approximate hard daily request cap (to skip provider proactively) */
  dailyCap: number;
  /** Maximum requests per minute (used for pacing) */
  rpm: number;
  /** Any extra headers required by this provider */
  extraHeaders?: Record<string, string>;
}

interface RequestRecord {
  /** Rolling timestamps (epoch ms) of the last minute's requests */
  recentTimestamps: number[];
  /** Total requests made today (resets at midnight UTC) */
  dailyCount: number;
  /** UTC date string of the last reset, e.g. "2025-07-25" */
  lastResetDate: string;
}

// ─── Provider Registry ────────────────────────────────────────────────────────

const PROVIDERS: ProviderConfig[] = [
  {
    name: "Google AI Studio (Gemini Flash)",
    envVars: ["GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEYS"],
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: "gemini-2.0-flash",
    dailyCap: 1500,
    rpm: 14, // use 14 to stay safely under 15 RPM
    extraHeaders: {
      "User-Agent": "RibbonTypingApp/1.0",
    },
  },
  {
    name: "Cerebras",
    envVars: ["CEREBRAS_API_KEY", "CEREBRAS_API_KEYS"],
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    model: process.env.CEREBRAS_MODEL || "gpt-oss-120b",
    dailyCap: 450,
    rpm: 25,
  },
  {
    name: "Groq",
    envVars: ["GROQ_API_KEY", "GROQ_API_KEY_1", "GROQ_API_KEYS"],
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    dailyCap: 85,
    rpm: 29, // 29 to stay under 30
  },
  {
    name: "OpenRouter",
    envVars: ["OPENROUTER_API_KEY", "OPENROUTER_API_KEY_1", "OPENROUTER_API_KEY_2", "OPENROUTER_API_KEYS"],
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free",
    dailyCap: 50,
    rpm: 19, // 19 to stay under 20
    extraHeaders: {
      "HTTP-Referer": "https://ribbon.app",
      "X-Title": "Ribbon Typing App",
    },
  },
];

// ─── In-Memory State ──────────────────────────────────────────────────────────

/**
 * Per-provider request tracking keyed by provider name.
 * Persisted only in-process; resets on server restart (which is fine — the
 * daily counter resets at midnight UTC anyway).
 */
const providerState = new Map<string, RequestRecord>();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getState(providerName: string): RequestRecord {
  if (!providerState.has(providerName)) {
    providerState.set(providerName, {
      recentTimestamps: [],
      dailyCount: 0,
      lastResetDate: todayUTC(),
    });
  }
  const state = providerState.get(providerName)!;

  // Midnight UTC daily reset
  const today = todayUTC();
  if (state.lastResetDate !== today) {
    state.dailyCount = 0;
    state.recentTimestamps = [];
    state.lastResetDate = today;
    console.log(`[LLM] Daily counter reset for provider: ${providerName}`);
  }

  return state;
}

// ─── Key Resolution ───────────────────────────────────────────────────────────

function getEnvVal(varName: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[varName]) {
    return process.env[varName];
  }
  if (typeof process !== 'undefined' && process.env && process.env[`VITE_${varName}`]) {
    return process.env[`VITE_${varName}`];
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[varName]) {
      return metaEnv[varName];
    }
    if (metaEnv && metaEnv[`VITE_${varName}`]) {
      return metaEnv[`VITE_${varName}`];
    }
  } catch (e) {
    // Ignore metaEnv errors in Node
  }
  return undefined;
}

/**
 * Returns all non-placeholder API keys for a provider, read from env vars.
 * Supports both comma-separated list vars and individual vars.
 */
function resolveKeys(provider: ProviderConfig): string[] {
  const PLACEHOLDERS = new Set([
    "YOUR_API_KEY",
    "MY_GEMINI_API_KEY",
    "MY_OPENROUTER_API_KEY",
    "sk-or-PLACEHOLDER",
  ]);

  const seen = new Set<string>();
  const keys: string[] = [];

  for (const envVar of provider.envVars) {
    const raw = getEnvVal(envVar);
    if (!raw?.trim()) continue;

    for (const part of raw.split(",")) {
      const key = part.trim();
      if (key && !PLACEHOLDERS.has(key) && !seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  return keys;
}

// ─── RPM Pacing ───────────────────────────────────────────────────────────────

/**
 * If the provider has fired >= rpm requests in the last 60 seconds, sleeps
 * until the oldest timestamp falls out of the rolling window.
 */
async function waitForRpmSlot(provider: ProviderConfig): Promise<void> {
  const state = getState(provider.name);
  const now = Date.now();
  const windowMs = 60_000;

  // Prune timestamps older than 60s
  state.recentTimestamps = state.recentTimestamps.filter(
    (ts) => now - ts < windowMs
  );

  if (state.recentTimestamps.length >= provider.rpm) {
    const oldest = state.recentTimestamps[0];
    const waitMs = windowMs - (now - oldest) + 50; // +50ms buffer
    console.log(
      `[LLM] ${provider.name} RPM limit (${provider.rpm}/min) reached. Waiting ${waitMs}ms…`
    );
    await sleep(waitMs);
    // Prune again after sleeping
    const after = Date.now();
    state.recentTimestamps = state.recentTimestamps.filter(
      (ts) => after - ts < windowMs
    );
  }
}

function recordRequest(provider: ProviderConfig): void {
  const state = getState(provider.name);
  state.recentTimestamps.push(Date.now());
  state.dailyCount++;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if the provider's HTTP response status indicates a rate-limit
 * or quota error that should trigger fallback to the next provider.
 */
function isRateLimitError(status: number): boolean {
  // 429 = Too Many Requests, 403 = Forbidden (quota), 402 = Payment Required (quota)
  return status === 429 || status === 403 || status === 402;
}

/** Word-count estimate (splits on whitespace) */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Trims the story to approximately targetWords by cutting at the nearest
 * sentence boundary after the target.
 */
function trimToWordCount(text: string, targetWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= targetWords * 1.15) return text.trim(); // within 15% — keep as-is

  // Cut at sentence boundary near the target
  const rough = words.slice(0, Math.round(targetWords * 1.1)).join(" ");
  const lastPeriod = rough.lastIndexOf(".");
  const lastBang = rough.lastIndexOf("!");
  const lastQuestion = rough.lastIndexOf("?");
  const cutAt = Math.max(lastPeriod, lastBang, lastQuestion);

  return cutAt > rough.length * 0.6 ? rough.slice(0, cutAt + 1).trim() : rough.trim();
}

// ─── Core HTTP Call ───────────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callProvider(
  provider: ProviderConfig,
  apiKey: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens?: number
): Promise<string> {
  await waitForRpmSlot(provider);

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(provider.extraHeaders ?? {}),
  };

  const body: Record<string, unknown> = {
    model: provider.model,
    messages,
    temperature,
  };
  if (maxTokens) body.max_tokens = maxTokens;

  recordRequest(provider);

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000), // 90s timeout
  });

  // Read the raw body once so we can inspect it regardless of status code.
  // Gemini's OpenAI-compat endpoint sometimes returns HTTP 200 with an error
  // JSON array body (e.g. quota exhausted), so we must check content too.
  const rawText = await response.text().catch(() => "");

  if (!response.ok) {
    const err = new Error(
      `[${provider.name}] HTTP ${response.status}: ${rawText.slice(0, 300)}`
    );
    (err as any).status = response.status;
    throw err;
  }

  // Detect Gemini-style "200 OK but error body" (returns a JSON array with an
  // `error` object instead of a choices array when quota is exceeded).
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`[${provider.name}] Non-JSON response: ${rawText.slice(0, 200)}`);
  }

  // Gemini quota error comes back as an array: [{ error: { code, message, status } }]
  if (Array.isArray(data) && data[0]?.error) {
    const geminiErr = data[0].error;
    const httpStatus: number = geminiErr.code ?? 429;
    const err = new Error(`[${provider.name}] API error ${httpStatus}: ${geminiErr.message?.slice(0, 200)}`);
    (err as any).status = httpStatus;
    throw err;
  }

  // Standard OpenAI error object (some providers return 200 + error JSON)
  if (data?.error) {
    const httpStatus: number = data.error.code ?? data.error.status ?? 500;
    const err = new Error(`[${provider.name}] API error: ${JSON.stringify(data.error).slice(0, 200)}`);
    (err as any).status = typeof httpStatus === "number" ? httpStatus : 500;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`[${provider.name}] Returned empty content. Body: ${rawText.slice(0, 200)}`);
  }
  return content;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a ~1500-word story (or the requested word count) using the
 * provider waterfall.  Automatically falls back on 429 / 403 / quota errors.
 *
 * @param prompt    The user-facing topic / instruction to pass to the model.
 * @param wordCount Target story length in words (default 1500).
 * @returns         The generated story text.
 * @throws          Error if all providers are exhausted.
 */
export async function generateStory(
  prompt: string,
  wordCount: number = 1500,
  language: string = "English"
): Promise<string> {
  const wordRange = `${Math.round(wordCount * 0.95)} and ${Math.round(wordCount * 1.05)}`;

  const systemMessage: ChatMessage = {
    role: "system",
    content:
      "You are a creative writer producing content for a typing practice application. " +
      "Write engaging, fluent prose. Use standard punctuation. No lists, no headers, no markdown. " +
      "Return ONLY the raw story text.",
  };

  const userMessage: ChatMessage = {
    role: "user",
    content:
      `Write a story of approximately ${wordCount} words (between ${wordRange} words) about: ${prompt}. ` +
      `The story must be written as flowing prose paragraphs, in clean fluent ${language}. ` +
      "Do NOT include a title, introduction, or any formatting.",
  };

  const messages: ChatMessage[] = [systemMessage, userMessage];
  // ~1500 words ≈ 2000 tokens; add 25% headroom
  const maxTokens = Math.round(wordCount * 1.5);

  const result = await runProviderWaterfall(messages, 0.8, maxTokens);
  return trimToWordCount(result, wordCount);
}

/**
 * Generates a short text (drills, sentences, etc.) using the provider waterfall.
 *
 * @param prompt System + user instruction combined.
 */
export async function generateText(prompt: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: prompt,
    },
  ];
  return runProviderWaterfall(messages, 0.8);
}

// ─── Waterfall Engine ─────────────────────────────────────────────────────────

/**
 * Core loop: iterates over PROVIDERS in priority order, skips providers
 * near their daily cap, handles rate-limit errors by advancing to the
 * next provider immediately, and returns the first successful response.
 */
async function runProviderWaterfall(
  messages: ChatMessage[],
  temperature: number,
  maxTokens?: number
): Promise<string> {
  const errors: string[] = [];

  for (const provider of PROVIDERS) {
    const keys = resolveKeys(provider);
    if (keys.length === 0) {
      console.log(`[LLM] Skipping ${provider.name}: no API key configured.`);
      continue;
    }

    const state = getState(provider.name);

    // ── Daily cap pre-check ────────────────────────────────────────────────
    // Leave a 5% buffer before the hard cap to avoid burning the last token
    // on a request that will almost certainly 429.
    const threshold = Math.floor(provider.dailyCap * 0.95);
    if (state.dailyCount >= threshold) {
      console.log(
        `[LLM] Skipping ${provider.name}: daily usage ${state.dailyCount}/${provider.dailyCap} ` +
          `(≥${threshold} threshold).`
      );
      errors.push(`${provider.name}: daily cap reached (${state.dailyCount}/${provider.dailyCap})`);
      continue;
    }

    // ── Try each API key for this provider ────────────────────────────────
    for (const key of keys) {
      const maskedKey = `${key.slice(0, 6)}…${key.slice(-4)}`;
      console.log(`[LLM] Trying ${provider.name} (key ${maskedKey}) — daily: ${state.dailyCount}/${provider.dailyCap}`);

      try {
        const text = await callProvider(provider, key, messages, temperature, maxTokens);

        const words = countWords(text);
        console.log(
          `[LLM] ✓ ${provider.name} served the request. ` +
            `Output: ${words} words. Daily count: ${state.dailyCount}/${provider.dailyCap}`
        );
        return text;
      } catch (err: any) {
        const status: number | undefined = err?.status;

        if (status && isRateLimitError(status)) {
          console.warn(
            `[LLM] ${provider.name} (key ${maskedKey}) rate-limited (HTTP ${status}). ` +
              "Falling through to next provider."
          );
          errors.push(`${provider.name}: HTTP ${status} rate-limit`);
          // Don't try remaining keys for this provider — move to next provider
          break;
        }

        // Non-rate-limit error (network timeout, bad model name, etc.)
        // Try the next key for this provider before giving up on the provider.
        console.warn(
          `[LLM] ${provider.name} (key ${maskedKey}) failed: ${err.message}. ` +
            "Trying next key…"
        );
        errors.push(`${provider.name} (key ${maskedKey}): ${err.message}`);
      }
    }
  }

  // ── All providers exhausted ───────────────────────────────────────────────
  const summary = errors.join(" | ");
  throw new Error(
    `All LLM providers exhausted. No story could be generated. Details: ${summary}`
  );
}

// ─── Diagnostics ──────────────────────────────────────────────────────────────

/**
 * Returns a snapshot of each provider's current daily usage and RPM state.
 * Useful for a /api/llm-status debug endpoint.
 */
export function getLLMProviderStatus(): Record<
  string,
  { configured: boolean; dailyCount: number; dailyCap: number; recentRPM: number }
> {
  const result: Record<string, any> = {};
  for (const provider of PROVIDERS) {
    const keys = resolveKeys(provider);
    const state = getState(provider.name);
    const windowMs = 60_000;
    const now = Date.now();
    const recentRPM = state.recentTimestamps.filter((ts) => now - ts < windowMs).length;

    result[provider.name] = {
      configured: keys.length > 0,
      dailyCount: state.dailyCount,
      dailyCap: provider.dailyCap,
      recentRPM,
    };
  }
  return result;
}
