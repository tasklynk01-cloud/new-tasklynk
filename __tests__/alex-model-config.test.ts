jest.mock("server-only", () => ({}), { virtual: true });
import { getModelChain } from "@/lib/alex/model-config";

describe("Alex model configuration", () => {
  const original = { primary: process.env.GEMINI_MODEL, fallback: process.env.GEMINI_FALLBACK_MODELS };
  afterEach(() => {
    for (const [key, value] of Object.entries({ GEMINI_MODEL: original.primary, GEMINI_FALLBACK_MODELS: original.fallback })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  it("defaults to the requested descending chain with valid lower-model IDs", () => {
    delete process.env.GEMINI_MODEL; delete process.env.GEMINI_FALLBACK_MODELS;
    expect(getModelChain()).toEqual(["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  });
  it("supports explicitly disabling fallbacks", () => {
    process.env.GEMINI_MODEL = "primary"; process.env.GEMINI_FALLBACK_MODELS = "";
    expect(getModelChain()).toEqual(["primary"]);
  });
  it("deduplicates while preserving configured priority", () => {
    process.env.GEMINI_MODEL = "primary"; process.env.GEMINI_FALLBACK_MODELS = "primary, fallback, fallback";
    expect(getModelChain()).toEqual(["primary", "fallback"]);
  });
  it("rejects URL injection", () => {
    process.env.GEMINI_FALLBACK_MODELS = "bad/model?key=secret";
    expect(getModelChain).toThrow("Assistant unavailable");
  });
});