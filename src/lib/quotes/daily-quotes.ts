import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface DailyQuote {
  quote: string;
  author: string;
  category: string;
  date: string;
  generatedBy: 'ai' | 'curated';
  keepaliveRecordedAt: string;
}

// Curated library of 40+ quotes across Statistics, Academic Research, Tech, and Scholarship
export const CURATED_QUOTES: Array<{ quote: string; author: string; category: string }> = [
  {
    quote: "In God we trust. All others must bring data.",
    author: "W. Edwards Deming",
    category: "Data & Statistics",
  },
  {
    quote: "The combination of some data and an aching desire for an answer does not ensure that a reasonable answer can be extracted from a given body of data.",
    author: "John Tukey",
    category: "Statistical Rigor",
  },
  {
    quote: "Research is seeing what everybody else has seen and thinking what nobody else has thought.",
    author: "Albert Szent-Györgyi",
    category: "Research Innovation",
  },
  {
    quote: "Essentially, all models are wrong, but some are useful.",
    author: "George E. P. Box",
    category: "Statistical Modeling",
  },
  {
    quote: "If you torture the data enough, nature will always confess.",
    author: "Ronald Coase",
    category: "Academic Integrity",
  },
  {
    quote: "Errors using inadequate data are much less than those using no data at all.",
    author: "Charles Babbage",
    category: "Scientific Method",
  },
  {
    quote: "To understand God's thoughts we must study statistics, for these are the measure of His purpose.",
    author: "Florence Nightingale",
    category: "Data & Healthcare",
  },
  {
    quote: "The goal is to turn data into information, and information into insight.",
    author: "Carly Fiorina",
    category: "Business Intelligence",
  },
  {
    quote: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
    category: "Software Engineering",
  },
  {
    quote: "Without data, you're just another person with an opinion.",
    author: "W. Edwards Deming",
    category: "Decision Science",
  },
  {
    quote: "The most exciting phrase to hear in science is not 'Eureka!' but 'That's funny...'",
    author: "Isaac Asimov",
    category: "Scientific Discovery",
  },
  {
    quote: "Data are just summaries of thousands of stories. Tell a few of those stories to help make the data meaningful.",
    author: "Chip & Dan Heath",
    category: "Data Storytelling",
  },
  {
    quote: "Writing is the painting of the voice.",
    author: "Voltaire",
    category: "Academic Writing",
  },
  {
    quote: "Far better an approximate answer to the right question, which is often vague, than an exact answer to the wrong question, which can always be made precise.",
    author: "John Tukey",
    category: "Methodology",
  },
  {
    quote: "If I have seen further, it is by standing on the shoulders of giants.",
    author: "Isaac Newton",
    category: "Literature Review",
  },
  {
    quote: "There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies.",
    author: "C.A.R. Hoare",
    category: "Technical Architecture",
  },
  {
    quote: "It is a capital mistake to theorize before one has data. Insensibly one begins to twist facts to suit theories, instead of theories to suit facts.",
    author: "Arthur Conan Doyle",
    category: "Empirical Research",
  },
  {
    quote: "The greatest value of a picture is when it forces us to notice what we never expected to see.",
    author: "John Tukey",
    category: "Data Visualization",
  },
  {
    quote: "Information is the resolution of uncertainty.",
    author: "Claude Shannon",
    category: "Information Theory",
  },
  {
    quote: "Science is what we understand well enough to explain to a computer. Art is everything else we do.",
    author: "Donald Knuth",
    category: "Computer Science",
  },
  {
    quote: "A researcher who makes no mistakes is probably doing no real research.",
    author: "Kurt Lewin",
    category: "Research Philosophy",
  },
  {
    quote: "Clear thinking requires courage rather than intelligence.",
    author: "Thomas Szasz",
    category: "Critical Analysis",
  },
  {
    quote: "Statistics is the grammar of science.",
    author: "Karl Pearson",
    category: "Statistical Foundation",
  },
  {
    quote: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    category: "Quality Assurance",
  },
];

/**
 * Returns today's date formatted as YYYY-MM-DD in East Africa Time (UTC+3)
 */
export function getTodayDateString(): string {
  const now = new Date();
  // Adjust to East Africa Time (UTC+3)
  const eatOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const eatDate = new Date(now.getTime() + (eatOffset + localOffset) * 60 * 1000);
  return eatDate.toISOString().split('T')[0];
}

/**
 * Calls Gemini or OpenAI API to dynamically craft a fresh academic / statistical quote
 */
