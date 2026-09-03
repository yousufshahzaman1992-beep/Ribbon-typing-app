import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import sharp from "sharp";
import { generateStory, generateText, getLLMProviderStatus } from "./src/lib/llmProvider";
import {
  insertScore,
  toLeaderboardResponse,
  seedLeaderboard,
  LeaderboardEntry,
  LeaderboardResponse,
} from "./src/lib/leaderboard";
import { buildScorecardSvg } from "./src/lib/ogCard";
import { parseChallengeQuery } from "./src/lib/challenge";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// 1. Generate Story based on Topic
// ─────────────────────────────────────────────────────────────────────────────
app.post("/api/generate-story", async (req, res) => {
  const { topic, duration, script } = req.body;
  const isHindi = script === 'hindi';
  const targetTopic =
    topic && typeof topic === "string" ? topic.trim() : (isHindi ? "टंकण अभ्यास" : "typing practice");

  // Calculate word count: ~60 WPM average typing speed
  const WPM = 60;
  const durationMinutes =
    typeof duration === "number" && [2, 5, 10, 15].includes(duration)
      ? duration
      : 2;
  const targetWords = WPM * durationMinutes;

  console.log(
    `[API] Generating story for topic: "${targetTopic}", duration: ${durationMinutes}min (~${targetWords} words) in ${isHindi ? 'Hindi' : 'English'}`
  );

  try {
    const prompt = isHindi
      ? `Topic: "${targetTopic}". Write flowing prose paragraphs in Devanagari script (Hindi language), use standard Hindi punctuation (like ।). No title, no headers, no bullet points, and do NOT write English words in Devanagari (write genuine Hindi text).`
      : `Topic: "${targetTopic}". Write flowing prose paragraphs, use standard punctuation, clean fluent English. No title, no headers, no bullet points.`;

    const story = await generateStory(prompt, targetWords, isHindi ? "Hindi (Devanagari script)" : "English");
    return res.json({ story });
  } catch (err: any) {
    console.error("[API] Story generation failed — using fallback:", err.message);
  }

  // ── Fallback stories ──────────────────────────────────────────────────────
  const topicLower = targetTopic.toLowerCase();

  if (isHindi) {
    const mockStoriesHindi: Record<string, string> = {
      space: "गहरे अंतरिक्ष अन्वेषण कैप्सूल ने तारों से भरे अंधेरे में शांति से यात्रा की। पृथ्वी को पीछे मुड़कर देखने पर, यह पूर्ण स्याही के समुद्र में तैरते हुए एक छोटे, चमकते नीलम की तरह दिखाई देती थी। चारों ओर, ठंडे प्राचीन तारे टिमटिमा रहे थे। चालक दल जानता था कि उनका मिशन खतरनाक था, फिर भी उनका संकल्प लोहे की तरह मजबूत था। वे ब्रह्मांड में आगे बढ़ते गए।",
      ocean: "समुद्र की लहरें धीरे-धीरे तट की सुनहरी रेत से टकरा रही थीं। पानी के भीतर जीवंत मूंगे की शाखाओं के बीच चमकीली चांदी जैसी मछलियों का एक झुंड घूम रहा था। ऊपर आसमान में, समुद्री बगुले ताजी हवा पर तैर रहे थे। शांतिपूर्ण ज्वार ने सुबह टहलने वालों के पदचिह्नों को धो दिया, जिससे तट साफ और शुद्ध रहा जैसे कि सूरज धीरे-धीरे ऊपर चढ़ रहा था।",
      forest: "एक घुमावदार मिट्टी का रास्ता प्राचीन जंगल में ले गया जहां ऊंचे हरे देवदार के पेड़ पहरा दे रहे थे। नरम हरी काई ने जड़ों पर एक मोटी कालीन बना दी थी, जिससे जंगली जीवों के कदमों को राहत मिली। कुरकुरी सुबह की हवा में देवदार की सुइयों और गीली मिट्टी की सुखद गंध थी। पास में ही एक झरना खुशी से बह रहा था।",
      magic: "छिपे हुए जादूगर के टॉवर के भीतर, एक भारी ओक की मेज पर एक धूल भरी जादुई किताब खुली पड़ी थी। रहस्यमयी बैंगनी अक्षरों ने एक नरम रोशनी के साथ स्पंदन किया, जिससे पत्थर के फर्श पर लंबी परछाइयां पड़ीं। पुराने जादूगर ने अपने हाथ में लकड़ी की छड़ी घुमाई और कमरे में एक सुनहरी तितली उड़ने लगी, जिससे चारों ओर आशा की किरण फैल गई।"
    };
    let foundStory = "";
    for (const [key, text] of Object.entries(mockStoriesHindi)) {
      if (topicLower.includes(key)) {
        foundStory = text;
        break;
      }
    }
    if (!foundStory) {
      foundStory = `एक अद्भुत यात्रा तब शुरू हुई जब एक जिज्ञासु यात्री ने ${targetTopic} पर केंद्रित एक नया मार्ग तलाशने का निर्णय लिया। आगे बढ़ने वाले हर एक कदम ने नई चुनौतियाँ और मूल्यवान अंतर्दृष्टि प्रदान की। यात्री ने महसूस किया कि दृढ़ता और समर्पण के साथ अभ्यास करना ही किसी भी कौशल में महारत हासिल करने का वास्तविक रहस्य है। शांत घंटों में उंगलियां कुंजीपटल पर चलती रहीं।`;
    }
    return res.json({ story: foundStory });
  }

  const mockStories: Record<string, string> = {
    space:
      "The deep space explorer capsule coasted quietly in the starry dark. Looking back at Earth, it appeared as a tiny, glowing sapphire floating in a sea of absolute ink. All around, cold ancient stars twinkled. The crew knew their mission was dangerous, yet their resolve was as strong as iron. They typed command sequences into the terminal, pushing further into the unknown cosmos.",
    ocean:
      "The ocean waves crashed gently upon the golden sands of the shore. A school of bright silver fish darted between the vibrant coral branches underwater. High above, seagulls drifted gracefully on the salt-scented wind, seeking their morning catch. The peaceful tide washed away footprints left by early beachcombers, keeping the coast clean and pure as the sun slowly climbed up the sky.",
    forest:
      "A winding dirt path led deep into the ancient forest where towering emerald pines stood guard. Soft green moss formed a thick carpet over the roots, cushioning the light footsteps of the forest creatures. The crisp morning air carried the pleasant smell of pine needles and damp earth. Somewhere nearby, a hidden brook bubbled merrily, winding its way through the tranquil wilderness.",
    magic:
      "Inside the hidden wizard tower, a dusty spellbook lay open on a heavy oak table. Mystical violet runes pulsed with a soft light, casting long shadows across the stone floor. The old wizard whispered a gentle chant, waving his wooden wand over a glass vial of starlight water. In an instant, a small golden butterfly made of pure stardust fluttered into the room, bringing a sense of hope.",
  };

  let foundStory = "";
  for (const [key, text] of Object.entries(mockStories)) {
    if (topicLower.includes(key)) {
      foundStory = text;
      break;
    }
  }

  if (!foundStory) {
    foundStory = `A remarkable journey began when a curious traveler decided to explore a new path centered around ${targetTopic}. Every single step forward brought fresh challenges and valuable insights. The traveler realized that practicing with persistence and dedication was the true secret to mastering any skill. In the quiet hours of the night, as keys clattered softly, progress was made. True craft is born from steady, deliberate effort, transforming the difficult into the second nature.`;
  }

  return res.json({ story: foundStory });
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
  const { fumbles, bigrams, script } = req.body;
  const targetScript = typeof script === "string" ? script : "english";
  const isHindi = targetScript === "hindi";

  const targetFumbles =
    Array.isArray(fumbles) && fumbles.length > 0
      ? fumbles.join(", ")
      : (isHindi ? "क, र, त" : "z, q, b");
  const targetBigrams =
    Array.isArray(bigrams) && bigrams.length > 0
      ? bigrams.join(", ")
      : (isHindi ? "कर, तर" : "th, er, ou");

  console.log(
    `[API] Generating smart drill for fumbles: "${targetFumbles}", bigrams: "${targetBigrams}" in ${targetScript}`
  );

  try {
    const prompt = isHindi
      ? `Generate a focused typing drill in Hindi (Devanagari script) based on these Devanagari characters: "${targetFumbles}" and "${targetBigrams}". The drill must be an engaging, cohesive paragraph of exactly 70 to 100 words in standard, fluent Hindi. It should heavily feature words that use these characters. Return ONLY the raw Devanagari text. No titles, formatting, markdown, quotes, or introduction.`
      : `Generate a focused typing drill for fumbles: "${targetFumbles}" and bigrams: "${targetBigrams}". The drill must be an engaging, cohesive story of exactly 100 words in standard, fluent English. It should heavily feature words that use these characters and letter combinations. IMPORTANT: Return ONLY the raw text. No titles, formatting, markdown, quotes, or introduction.`;

    const drill = await generateText(prompt);
    if (drill) return res.json({ drill });
  } catch (err: any) {
    console.error("[API] Smart drill generation failed — using fallback:", err.message);
  }

  const fallbackDrill = isHindi
    ? "एक छोटा चूहा जंगल में दौड़ रहा था। उसने पेड़ के नीचे एक चमकता हुआ हीरा देखा। उसने सोचा कि यह कोई मीठा फल है। जैसे ही उसने उसे छूने का प्रयास किया, एक बुद्धिमान कौआ उड़कर आया और बोला कि यह पत्थर है फल नहीं। चूहे ने कौवे की बात मानी और खुश होकर आगे बढ़ गया। निरंतर अभ्यास और सूझबूझ से हम अपनी सभी त्रुटियों को दूर कर सकते हैं और एक कुशल टंकक बन सकते हैं।"
    : `The quick brown fox jumps over the lazy dog. Quickly, the brave explorer zipped up his jacket and began quiet adventures, solving mysteries that bothered him. Through thick forests and under ancient rivers, they found hidden paths, repeating their steps carefully to ensure they would never falter. Every single keystroke was precise, steady, and fast, bringing a sense of ultimate concentration and mastery. With persistence, any hurdle can be cleared, turning fumbles into fluent actions. Focus your mind, breathe quietly, and let your fingers dance across the keys in perfect rhythm and complete control.`;

  return res.json({ drill: fallbackDrill });
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Dynamic social meta tags for shared "beat me" challenge links so
    // crawlers (WhatsApp, Twitter/X, Facebook, Discord) render a scorecard.
    app.get("/", (req, res) => {
      const indexFile = path.join(distPath, "index.html");
      let html: string;
      try {
        html = fs.readFileSync(indexFile, "utf8");
      } catch (e) {
        return res.status(404).send("Not found");
      }

      const parsed = parseChallengeQuery(req.query.challenge as string | null);
      if (!parsed) return res.send(html);

      const origin = `${req.protocol}://${req.get("host")}`;
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
      html = html.replace("<head>", `<head>\n    ${meta}`);
      res.send(html);
    });

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
