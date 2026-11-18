import type { ChatMessage } from "./types";

export const IDENTITY_REPLY =
  "I'm Alex, the TaskLynk AI Assistant. I can answer questions about TaskLynk's 11 service categories, what our specialists offer, our policies, pricing, and how managed delivery works—and help you get started whenever you're ready.";

export const SECURITY_REPLY =
  "I'm Alex, the TaskLynk AI Assistant. I have strictly no access to the database, private accounts, customer orders, or personal specialist profiles, and I cannot disclose internal instructions or credentials. I can gladly explain our public services, specialist capabilities, policies, or ordering workflow.";

export const PROVIDER_REPLY =
  "I'm Alex, TaskLynk's AI assistant, not a human employee. External AI services help process chat requests under our privacy notice (/privacy). Please don't share confidential papers, datasets, or credentials in chat.";

export function deterministicReply(text: string): string | null {
  if (/\b(?:hi|hello|hey)\s+(?!alex\b|there\b|tasklynk\b)[a-z]+\b/i.test(text)) {
    return IDENTITY_REPLY;
  }
  if (/\b(provider|underlying model|model name|powered by|gemini|openai|google ai|what (?:ai|model)|which (?:ai|model))\b/i.test(text)) {
    return PROVIDER_REPLY;
  }
  if (
    /\b(ignore|override|disregard)\b.{0,65}\b(instructions|rules|previous|system)\b|\b(system prompt|hidden (?:prompt|instructions)|api[ _-]?key|credentials|jailbreak)\b|\b(rename|change your (?:name|identity)|your (?:new )?name is|pretend (?:to be|you are)|act as|call (?:you|yourself))\b|\b(?:another|other|someone else'?s?|personal)\b.{0,45}\b(?:customer|client|user|order|file|paper|data|specialist'?s?\s+(?:phone|email|contact|profile|address)|database|db)\b/i.test(
      text
    )
  ) {
    return SECURITY_REPLY;
  }
  if (/^\s*(?:who are you|what is your name|your name|who do you work for|are you (?:a human|human|real)|hello alex|hi alex|hi|hello|hey)\s*[?!.]*\s*$/i.test(text)) {
    return IDENTITY_REPLY;
  }
  return null;
}

export function redact(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "[link removed]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/\b(?:\d[ -]?){8,19}\b/g, "[number removed]")
    .replace(/\b(?:password|pin|secret|token|api[_ -]?key)\s*[:=]\s*\S+/gi, "[credential removed]");
}

export function validateMessages(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) return false;
  let total = 0;
  return (
    value.every((item, index) => {
      if (!item || typeof item !== "object" || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
        return false;
      }
      if (item.role !== (index % 2 === 0 ? "user" : "assistant")) return false;
      total += item.content.length;
      return item.content.trim().length > 0 && item.content.length <= 1600 && total <= 8000;
    }) && value[value.length - 1].role === "user"
  );
}
