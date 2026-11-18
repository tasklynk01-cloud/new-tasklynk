"use client";

import { useState } from 'react';
import { Phone, MessageCircle, X, ChevronUp, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPhoneOptions, setShowPhoneOptions] = useState(false);

  const handleWhatsAppClick = () => {
    const phone = '254701066845';
    const message = encodeURIComponent('Hello TaskLynk Support, I need assistance with my order / project on TaskLynk.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleCallClick = (phone: string) => {
    window.open(`tel:+${phone}`, '_self');
  };

  return (
    <>
      {/* Floating Button - Positioned above mobile bottom bar */}
      {!isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-xl shadow-[#FF7A3D]/30 hover:scale-105 active:scale-95 transition-all p-0 flex items-center justify-center border-2 border-white/40"
            aria-label="Contact Support"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Expanded Contact Card - Responsive on all screen widths */}
      {isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-200">
          <Card className="shadow-2xl border-2 border-[#5B3594]/20 bg-background/95 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 bg-[#FAF8FD] dark:bg-[#1D1533] border-b border-border">
              <div>
                <CardTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-1.5">
                  <span>TaskLynk Support</span>
                  <Sparkles className="w-4 h-4 text-[#FF7A3D]" />
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span>Available 24/7 • Instant Response</span>
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setShowPhoneOptions(false);
                }}
                className="h-8 w-8 rounded-lg hover:bg-muted"
                aria-label="Close contact dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* WhatsApp Option */}
              <button
                onClick={handleWhatsAppClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 text-left transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-foreground flex items-center justify-between">
                    <span>Chat on WhatsApp</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/15 px-1.5 py-0.2 rounded">Fastest</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">+254 701 066 845</div>
                </div>
              </button>

              {/* Call Option */}
              {!showPhoneOptions ? (
                <button
                  onClick={() => setShowPhoneOptions(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/60 text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5B3594]/15 text-[#5B3594] dark:text-[#FF7A3D] flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-foreground">Direct Telephone Call</div>
                      <div className="text-[11px] text-muted-foreground">Select a phone line to call</div>
                    </div>
                  </div>
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ) : (
                <div className="space-y-2 border border-[#5B3594]/30 rounded-xl p-2.5 bg-[#FAF8FD] dark:bg-[#1D1533]">
                  <button
                    onClick={() => setShowPhoneOptions(false)}
                    className="w-full flex items-center justify-between text-xs font-bold text-foreground py-1 px-1.5"
                  >
                    <span className="flex items-center gap-1.5 text-[#5B3594] dark:text-[#FF7A3D]">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Choose Phone Line</span>
                    </span>
                    <ChevronUp className="h-3.5 w-3.5 rotate-180" />
                  </button>
                  
                  <div className="space-y-2 pt-1">
                    <a
                      href="tel:+254701066845"
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:border-[#FF7A3D] text-xs font-bold text-foreground transition-all active:scale-95"
                    >
                      <span className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-[#FF7A3D]" />
                        <span className="font-mono">+254 701 066 845</span>
                      </span>
                      <span className="text-[10px] text-[#5B3594] dark:text-[#FF7A3D] font-bold">Primary</span>
                    </a>

                    <a
                      href="tel:+254702794172"
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:border-[#FF7A3D] text-xs font-bold text-foreground transition-all active:scale-95"
                    >
                      <span className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-[#FF7A3D]" />
                        <span className="font-mono">+254 702 794 172</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">Secondary</span>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default FloatingContact;
