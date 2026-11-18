import "server-only";

const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

/** Explicit allowlist only: verified Gemini production models. */
export function getModelChain(): string[] {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_MODELS[0]).trim();
  const fallbacks = process.env.GEMINI_FALLBACK_MODELS === undefined
    ? DEFAULT_MODELS.slice(1)
    : process.env.GEMINI_FALLBACK_MODELS.split(",").map(value => value.trim()).filter(Boolean);
  const models = [...new Set([primary, ...fallbacks])].map(m => m.trim()).filter(Boolean);
  if (models.length > 8 || models.some(model => !/^[a-zA-Z0-9._-]{1,100}$/.test(model))) throw new Error("Assistant unavailable");
  return models;
}

const DEFAULT_OPENAI_MODELS = ["gpt-6-luna", "gpt-5-nano"];

/** OpenAI models approved for Alex. */
export function getOpenAIModelChain(): string[] {
  const primary = (process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODELS[0]).trim();
  const fallbacks = process.env.OPENAI_FALLBACK_MODELS === undefined
    ? DEFAULT_OPENAI_MODELS.slice(1)
    : process.env.OPENAI_FALLBACK_MODELS.split(",").map(value => value.trim()).filter(Boolean);
  const models = [...new Set([primary, ...fallbacks])].map(m => m.trim()).filter(Boolean);
  if (models.some(model => !["gpt-6-luna", "gpt-5-nano", "gpt-4o-mini", "gpt-5.4-nano"].includes(model))) throw new Error("Assistant unavailable");
  return models;
}
