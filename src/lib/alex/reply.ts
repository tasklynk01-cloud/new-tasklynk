import type { AlexReply, ServiceCard } from "./types";
import type { Selection } from "./provider";

export function buildReply(selection: Selection, catalogue: ServiceCard[]): AlexReply {
  const ids = new Set(selection.serviceIds);
  const services = selection.showLead ? catalogue.filter((service) => ids.has(service.id)).slice(0, 3) : [];

  const answerText = selection.answer.trim();
  const followUp = selection.followUpQuestion?.trim();
  const message =
    followUp && !answerText.toLowerCase().includes(followUp.toLowerCase())
      ? `${answerText}\n\n${followUp}`
      : answerText;

  return {
    message,
    services,
    handover: selection.handover,
  };
}
