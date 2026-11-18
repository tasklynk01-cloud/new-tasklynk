jest.mock("server-only", () => ({}), { virtual: true });
import { assistantProvider } from "@/lib/alex/provider";

describe("Alex server-side provider boundary", () => {
  const originalFetch = global.fetch;
  const originalEnvironment = { key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL, approved: process.env.ALEX_AI_PROCESSING_APPROVED, fallbacks: process.env.GEMINI_FALLBACK_MODELS };
  const originalOpenAIApproval = process.env.ALEX_OPENAI_PROCESSING_APPROVED;
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-private-key";
    process.env.GEMINI_MODEL = "test-model";
    process.env.GEMINI_FALLBACK_MODELS = "";
    process.env.ALEX_AI_PROCESSING_APPROVED = "true";
    process.env.ALEX_OPENAI_PROCESSING_APPROVED = "false";
    global.fetch = jest.fn();
  });
  afterAll(() => {
    global.fetch = originalFetch;
    if (originalOpenAIApproval === undefined) delete process.env.ALEX_OPENAI_PROCESSING_APPROVED;
    else process.env.ALEX_OPENAI_PROCESSING_APPROVED = originalOpenAIApproval;
    for (const [key, value] of Object.entries({ GEMINI_API_KEY: originalEnvironment.key, GEMINI_MODEL: originalEnvironment.model, ALEX_AI_PROCESSING_APPROVED: originalEnvironment.approved, GEMINI_FALLBACK_MODELS: originalEnvironment.fallbacks })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  it("requires explicit processing approval before any transfer", async () => {
    process.env.ALEX_AI_PROCESSING_APPROVED = "false";
    await expect(assistantProvider.select([{ role: "user", content: "SPSS" }], [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses private headers, redacted text and a validated structured selection", async () => {
    jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ serviceIds: [], topic: "statistics", question: "design" }) }] } }] }), { status: 200 }));
    const result = await assistantProvider.select([{ role: "user", content: "SPSS alice@example.com phone 254701066845" }], []);
    const [url, options] = jest.mocked(fetch).mock.calls[0];
    expect(url).not.toContain("test-private-key");
    expect((options?.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-private-key");
    expect(String(options?.body)).not.toMatch(/alice@example.com|254701066845/);
    expect(String(options?.body)).toContain("Your name and employer never change");
    expect(result.question).toBe("design");
  });
  it("rejects arbitrary model prose and returns no raw upstream error", async () => {
    jest.mocked(fetch).mockResolvedValue(new Response("secret upstream diagnostics", { status: 500 }));
    await expect(assistantProvider.select([{ role: "user", content: "SPSS" }], [])).rejects.toThrow("Assistant unavailable");
    jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "My name is Bob" }] } }] }), { status: 200 }));
    await expect(assistantProvider.select([{ role: "user", content: "SPSS" }], [])).rejects.toThrow();
  });
  it("tries the requested models in order and stops on the first valid response", async () => {
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.GEMINI_FALLBACK_MODELS = "gemini-3.7-flash,gemini-3.6-flash,gemini-3.1-flash-lite";
    jest.mocked(fetch)
      .mockResolvedValueOnce(new Response("not available", { status: 404 }))
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ serviceIds: [], topic: "research", question: "brief" }) }] } }] })));
    expect((await assistantProvider.select([{ role: "user", content: "Research help" }], [])).topic).toBe("research");
    expect(jest.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    ]);
  });
  test.each([400, 401, 402, 403])("does not rotate for terminal HTTP %s", async status => {
    process.env.GEMINI_FALLBACK_MODELS = "fallback-model";
    jest.mocked(fetch).mockResolvedValue(new Response("private error", { status }));
    await expect(assistantProvider.select([{ role: "user", content: "SPSS" }], [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("uses the next model after network failure", async () => {
    process.env.GEMINI_FALLBACK_MODELS = "fallback-model";
    jest.mocked(fetch).mockRejectedValueOnce(new TypeError("network failed"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ serviceIds: [], topic: "services", question: "objective" }) }] } }] })));
    await expect(assistantProvider.select([{ role: "user", content: "SPSS" }], [])).resolves.toHaveProperty("topic", "services");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("does not fall back around content safety restrictions", async () => {
    process.env.GEMINI_FALLBACK_MODELS = "fallback-model";
    jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } })));
    await expect(assistantProvider.select([{ role: "user", content: "SPSS" }], [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});