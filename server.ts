import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import sharp from "sharp";
import { generateStory, generateText, getLLMProviderStatus } from "./src/lib/llmProvider";
import {
  buildSmartDrillFallback,
  buildSmartDrillPrompt,
  normalizeSmartDrillInput,
  parseSmartDrillResponse,
} from "./src/lib/smartDrill";
import {
  insertScore,
  toLeaderboardResponse,
  seedLeaderboard,
  LeaderboardEntry,
  LeaderboardResponse,
} from "./src/lib/leaderboard";
import { buildScorecardSvg } from "./src/lib/ogCard";
import { parseChallengeQuery } from "./src/lib/challenge";
import { renderAppShell } from "./src/lib/appShell";
import { GUIDE_SLUGS } from "./scripts/seo-config";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Landing page / coach app routing helpers
// The static landing page (full long-tail SEO copy) lives at "/". The React
// typing coach hydrates only on "/app". Legacy "beat my score" challenge links
// pointed at "/?challenge=...", so keep forwarding those to the new coach URL.
// Shared head/shell logic lives in ./src/lib/appShell (also used by Netlify).
// ─────────────────────────────────────────────────────────────────────────────

function injectScoreCardMeta(html: string, parsed: { name: string; wpm: number; acc: number; minutes: number }, origin: string) {
  const cardUrl = `${origin}/api/og-card?name=${encodeURIComponent(parsed.name)}&wpm=${parsed.wpm}&acc=${parsed.acc}&minutes=${parsed.minutes}`;
  const title = `Can you beat ${parsed.name}'s ${parsed.wpm} WPM?`;
  const description = `${parsed.name} scored ${parsed.wpm} WPM with ${parsed.acc}% accuracy on Ribbon Typing Coach. Take the ${parsed.minutes}-minute test and take the crown!`;
  const meta = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${cardUrl}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${cardUrl}" />`,
  ].join("\n    ");
  return html.replace("<head>", `<head>\n    ${meta}`);
}

