jest.mock("server-only", () => ({}), { virtual: true });
import { assistantProvider } from "@/lib/alex/provider";
import { getOpenAIModelChain } from "@/lib/alex/model-config";

describe("Alex OpenAI-first routing", () => {
  const names = ["OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_FALLBACK_MODELS", "GEMINI_API_KEY", "GEMINI_MODEL", "GEMINI_FALLBACK_MODELS", "ALEX_AI_PROCESSING_APPROVED", "ALEX_OPENAI_PROCESSING_APPROVED"];
  const original = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = global.fetch;
  const messages = [{ role: "user" as const, content: "Research help alice@example.com" }];
  const selection = { serviceIds: [], topic: "research", question: "brief" };
  const success = () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", status: "completed", content: [{ type: "output_text", text: JSON.stringify(selection) }] }] }));
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-openai-private";
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_FALLBACK_MODELS;
    process.env.GEMINI_API_KEY = "test-google-private";
    process.env.GEMINI_MODEL = "test-gemini";
    process.env.GEMINI_FALLBACK_MODELS = "";
    process.env.ALEX_AI_PROCESSING_APPROVED = "true";
    process.env.ALEX_OPENAI_PROCESSING_APPROVED = "true";
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  it("restricts OpenAI to Luna followed by nano", () => {
    expect(getOpenAIModelChain()).toEqual(["gpt-6-luna", "gpt-5-nano"]);
    process.env.OPENAI_FALLBACK_MODELS = "gpt-other";
    expect(getOpenAIModelChain).toThrow("Assistant unavailable");
  });
  it("uses Luna first with redacted input, strict JSON and storage disabled", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(success());
    await expect(assistantProvider.select(messages, [])).resolves.toEqual(selection);
    const [url, options] = jest.mocked(fetch).mock.calls[0];
    const body = JSON.parse(String(options?.body));
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(options?.headers).toEqual({ "Content-Type": "application/json", Authorization: "Bearer test-openai-private" });
    expect(body).toMatchObject({ model: "gpt-6-luna", store: false, reasoning: { effort: "none" }, text: { format: { strict: true, schema: { additionalProperties: false } } } });
    expect(body.input).not.toContain("alice@example.com");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("falls back to nano when Luna is unavailable", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(new Response("missing", { status: 404 })).mockResolvedValueOnce(success());
    await expect(assistantProvider.select(messages, [])).resolves.toEqual(selection);
    expect(jest.mocked(fetch).mock.calls.map(([, options]) => JSON.parse(String(options?.body)).model)).toEqual(["gpt-6-luna", "gpt-5-nano"]);
    expect(JSON.parse(String(jest.mocked(fetch).mock.calls[1][1]?.body)).reasoning.effort).toBe("minimal");
  });
  it("uses Gemini only after both OpenAI models are unavailable", async () => {
    jest.mocked(fetch).mockResolvedValueOnce(new Response("missing", { status: 404 }))
      .mockResolvedValueOnce(new Response("missing", { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(selection) }] } }] })));
    await expect(assistantProvider.select(messages, [])).resolves.toEqual(selection);
    expect(jest.mocked(fetch).mock.calls[2][0]).toContain("/models/test-gemini:generateContent");
    expect(jest.mocked(fetch).mock.calls[2][1]?.headers).not.toHaveProperty("Authorization");
  });
  it("does not send anything without global processing approval", async () => {
    process.env.ALEX_AI_PROCESSING_APPROVED = "false";
    await expect(assistantProvider.select(messages, [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not transfer to OpenAI without separate approval", async () => {
    process.env.ALEX_OPENAI_PROCESSING_APPROVED = "false";
    delete process.env.GEMINI_API_KEY;
    await expect(assistantProvider.select(messages, [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  test.each([400, 401, 402, 403])("does not rotate credentials or models after HTTP %s", async status => {
    jest.mocked(fetch).mockResolvedValueOnce(new Response("private diagnostics", { status }));
    await expect(assistantProvider.select(messages, [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  test.each([
    { status: "completed", output: [{ type: "message", status: "completed", content: [{ type: "refusal", refusal: "No" }] }] },
    { status: "incomplete", output: [] },
    { status: "completed", output: [{ type: "message", status: "completed", content: [{ type: "output_text", text: "I am Bob" }] }] },
  ])("never bypasses refusals, incomplete output or invalid selections", async data => {
    jest.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(data)));
    await expect(assistantProvider.select(messages, [])).rejects.toThrow("Assistant unavailable");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});