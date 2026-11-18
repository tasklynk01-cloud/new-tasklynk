"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, Shield, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACADEMIC_LEVELS = [
  { label: "High School / College", ratePerPage: 220 },
  { label: "Undergraduate", ratePerPage: 250 },
  { label: "Master's / Postgraduate", ratePerPage: 320 },
  { label: "PhD / Doctoral", ratePerPage: 420 },
  { label: "SPSS / Data Analysis", ratePerPage: 350 },
];

const DEADLINES = [
  { label: "3 - 6 Hours (Urgent)", multiplier: 1.5 },
  { label: "12 - 24 Hours", multiplier: 1.25 },
  { label: "2 - 3 Days", multiplier: 1.1 },
  { label: "5+ Days (Standard)", multiplier: 1.0 },
];

const PAGE_PRESETS = [1, 3, 5, 10, 15];

export function HeroCalculator() {
  const [levelIndex, setLevelIndex] = useState(1); // Undergraduate
  const [pages, setPages] = useState(5);
  const [deadlineIndex, setDeadlineIndex] = useState(3); // 5+ Days
  const levelSelectId = useId();
  const deadlineSelectId = useId();

  const selectedLevel = ACADEMIC_LEVELS[levelIndex];
  const selectedDeadline = DEADLINES[deadlineIndex];

  const estimatedTotal = Math.round(
    pages * selectedLevel.ratePerPage * selectedDeadline.multiplier
  );

  return (
    <div className="linen-card rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden group">
      {/* Subtle Glowing Corner Ambient */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#5B3A8C]/20 dark:bg-[#5B3A8C]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-[#DDD5E8]/60 dark:border-[#3A2F5B]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EEE7FA]/80 dark:bg-[#271E42]/80 text-[#5B3A8C] dark:text-[#EEE7FA] flex items-center justify-center shadow-inner">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#241B3F] dark:text-white flex items-center gap-1.5">
              <span>Instant Price Estimator</span>
              <Sparkles className="w-3.5 h-3.5 text-[#FF7A3D] animate-pulse" />
            </h3>
            <p className="text-[11px] text-[#6F687A] dark:text-[#DDD5E8]/70">Transparent CPP rates • Free Turnitin report</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
          <Zap className="w-3 h-3" /> No Hidden Fees
        </span>
      </div>

      <div className="space-y-4">
        {/* Academic Level */}
        <div>
          <label htmlFor={levelSelectId} className="block text-xs font-bold text-[#241B3F] dark:text-[#EEE7FA] mb-1.5">
            Service &amp; Academic Level
          </label>
          <select
            id={levelSelectId}
            value={levelIndex}
            onChange={(e) => setLevelIndex(Number(e.target.value))}
            className="w-full text-xs sm:text-sm bg-white/40 dark:bg-[#140E24]/60 backdrop-blur-md border border-[#DDD5E8] dark:border-[#3A2F5B] rounded-xl px-3.5 py-2.5 text-[#241B3F] dark:text-[#F8F5FC] font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A3D] cursor-pointer"
          >
            {ACADEMIC_LEVELS.map((lvl, idx) => (
              <option key={lvl.label} value={idx}>
                {lvl.label} (~KSh {lvl.ratePerPage}/pg)
              </option>
            ))}
          </select>
        </div>

        {/* Page Slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-[#241B3F] dark:text-[#EEE7FA]">
              Volume / Length
            </label>
            <span className="text-xs font-black text-[#FF7A3D]">
              {pages} {pages === 1 ? "Page" : "Pages"} ({pages * 275} words)
            </span>
          </div>

          <div className="flex gap-1.5 mb-2.5">
            {PAGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPages(preset)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all ${
                  pages === preset
                    ? "bg-[#5B3A8C] text-white border-[#5B3A8C] shadow-sm"
                    : "bg-white/40 dark:bg-[#271E42]/40 text-[#241B3F] dark:text-[#EEE7FA] border-[#DDD5E8]/60 dark:border-[#3A2F5B] hover:border-[#5B3A8C]"
                }`}
              >
                {preset} {preset === 1 ? "pg" : "pgs"}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={1}
            max={30}
            value={pages}
            aria-label="Number of pages"
            onChange={(e) => setPages(Number(e.target.value))}
            className="w-full accent-[#FF7A3D] h-2 bg-[#EEE7FA]/80 dark:bg-[#271E42]/80 rounded-lg cursor-pointer"
          >
          </input>
          <div className="flex justify-between text-[10px] text-[#6F687A] dark:text-[#DDD5E8]/70 mt-1 font-medium">
            <span>1 page (275 words)</span>
            <span>15 pages</span>
            <span>30+ pages</span>
          </div>
        </div>

        {/* Required Deadline */}
        <div>
          <label htmlFor={deadlineSelectId} className="block text-xs font-bold text-[#241B3F] dark:text-[#EEE7FA] mb-1.5">
            Required Turnaround Time
          </label>
          <select
            id={deadlineSelectId}
            value={deadlineIndex}
            onChange={(e) => setDeadlineIndex(Number(e.target.value))}
            className="w-full text-xs sm:text-sm bg-white/40 dark:bg-[#140E24]/60 backdrop-blur-md border border-[#DDD5E8] dark:border-[#3A2F5B] rounded-xl px-3.5 py-2.5 text-[#241B3F] dark:text-[#F8F5FC] font-medium focus:outline-none focus:ring-2 focus:ring-[#FF7A3D] cursor-pointer"
          >
            {DEADLINES.map((d, idx) => (
              <option key={d.label} value={idx}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estimated Price Bar */}
        <div className="bg-white/30 dark:bg-[#271E42]/30 backdrop-blur-md rounded-2xl p-4 border border-[#DDD5E8]/60 dark:border-[#3A2F5B]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F687A] dark:text-[#DDD5E8]/80 block">Instant Estimate:</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#241B3F] dark:text-white tracking-tight">
                KSh {estimatedTotal.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-[#6F687A] dark:text-[#DDD5E8]/80">
                (~KSh {Math.round(estimatedTotal / pages)}/pg)
              </span>
            </div>
          </div>

          <Button
            asChild
            size="default"
            className="w-full sm:w-auto bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold px-6 rounded-xl shadow-md shadow-[#FF7A3D]/25 hover:shadow-lg hover:shadow-[#FF7A3D]/35 transition-all hover:scale-105"
          >
            <Link href={`/register/client?pages=${pages}&level=${encodeURIComponent(selectedLevel.label)}`} className="flex items-center justify-center gap-1.5">
              <span>Order Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Micro Guarantees */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6F687A] dark:text-[#DDD5E8]/80 pt-1 border-t border-[#DDD5E8] dark:border-[#3A2F5B] font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Turnitin report included</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#5B3A8C] dark:text-[#FF7A3D] shrink-0" />
            <span>Free unlimited revisions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