// Legacy "beat my score" challenge links used to live at "/?challenge=..." — the
// coach (and its challenge parser) now lives at "/app", so forward those.
app.use((req, res, next) => {
  if (req.path === "/" && req.query.challenge) {
    return res.redirect(302, `/app?challenge=${encodeURIComponent(String(req.query.challenge))}`);
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Generate Drill based on Weakness Bigram
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/generate-drill", async (req, res) => {
  const { bigram, script } = req.body;
  const isHindi = script === 'hindi';
  const targetBigram =
    bigram && typeof bigram === "string"
      ? (isHindi ? bigram.trim().slice(0, 2) : bigram.toLowerCase().trim().slice(0, 2))
      : "tr";

  console.log(`[API] Generating drill for bigram: "${targetBigram}" in ${isHindi ? 'Hindi' : 'English'}`);

  try {
    const prompt = isHindi
      ? `Generate a single short sentence in Hindi (Devanagari script, about 10 to 15 words) designed as a typing drill for practicing the Devanagari characters or sound represented by "${targetBigram}". It must be realistic, readable, and written in standard Hindi. Return ONLY the raw sentence. Do not include titles, markdown, quotes, or formatting.`
      : `Generate a single short sentence (about 12 to 18 words) designed as a typing drill for practicing the bigram "${targetBigram}". The sentence must contain as many words as possible starting with or containing "${targetBigram}". It must be realistic, readable, and written in standard English. IMPORTANT: Return ONLY the raw sentence. Do not include titles, markdown, quotes, or formatting.`;

    const drill = await generateText(prompt);
    if (drill) return res.json({ drill });
  } catch (err: any) {
    console.error("[API] Drill generation failed — using fallback:", err.message);
  }

  // ── Fallback drills ───────────────────────────────────────────────────────
  if (isHindi) {
    const mockDrillsHindi: Record<string, string> = {
      r: "राधा का कमरा बहुत सुंदर और साफ था जिसमें रंग-बिरंगे खिलौने रखे थे।",
      k: "कल सुबह कमला काम पर गई और उसने किसान से कुछ ताजे फल खरीदे।",
      t: "तरबूज ताजा और मीठा था जिसे देखकर बच्चों के मुंह में पानी आ गया।",
      c: "चारों ओर चमकीली चांदनी बिखरी हुई थी और ठंडी हवा चल रही थी।",
      p: "पवन ने पानी पिया और पेड़ के नीचे बैठकर अपनी पुस्तक पढ़ने लगा।",
      m: "माता-पिता का सम्मान करना और उनकी सेवा करना हमारा सबसे बड़ा कर्तव्य है।"
    };
    const fallbackDrill = mockDrillsHindi[targetBigram] || `विशेष अभ्यास: कुंजीपटल पर ${targetBigram} अक्षरों का निरंतर अभ्यास आपको सटीक टाइपिंग में मदद करेगा।`;
    return res.json({ drill: fallbackDrill });
  }

  const mockDrills: Record<string, string> = {
    tr: "The tricky tractor driver tried to travel through the tropical trail.",
    th: "The thoughtful brothers think that those things there are their treasures.",
    he: "The healthy shepherd helped her heal her heavy heart here.",
    in: "Innovative individuals invent interesting instruments inside infinite internet industries.",
    er: "Never understate the clever player who performs better under super pressure.",
    an: "Another angry animal ran around and annoyed an ancient giant panda.",
    re: "Remember to review, repeat, and reinforce your writing to reach real results.",
    on: "Only once upon a time did the honorable lion conquer the long canyon.",
    at: "The fat cat sat on a flat mat and stared at a giant bat.",
    es: "These essential lessons establish impressive skills and eliminate restless mistakes.",
    en: "Seven silent green hens enjoyed entering the magnificent wooden glen.",
    ju: "Juliet judgingly sipped sweet juice before jumping on her magnificent jungle journey.",
  };

  const fallbackDrill =
    mockDrills[targetBigram] ||
    `Focus drill: many words containing ${targetBigram} like ${targetBigram}y and ${targetBigram}ing can help you type ${targetBigram} cleanly.`;

  return res.json({ drill: fallbackDrill });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Current week ID (Monday of this week in UTC)
// ─────────────────────────────────────────────────────────────────────────────
function getCurrentWeekId(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setUTCDate(diff));
  return monday.toISOString().split("T")[0];
}

const getCacheFile = (script: string) => path.join(process.cwd(), `weekly-challenge-cache-${script}.json`);

function getCachedWeeklyChallenge(script: string): { weekId: string; story: string } | null {
  try {
    const file = getCacheFile(script);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {
    console.error(`Failed to read weekly challenge cache for ${script}:`, e);
  }
  return null;
}

function saveCachedWeeklyChallenge(script: string, weekId: string, story: string) {
  try {
    const file = getCacheFile(script);
    fs.writeFileSync(file, JSON.stringify({ weekId, story }), "utf8");
  } catch (e) {
    console.error(`Failed to save weekly challenge cache for ${script}:`, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Weekly Challenge Story
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/weekly-challenge", async (req, res) => {
  const { script } = req.body;
  const targetScript = typeof script === "string" ? script : "english";
  const isHindi = targetScript === "hindi";

  const currentWeekId = getCurrentWeekId();
  const cached = getCachedWeeklyChallenge(targetScript);

  if (cached && cached.weekId === currentWeekId) {
    return res.json({ weekId: currentWeekId, story: cached.story });
  }

  console.log(`[API] Generating weekly challenge story for week: ${currentWeekId} in ${targetScript}`);

  try {
    const prompt = isHindi
      ? `Write a unique, engaging story in Hindi (Devanagari script, about 120-150 words) for a typing competition. The story should be coherent, written in fluent and clean Hindi, use standard Hindi punctuation (like ।). Do NOT include a title, formatting, markdown, quotes, or introduction.`
      : `Write a unique, engaging story for a typing competition. The story should be coherent, written in fluent and clean English, use standard punctuation, and contain interesting themes (science fiction, mystery, adventure, philosophy, or history). Do NOT include a title, formatting, markdown, quotes, or introduction.`;

    const story = await generateStory(prompt, 200, isHindi ? "Hindi (Devanagari script)" : "English");
    saveCachedWeeklyChallenge(targetScript, currentWeekId, story);
    return res.json({ weekId: currentWeekId, story });
  } catch (err: any) {
    console.error("[API] Weekly challenge generation failed:", err.message);
  }

  const fallbackStory = isHindi
    ? "डिजिटल युग की महान टाइपिंग प्रतियोगिता शुरू हो चुकी थी, जिसमें देश के कोने-कोने से हजारों आकांक्षी शामिल हुए थे। प्रत्येक प्रतियोगी एक चमकती स्क्रीन के सामने बैठा था, उनकी उंगलियां कुंजीपटल पर पियानो वादक की तरह तैर रही थीं। वातावरण कुंजियों की मधुर ध्वनि से गूंज रहा था। इस प्रतिष्ठित प्रतियोगिता को जीतने के लिए केवल गति की नहीं, बल्कि एकाग्रता और शुद्धता की भी आवश्यकता थी। जैसे-जैसे समय बीतता गया, एक धावक ने पूर्ण तालमेल हासिल कर लिया और स्वर्ण पदक जीता।"
    : `The grand typing championship of the digital realm was underway, drawing thousands of aspiring wordsmiths from all corners of the globe. Each competitor sat before a glowing screen, their fingers poised over mechanical switches like concert pianists preparing for a challenging sonata. The atmosphere was filled with the rhythmic click-clack of keys, a modern symphony of concentration and speed. To win this prestigious event required more than just fast hands; it demanded an intense focus, a rhythm of breath, and an unshakeable mind. As the timer ticked down, a single typist reached perfect harmony, typing flawless prose in an incredible blur of speed and accuracy, claiming the golden trophy of the legendary ribbon.`;

  saveCachedWeeklyChallenge(targetScript, currentWeekId, fallbackStory);
  return res.json({ weekId: currentWeekId, story: fallbackStory });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Smart Drill (fumbles + slow bigrams)
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/generate-smart-drill", async (req, res) => {
  const input = normalizeSmartDrillInput(req.body);
  const { fumbles, bigrams, weakestFinger, script } = input;

  console.log(
    `[API] Generating smart drill for fumbles: "${fumbles.join(", ")}", bigrams: "${bigrams.join(", ")}", ` +
      `weakest finger: "${weakestFinger ?? "n/a"}" in ${script}`
  );

  try {
    const prompt = buildSmartDrillPrompt(input);
    const raw = await generateText(prompt);
    const drills = parseSmartDrillResponse(raw, input);
    return res.json({ drills, fumbles, bigrams, weakestFinger, script });
  } catch (err: any) {
    console.error("[API] Smart drill generation failed — using fallback:", err.message);
  }

  return res.json({
    drills: buildSmartDrillFallback(input),
    fumbles,
    bigrams,
    weakestFinger,
    script,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. LLM Provider Status (debug / monitoring)
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/llm-status", (_req, res) => {
  const status = getLLMProviderStatus();
  res.json(status);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Shared Weekly Leaderboard
// ─────────────────────────────────────────────────────────────────────────────
const LEADERBOARD_LIMIT = 100;
const leaderboardFile = () => path.join(process.cwd(), "leaderboard-data.json");

function readLeaderboard(): LeaderboardEntry[] {
  try {
    const file = leaderboardFile();
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      return Array.isArray(raw) ? raw : [];
    }
  } catch (e) {
    console.error("[Leaderboard] Failed to read store:", e);
  }
  return [];
}

// Seed the shared leaderboard with sample competitors only on the very first run
// (no store file yet). Existing stores are never modified, so future weeks start
// honest and empty until real typists submit scores.
function ensureLeaderboardSeeded(weekId: string): LeaderboardEntry[] {
  try {
    const file = leaderboardFile();
    if (!fs.existsSync(file)) {
      const seeds = seedLeaderboard(weekId);
      writeLeaderboard(seeds);
      return seeds;
    }
  } catch (e) {
    console.error("[Leaderboard] Failed to seed store:", e);
  }
  return readLeaderboard();
}

function writeLeaderboard(entries: LeaderboardEntry[]) {
  try {
    fs.writeFileSync(leaderboardFile(), JSON.stringify(entries), "utf8");
  } catch (e) {
    console.error("[Leaderboard] Failed to write store:", e);
  }
}

app.get("/api/leaderboard", (req, res) => {
  const weekId = typeof req.query.weekId === "string" ? req.query.weekId : "";
  if (!weekId) {
    return res.status(400).json({ error: "weekId is required" });
  }
  const entries = ensureLeaderboardSeeded(weekId);
  const response: LeaderboardResponse = toLeaderboardResponse(entries, weekId, 10);
  res.set("Cache-Control", "no-store");
  res.json(response);
});

app.post("/api/leaderboard", (req, res) => {
  const { name, wpm, accuracy, weekId } = req.body || {};
  if (typeof weekId !== "string" || !weekId) {
    return res.status(400).json({ error: "weekId is required" });
  }
  const score: LeaderboardEntry = {
    name: typeof name === "string" ? name : "Anonymous",
    wpm: typeof wpm === "number" ? wpm : 0,
    accuracy: typeof accuracy === "number" ? accuracy : 0,
    weekId,
    timestamp: Date.now(),
  };
  const entries = ensureLeaderboardSeeded(weekId);
  const next = insertScore(entries, score, LEADERBOARD_LIMIT);
  writeLeaderboard(next);
  const response: LeaderboardResponse = toLeaderboardResponse(next, weekId, 10);
  res.set("Cache-Control", "no-store");
  res.json(response);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Dynamic OG Scorecard Image (for shared challenge links)
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/og-card", async (req, res) => {
  const name = typeof req.query.name === "string" ? req.query.name : "A friend";
  const wpm = parseInt(String(req.query.wpm || "0"), 10);
  const acc = parseInt(String(req.query.acc || "0"), 10);
  const minutes = parseInt(String(req.query.minutes || "1"), 10);

  const svg = buildScorecardSvg({ name, wpm, acc, minutes });
  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(png);
  } catch (e) {
    console.error("[OG-Card] Rendering failed:", e);
    res.status(500).json({ error: "Failed to render scorecard" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Practice Reminder Opt-ins (email capture)
// ─────────────────────────────────────────────────────────────────────────────
const remindersFile = () => path.join(process.cwd(), "reminders-data.json");

function readReminders(): string[] {
  try {
    const file = remindersFile();
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      return Array.isArray(raw) ? raw : [];
    }
  } catch (e) {
    console.error("[Reminders] Failed to read store:", e);
  }
  return [];
}

app.post("/api/reminders", (req, res) => {
  const { email } = req.body || {};
  const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  const emails = readReminders();
  if (!emails.includes(clean)) {
    emails.push(clean);
    try {
      fs.writeFileSync(remindersFile(), JSON.stringify(emails), "utf8");
    } catch (e) {
      console.error("[Reminders] Failed to write store:", e);
    }
  }
  res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Vite / Static File Serving
// ─────────────────────────────────────────────────────────────────────────────
async function startServer() {
  // Static SEO landing pages. Generated into public/<slug>/index.html by
  // scripts/generate-seo-pages.ts and copied to dist/<slug>/index.html on build.
  // Single source of truth shared with the sitemap/page generators.
  const seoPages = GUIDE_SLUGS;

  if (process.env.NODE_ENV !== "production") {
    // Serve the pre-rendered guides before Vite's SPA fallback in development.
    const publicPath = path.join(process.cwd(), "public");
    for (const slug of seoPages) {
      app.get(`/${slug}`, (_req, res) => {
        res.sendFile(path.join(publicPath, slug, "index.html"));
      });
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexFile = path.join(distPath, "index.html");
    const notFoundFile = path.join(distPath, "404.html");
    let landingHtml = "";
    let appShellHtml = "";
    let notFoundHtml = "";
    try {
      landingHtml = fs.readFileSync(indexFile, "utf8");
      appShellHtml = renderAppShell(landingHtml);
    } catch (e) {
      console.error("[Server] Failed to read dist/index.html:", e);
    }
    try {
      notFoundHtml = fs.readFileSync(notFoundFile, "utf8");
    } catch {
      notFoundHtml = "";
    }

    // Static landing page with the full SEO copy ("/" is not hydrated by React)
    app.get("/", (req, res) => {
      if (!landingHtml) return res.status(404).send("Not found");
      res.send(landingHtml);
    });

    // React typing coach shell (only hydrated client-side on /app)
    app.get("/app", (req, res) => {
      if (!appShellHtml) return res.status(404).send("Not found");
      let html = appShellHtml;
      const parsed = parseChallengeQuery(req.query.challenge as string | null);
      if (parsed) {
        const origin = `${req.protocol}://${req.get("host")}`;
        html = injectScoreCardMeta(html, parsed, origin);
      }
      res.send(html);
    });

    // Static SEO guide pages live in dist/<slug>/index.html. Serve each at its
    // extensionless canonical URL (the same URL declared in its <link rel="
    // canonical"> and in sitemap.xml) with a 200, instead of letting
    // express.static 301 to a trailing-slash variant.
    for (const slug of seoPages) {
      app.get(`/${slug}`, (_req, res) => {
        res.sendFile(path.join(distPath, slug, "index.html"));
      });
    }

    app.use(express.static(distPath));

    // Anything that is not a real file or one of the known routes is a 404. The
    // landing page is intentionally NOT served for arbitrary paths, so we don't
    // create thousands of near-duplicate indexable URLs. Serve the same custom
    // 404 page Netlify uses so both hosts behave identically.
    app.use((_req, res) => {
      if (notFoundHtml) return res.status(404).type("html").send(notFoundHtml);
      res.status(404).send("Not found");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
