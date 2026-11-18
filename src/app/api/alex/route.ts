import { NextRequest } from "next/server";
import { getPublishedServices, searchServices } from "@/lib/alex/catalogue";
import { deterministicReply, validateMessages } from "@/lib/alex/guards";
import { TASKLYNK_PUBLIC_KNOWLEDGE } from "@/lib/alex/knowledge";
import { assistantProvider } from "@/lib/alex/provider";
import { buildReply } from "@/lib/alex/reply";
import { allowRequest, catalogueTimeout, json, readSmallJson, validOrigin } from "@/lib/alex/http";

export const runtime = "nodejs";

function buildFallbackText(query: string): string {
  const q = query.toLowerCase();
  if (/\b(policy|policies|privacy|confidential|refund|terms|plagiarism|conduct)\b/.test(q)) {
    return `${TASKLYNK_PUBLIC_KNOWLEDGE.policies.qualityAndConduct.slice(0, 3).join(" ")} ${TASKLYNK_PUBLIC_KNOWLEDGE.policies.privacyAndConfidentiality[0]} You can review full details at /policy and /privacy.`;
  }
  if (/\b(specialist|specialists|team|who works|vetting|writers|developers|analysts)\b/.test(q)) {
    return `${TASKLYNK_PUBLIC_KNOWLEDGE.specialists.model} ${TASKLYNK_PUBLIC_KNOWLEDGE.specialists.whatTheyDo.slice(0, 3).join(" ")} Personal specialist contact details are never exposed; all work is managed through TaskLynk.`;
  }
  if (/\b(price|pricing|cost|how much|order|how it works|workflow)\b/.test(q)) {
    return `${TASKLYNK_PUBLIC_KNOWLEDGE.workflowAndPricing.steps.slice(0, 3).join(" ")} ${TASKLYNK_PUBLIC_KNOWLEDGE.workflowAndPricing.pricing[0]} Visit /pricing or submit a brief at /client/new-job.`;
  }
  return "TaskLynk is Kenya's Academic Writing & Managed Professional Services Platform covering 11 service categories—from Academic Writing Services & Academic Support (essays, research papers, theses, dissertations) to Website & Software Development, Data Analytics (SPSS, R, Power BI), Graphic Design, Video Production, Virtual Assistance, Accounting, and Business Research. Tell me what you're working on and I'll point you to the right service.";
}

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return json({ error: "Please use Alex on the TaskLynk website." }, 403);
  if (!allowRequest(request, "alex-chat", 12)) return json({ error: "Please wait a minute before sending another message." }, 429);

  let body: unknown;
  try {
    body = await readSmallJson(request);
  } catch {
    return json({ error: "Please send a short text message." }, 400);
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!validateMessages(messages)) {
    return json({ error: "Please send a shorter message or start a new conversation." }, 400);
  }

  const latest = messages[messages.length - 1].content;
  const fixed = deterministicReply(latest);
  if (fixed) {
    return json({ message: fixed, services: [], handover: /human|whatsapp|complaint|refund/i.test(latest) });
  }

  try {
    const catalogue = await catalogueTimeout(getPublishedServices());
    try {
      const selection = await assistantProvider.select(messages, catalogue);
      return json(buildReply(selection, catalogue));
    } catch (providerError) {
      console.error("[Alex Provider Selection Error]:", providerError);
      return json({
        message: buildFallbackText(latest),
        services: searchServices(catalogue, latest),
        handover: true,
        unavailable: true,
      });
    }
  } catch (outerError) {
    console.error("[Alex Outer Catalogue Error]:", outerError);
    return json({
      message: buildFallbackText(latest),
      services: [],
      handover: true,
      unavailable: true,
    });
  }
}
