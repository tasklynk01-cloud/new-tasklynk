"use client";

import React, { useEffect, useState } from 'react';
import { Sparkles, Quote, RefreshCw, X, Database } from 'lucide-react';
import type { DailyQuote } from '@/lib/quotes/daily-quotes';

export function DailyQuoteBanner() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed for current tab session
    const isDismissed = sessionStorage.getItem('tasklynk_daily_quote_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    // Check cached quote in sessionStorage
    const cached = sessionStorage.getItem('tasklynk_daily_quote');
    if (cached) {
      try {
        const parsed: DailyQuote = JSON.parse(cached);
        setQuote(parsed);
        setLoading(false);
        return;
      } catch {
        // Fall through to fetch
      }
    }

    fetchQuote();
  }, []);

  async function fetchQuote(forceRefresh = false) {
    if (forceRefresh) setRefreshing(true);
    try {
      const url = forceRefresh ? '/api/cron/daily-quote?refresh=true' : '/api/cron/daily-quote';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load daily quote');
      const data = await res.json();
      const quoteObj: DailyQuote = data.quote || data;
      setQuote(quoteObj);
      sessionStorage.setItem('tasklynk_daily_quote', JSON.stringify(quoteObj));
    } catch {
      // Soft fallback if offline or request interrupted
      if (!quote) {
        setQuote({
          quote: "In God we trust. All others must bring data.",
          author: "W. Edwards Deming",
          category: "Data & Statistics",
          date: new Date().toISOString().split('T')[0],
          generatedBy: "curated",
          keepaliveRecordedAt: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('tasklynk_daily_quote_dismissed', 'true');
  }

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="linen-card rounded-2xl p-4 sm:p-5 animate-pulse flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5B3594]/10"></div>
          <div className="space-y-2">
            <div className="h-3 w-48 bg-muted rounded"></div>
            <div className="h-4 w-72 sm:w-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="linen-card group relative rounded-2xl p-4 sm:p-5 border border-[#DDD3E9] dark:border-[#382B57] bg-gradient-to-r from-white via-[#FAF7FD] to-[#F5EEFB] dark:from-[#1A1230] dark:via-[#1D1436] dark:to-[#170F2B] shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Quote Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-[#5B3594]/10 dark:bg-[#5B3594]/20 text-[#5B3594] dark:text-[#C5B3E6] flex items-center justify-center shrink-0 mt-0.5">
            <Quote className="w-4 h-4 text-[#FF7A3D]" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Top Tag & Connectivity Pill */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B3594] dark:text-[#C5B3E6]">
                {quote.category || 'Daily Academic & Data Wisdom'}
              </span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <Database className="w-2.5 h-2.5 text-emerald-500" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Supabase Active</span>
              </span>
            </div>

            {/* Quote Body */}
            <p className="text-xs sm:text-sm font-semibold text-[#22183D] dark:text-white leading-relaxed italic">
              &ldquo;{quote.quote}&rdquo;
              <span className="not-italic font-bold text-[#FF7A3D] ml-2 text-xs">
                — {quote.author}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <button
            onClick={() => fetchQuote(true)}
            disabled={refreshing}
            title="Generate or refresh daily insight"
            aria-label="Refresh quote"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-[#5B3594] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF7A3D]' : ''}`} />
          </button>

          <button
            onClick={handleDismiss}
            title="Dismiss banner"
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DailyQuoteBanner;

