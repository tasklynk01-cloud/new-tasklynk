"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  Trash2, 
  X, 
  MessageCircle, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALEX_WELCOME, STARTER_PROMPTS, WHATSAPP_URL, type AlexReply, type ChatMessage } from "@/lib/alex/types";
import { trackAlex } from "@/lib/alex/analytics-client";
import { useAuth } from "@/lib/auth-context-v2";

type DisplayMessage = ChatMessage & { services?: AlexReply["services"] };
const welcome = (): DisplayMessage[] => [{ role: "assistant", content: ALEX_WELCOME }];

export function AlexAssistant() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<DisplayMessage[]>(welcome);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [typingIndex, setTypingIndex] = React.useState<number | null>(null);
  const [visibleCharacters, setVisibleCharacters] = React.useState(0);
  const [showPrivacyDetails, setShowPrivacyDetails] = React.useState(false);

  const controller = React.useRef<AbortController | null>(null);
  const requestVersion = React.useRef(0);
  const lastActivity = React.useRef(Date.now());
  const conversationEnd = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hidden = /^\/(admin|manager|freelancer|editor|dashboard|login|register|payment|invoices|pending-approval|forgot-password|reset-password|verify-email)(\/|$)/.test(pathname)
    || /^\/client\/(new-job|place-order|orders|jobs|payments|wallet)(\/|$)/.test(pathname) 
    || pathname === "/catalogue/order";

  const clear = React.useCallback(() => {
    requestVersion.current++;
    controller.current?.abort();
    setMessages(welcome());
    setInput("");
    setBusy(false);
    setTypingIndex(null);
    setVisibleCharacters(0);
    lastActivity.current = Date.now();
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => { 
      if (Date.now() - lastActivity.current > 30 * 60000) clear(); 
    }, 60000);
    return () => { 
      clearInterval(interval); 
      controller.current?.abort(); 
    };
  }, [clear]);

  React.useEffect(() => { 
    if (open) {
      conversationEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); 
    }
  }, [messages, busy, visibleCharacters, open]);

  React.useEffect(() => {
    if (typingIndex === null) return;
    const text = messages[typingIndex]?.content;
    if (!open || !text || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypingIndex(null);
      return;
    }
    let revealed = 0;
    const step = Math.max(12, Math.ceil(text.length / 25));
    const timer = window.setInterval(() => {
      revealed = Math.min(text.length, revealed + step);
      setVisibleCharacters(revealed);
      if (revealed === text.length) {
        window.clearInterval(timer);
        setTypingIndex(null);
        inputRef.current?.focus();
      }
    }, 12);
    return () => window.clearInterval(timer);
  }, [typingIndex, messages, open]);

  React.useEffect(() => { 
    if (hidden) { 
      setOpen(false); 
      clear(); 
    } 
  }, [hidden, clear]);

  React.useEffect(() => { 
    clear(); 
  }, [user?.id, clear]);

  async function send(text: string) {
    if (busy || typingIndex !== null || !text.trim()) return;
    lastActivity.current = Date.now();
    const next: DisplayMessage[] = [...messages, { role: "user", content: text.trim().slice(0, 1600) }];
    setMessages(next.slice(-25));
    setInput("");
    setBusy(true);
    const version = ++requestVersion.current;

    const appendReply = (content: string, services?: AlexReply["services"]) => {
      setVisibleCharacters(0);
      setTypingIndex(Math.min(next.length + 1, 25) - 1);
      setMessages(previous => [...previous, { role: "assistant", content, services } as DisplayMessage].slice(-25));
    };

    const activeController = new AbortController();
    controller.current = activeController;
    const timeout = setTimeout(() => activeController.abort(), 18000);
    const history = next.filter((_, index) => !(index === 0 && next[0].role === "assistant")).slice(-9)
      .map(({ role, content }) => ({ role, content }));

    while (history.length && (history[0].role !== "user" || history.reduce((sum, item) => sum + item.content.length, 0) > 6000)) {
      history.splice(0, history[0].role === "user" ? 2 : 1);
    }

    try {
      const response = await fetch("/api/alex", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ messages: history }), 
        signal: activeController.signal 
      });
      if (!response.ok) throw new Error("Unavailable");
      const reply: AlexReply = await response.json();
      if (version !== requestVersion.current) return;
      appendReply(reply.message, reply.services);
      if (reply.services.length) trackAlex("recommendation_displayed");
      if (reply.handover) trackAlex("unanswered");
    } catch {
      if (version === requestVersion.current) {
        appendReply("I can help you explore our services, statistical packages, and ordering process. For urgent human consultation, feel free to tap the WhatsApp button below anytime.");
      }
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current) { 
        setBusy(false); 
        inputRef.current?.focus(); 
      }
    }
  }

  if (hidden) return null;

  return (
    <>
      {/* Alex Trigger Button - Sits neatly beside the WhatsApp button */}
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          lastActivity.current = Date.now();
          if (next) {
            trackAlex("chat_opened");
            setTimeout(() => inputRef.current?.focus(), 150);
          }
        }}
        aria-label={open ? "Close Alex Assistant" : "Open Alex AI Assistant"}
        className="relative flex items-center gap-2 bg-[#22183D] hover:bg-[#5B3594] text-white px-3.5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20 group"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-[#FF7A3D]" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A3D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7A3D]"></span>
          </span>
        </div>
        <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">Ask Alex</span>
      </button>

      {/* Floating Chat Pop-up - Clean, compact bottom-right window without screen-blocking modal overlay */}
      {open && (
        <div
          role="dialog"
          aria-label="Alex TaskLynk AI Assistant"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(520px,calc(100dvh-7.5rem))] bg-white dark:bg-[#18112C] border border-[#DDD3E9] dark:border-[#382B57] shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-[#22183D] px-4 py-3 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5B3594] flex items-center justify-center text-[#FF7A3D]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-sm leading-none">Alex</h2>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-[#DDD3E9]/80 mt-0.5">TaskLynk Service Navigator</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clear}
                title="Clear conversation"
                aria-label="Clear conversation"
                className="p-1.5 text-[#DDD3E9]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close chat"
                aria-label="Close chat"
                className="p-1.5 text-[#DDD3E9]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-[#FAF8FD] dark:bg-[#1F1638] px-3.5 py-1.5 border-b border-[#EBE4F4] dark:border-[#2C2147] text-[11px] text-[#645B77] dark:text-[#B9B1CA] flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF7A3D] shrink-0" />
              <span>Confidential support. Submit project datasets via portal.</span>
            </span>
            <button 
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="text-[#5B3594] dark:text-[#C5B3E6] font-semibold hover:underline shrink-0 text-[10px] ml-1"
            >
              {showPrivacyDetails ? "Hide" : "Info"}
            </button>
          </div>

          {showPrivacyDetails && (
            <div className="px-3.5 py-2 bg-[#F3ECFB] dark:bg-[#251A40] text-[10px] text-[#554D68] dark:text-[#C4BCDA] border-b border-[#E3DAED] dark:border-[#352752] space-y-1 shrink-0">
              <p>Alex guides you through our 11 service categories, policies, specialist capabilities, and ordering. Never share personal identifiers or passwords in chat.</p>
              <div className="flex gap-3 pt-0.5">
                <Link href="/privacy" className="font-bold underline text-[#5B3594] dark:text-[#E8DEF8]" onClick={() => setOpen(false)}>Privacy Policy</Link>
                <Link href="/terms" className="font-bold underline text-[#5B3594] dark:text-[#E8DEF8]" onClick={() => setOpen(false)}>Terms of Service</Link>
              </div>
            </div>
          )}

          {/* Conversation Log */}
          <div 
            role="log" 
            aria-label="Conversation" 
            className="flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain text-xs"
          >
            {messages.map((message, idx) => (
              <div key={idx} className={message.role === "user" ? "ml-8" : "mr-4"}>
                <div 
                  className={`p-3 rounded-2xl leading-relaxed ${
                    message.role === "user" 
                      ? "bg-[#5B3594] text-white rounded-tr-sm ml-auto" 
                      : "bg-[#F5EEFB] dark:bg-[#231A3D] text-[#22183D] dark:text-[#EDE6F7] rounded-tl-sm border border-[#E9E1F3] dark:border-[#30234E]"
                  }`}
                >
                  {typingIndex === idx ? (
                    <span>
                      {message.content.slice(0, visibleCharacters)}
                      <span className="inline-block ml-0.5 h-3 w-0.5 bg-current animate-pulse align-middle" />
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                </div>

                {/* Service Cards Recommendation */}
                {typingIndex !== idx && message.services && message.services.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {message.services.map((svc) => (
                      <div 
                        key={svc.id} 
                        className="p-2.5 rounded-xl border border-[#DDD3E9] dark:border-[#362753] bg-white dark:bg-[#1C1433] shadow-sm text-left"
                      >
                        <h4 className="font-bold text-xs text-[#22183D] dark:text-white leading-tight">{svc.title}</h4>
                        <p className="text-[11px] text-[#68607A] dark:text-[#B5ADC6] mt-0.5 line-clamp-2">{svc.description}</p>
                        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-[#EFE8F8] dark:border-[#2C2046]">
                          <span className="font-semibold text-[#FF7A3D]">{svc.priceLabel}</span>
                          <Link 
                            href={svc.href}
                            onClick={() => {
                              trackAlex("service_opened");
                              setOpen(false);
                            }}
                            className="font-bold text-[#5B3594] dark:text-[#C5B3E6] hover:underline flex items-center gap-0.5"
                          >
                            <span>Explore</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {(busy || typingIndex !== null) && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A3D] animate-ping" />
                <span>{busy ? "Alex is finding the best answer..." : "Alex is typing..."}</span>
              </div>
            )}
            <div ref={conversationEnd} />
          </div>

          {/* Quick Starter Pills */}
          <div className="px-3 py-1.5 border-t border-[#EDE5F6] dark:border-[#2A1E45] bg-[#FAF8FD] dark:bg-[#1A1230] flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                disabled={busy || typingIndex !== null}
                onClick={() => {
                  trackAlex("starter_selected");
                  void send(prompt);
                }}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-[#241A3E] border border-[#DDD3E9] dark:border-[#382B57] text-[#4E4463] dark:text-[#D1C8E3] hover:border-[#FF7A3D] hover:text-[#FF7A3D] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="p-2.5 bg-white dark:bg-[#18112C] border-t border-[#EDE5F6] dark:border-[#2A1E45] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="Ask Alex a question..."
              maxLength={1600}
              className="flex-1 bg-[#FAF8FD] dark:bg-[#20173A] border border-[#DDD3E9] dark:border-[#382B57] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#5B3594] text-[#22183D] dark:text-white placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="sm"
              disabled={busy || typingIndex !== null || !input.trim()}
              aria-label="Send message"
              className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white rounded-xl h-8 w-8 p-0 shrink-0 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
