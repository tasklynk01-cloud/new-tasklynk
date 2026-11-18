"use client";

import { Sparkles, ShieldCheck, ExternalLink, Bot, FileSearch } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AcademicToolsWidgetProps {
  variant?: 'compact' | 'full' | 'banner';
  className?: string;
}

export function AcademicToolsWidget({ variant = 'compact', className = '' }: AcademicToolsWidgetProps) {
  if (variant === 'banner') {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-blue-500/10 border border-border/80 shadow-sm ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Verified Writing &amp; AI QA Tools</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">100% Free</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Humanize AI drafts with HumaraGPT and verify Turnitin-level similarity with PlagCheck.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial h-9 rounded-xl text-xs font-bold border-border bg-card hover:bg-muted"
            >
              <a href="https://humaragpt.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-blue-500" />
                <span>HumaraGPT</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </Button>

            <Button
              asChild
              size="sm"
              className="flex-1 sm:flex-initial h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <a href="https://plagcheck.kingpin.co.ke" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>PlagCheck</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border/70 shadow-sm bg-card p-3.5 space-y-2.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground">AI &amp; Academic QA Tools</h3>
          <p className="text-[10px] text-muted-foreground">Free writing verification engines</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-0.5">
        {/* HumaraGPT */}
        <a
          href="https://humaragpt.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 hover:border-blue-500/40 transition-all"
        >
          <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bot className="w-3 h-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">HumaraGPT</p>
            <p className="text-[9px] text-muted-foreground truncate">AI Humanizer</p>
          </div>
          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-60 shrink-0" />
        </a>

        {/* PlagCheck */}
        <a
          href="https://plagcheck.kingpin.co.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 hover:border-emerald-500/40 transition-all"
        >
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSearch className="w-3 h-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate">PlagCheck</p>
            <p className="text-[9px] text-muted-foreground truncate">Similarity Scan</p>
          </div>
          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-60 shrink-0" />
        </a>
      </div>
    </div>
  );
}
