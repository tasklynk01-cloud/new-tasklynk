export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ServiceCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  priceLabel: string;
  deliverables: string[];
};

export type AlexReply = {
  message: string;
  services: ServiceCard[];
  handover: boolean;
  unavailable?: boolean;
};

export const ALEX_WELCOME =
  "Hi! I'm Alex, your TaskLynk AI assistant. I can answer questions about our 11 service categories, what our specialists do, pricing, company policies, and how ordering works—then point you to the right next step. What would you like to know?";

export const WHATSAPP_URL =
  "https://wa.me/254701066845?text=Hello%20TaskLynk%2C%20I%20would%20like%20assistance%20with%20a%20project.%20Please%20help%20me%20with%20the%20next%20steps.";

export const STARTER_PROMPTS = [
  "Explore our services",
  "What do specialists offer?",
  "Website & software dev",
  "Data analytics & Power BI",
  "Policies & confidentiality",
  "How ordering & pricing works",
];

export const ANALYTICS_EVENTS = [
  "chat_opened",
  "starter_selected",
  "recommendation_displayed",
  "service_opened",
  "quote_opened",
  "order_started",
  "order_created",
  "handover_requested",
  "unanswered",
] as const;
export type AlexEvent = (typeof ANALYTICS_EVENTS)[number];