async function generateAiQuote(): Promise<{ quote: string; author: string; category: string } | null> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAIKey = process.env.OPENAI_API_KEY?.trim();

  const prompt = `Generate a single inspiring, scholarly, or statistical quote suitable for a dashboard seen by academic researchers, statistical analysts, thesis students, and business consultants. 
Return ONLY valid JSON matching this schema:
{"quote": "...", "author": "...", "category": "..."}
Keep the quote concise (under 25 words). Category should be one of: Data & Statistics, Research Integrity, Academic Excellence, Statistical Rigor, or Tech Innovation.`;

  // 1. Try Gemini
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.quote && parsed.author && parsed.category) {
            return parsed;
          }
        }
      }
    } catch {
      // Fall through to OpenAI or curated
    }
  }

  // 2. Try OpenAI
  if (openAIKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 250,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.quote && parsed.author && parsed.category) {
            return parsed;
          }
        }
      }
    } catch {
      // Fall through to curated
    }
  }

  return null;
}

/**
 * Retrieves today's quote from Supabase, or generates and stores a new one.
 * Always touches Supabase with read and write operations to guarantee
 * active database transactions, preventing Supabase from entering paused state.
 */
export async function getOrGenerateDailyQuote(forceRefresh = false): Promise<DailyQuote> {
  const today = getTodayDateString();
  const quoteKey = 'dashboard.daily_quote.current';
  const keepaliveKey = 'supabase.keepalive.ping';
  const nowIso = new Date().toISOString();

  // 1. Check existing quote in Supabase
  if (!forceRefresh) {
    try {
      const existing = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, quoteKey))
        .limit(1);

      if (existing.length > 0 && existing[0].value) {
        const stored: DailyQuote = JSON.parse(existing[0].value);
        if (stored.date === today && stored.quote) {
          // Touch keepalive heartbeat and return
          await touchKeepalivePing(stored.date);
          return stored;
        }
      }
    } catch (readErr) {
      console.warn('[DailyQuote] Could not read from Supabase:', readErr);
    }
  }

  // 2. Generate quote (AI first, then deterministic curated)
  let quoteData = await generateAiQuote();
  let generatedBy: 'ai' | 'curated' = 'ai';

  if (!quoteData) {
    // Pick from curated list deterministically by day of the year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const dayOfYear = Math.floor((new Date().getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    quoteData = CURATED_QUOTES[dayOfYear % CURATED_QUOTES.length];
    generatedBy = 'curated';
  }

  const dailyQuote: DailyQuote = {
    quote: quoteData.quote,
    author: quoteData.author,
    category: quoteData.category,
    date: today,
    generatedBy,
    keepaliveRecordedAt: nowIso,
  };

  // 3. Write quote to Supabase system_settings
  try {
    await db
      .insert(systemSettings)
      .values({
        key: quoteKey,
        value: JSON.stringify(dailyQuote),
        type: 'json',
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: JSON.stringify(dailyQuote),
          updatedAt: nowIso,
        },
      });

    // Also write historical record for today
    await db
      .insert(systemSettings)
      .values({
        key: `dashboard.daily_quote.${today}`,
        value: JSON.stringify(dailyQuote),
        type: 'json',
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: JSON.stringify(dailyQuote),
          updatedAt: nowIso,
        },
      });

    // 4. Record keepalive heartbeat ping
    await touchKeepalivePing(today);
  } catch (writeErr) {
    console.error('[DailyQuote] Failed to write quote to Supabase:', writeErr);
  }

  return dailyQuote;
}

/**
 * Updates Supabase keepalive ping counter to keep the database awake
 */
export async function touchKeepalivePing(todayDate?: string): Promise<{ success: boolean; lastPing: string }> {
  const date = todayDate || getTodayDateString();
  const nowIso = new Date().toISOString();
  const keepaliveKey = 'supabase.keepalive.ping';

  try {
    let pingCount = 1;
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, keepaliveKey))
      .limit(1);

    if (existing.length > 0 && existing[0].value) {
      try {
        const parsed = JSON.parse(existing[0].value);
        pingCount = (parsed.count || 0) + 1;
      } catch {
        pingCount = 1;
      }
    }

    const payload = {
      status: 'active',
      lastPing: nowIso,
      date,
      count: pingCount,
      environment: process.env.NODE_ENV || 'production',
      preventPause: true,
    };

    await db
      .insert(systemSettings)
      .values({
        key: keepaliveKey,
        value: JSON.stringify(payload),
        type: 'json',
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: JSON.stringify(payload),
          updatedAt: nowIso,
        },
      });

    return { success: true, lastPing: nowIso };
  } catch (err) {
    console.error('[DailyQuote] Failed to touch Supabase keepalive:', err);
    return { success: false, lastPing: nowIso };
  }
}

