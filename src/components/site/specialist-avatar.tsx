"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Code2,
  BarChart2,
  Palette,
  FileSpreadsheet,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SpecialistAvatarProps {
  avatarUrl?: string | null;
  name: string;
  headline?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showVerifiedDot?: boolean;
}

const sizeMap: Record<
  "sm" | "md" | "lg" | "xl",
  { container: string; icon: string; text: string }
> = {
  sm: {
    container: "w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px]",
    icon: "w-4 h-4",
    text: "text-xs",
  },
  md: {
    container: "w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px]",
    icon: "w-6 h-6",
    text: "text-base",
  },
  lg: {
    // 64px on mobile & desktop - crisp and strictly constrained
    container: "w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px]",
    icon: "w-7 h-7",
    text: "text-lg",
  },
  xl: {
    // 80px on phone/mobile screens, 96px on tablet & desktop
    container: "w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] sm:w-24 sm:h-24 sm:min-w-[96px] sm:min-h-[96px] sm:max-w-[96px] sm:max-h-[96px]",
    icon: "w-8 h-8 sm:w-10 sm:h-10",
    text: "text-xl sm:text-2xl",
  },
};

export function SpecialistAvatar({
  avatarUrl,
  name,
  headline = "",
  size = "md",
  className,
  showVerifiedDot = true,
}: SpecialistAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const cfg = sizeMap[size] || sizeMap.md;

  // Pick appropriate real role icon based on headline
  const getRoleIcon = () => {
    const text = (headline + " " + name).toLowerCase();
    if (text.includes("financ") || text.includes("accounting") || text.includes("bi specialist")) {
      return <TrendingUp className={cn(cfg.icon, "text-white")} />;
    }
    if (text.includes("web") || text.includes("developer") || text.includes("architect") || text.includes("software")) {
      return <Code2 className={cn(cfg.icon, "text-white")} />;
    }
    if (text.includes("data") || text.includes("statistic") || text.includes("spss") || text.includes("quant")) {
      return <BarChart2 className={cn(cfg.icon, "text-white")} />;
    }
    if (text.includes("brand") || text.includes("design") || text.includes("visual") || text.includes("creative")) {
      return <Palette className={cn(cfg.icon, "text-white")} />;
    }
    if (text.includes("research") || text.includes("consultant") || text.includes("feasibility")) {
      return <FileSpreadsheet className={cn(cfg.icon, "text-white")} />;
    }
    if (text.includes("academic") || text.includes("thesis") || text.includes("dissertation")) {
      return <GraduationCap className={cn(cfg.icon, "text-white")} />;
    }
    return <Briefcase className={cn(cfg.icon, "text-white")} />;
  };

  const initial = name ? name.trim().charAt(0).toUpperCase() : "T";
  const hasValidImage = Boolean(avatarUrl && !imageError && avatarUrl.trim() !== "");

  return (
    <div
      className={cn(
        "relative shrink-0 select-none group/avatar aspect-square rounded-full",
        cfg.container,
        className
      )}
      style={{ aspectRatio: "1 / 1" }}
    >
      <div
        className={cn(
          "relative overflow-hidden flex items-center justify-center font-black shadow-lg ring-2 ring-white/60 dark:ring-[#3A2F5B]/80 transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:ring-[#FF7A3D] rounded-full w-full h-full aspect-square",
          cfg.text,
          !hasValidImage && "bg-gradient-to-tr from-[#241B3F] via-[#5B3594] to-[#FF7A3D]"
        )}
        style={{ aspectRatio: "1 / 1" }}
      >
        {hasValidImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl!}
            alt={name}
            onError={() => setImageError(true)}
            loading="lazy"
            decoding="async"
            className="w-full h-full max-w-full max-h-full object-cover rounded-full block pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "cover",
              borderRadius: "9999px",
              aspectRatio: "1 / 1",
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center relative w-full h-full p-1 text-center">
            {/* Real expertise specialty icon */}
            <div className="drop-shadow-md">
              {getRoleIcon()}
            </div>
            {/* Subtle Initial Badge */}
            <span className="absolute bottom-1 right-1 text-[9px] font-black uppercase tracking-tighter bg-black/40 backdrop-blur-sm text-white px-1.5 py-0.2 rounded-md border border-white/20">
              {initial}
            </span>
          </div>
        )}
      </div>

      {showVerifiedDot && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#140E24] shadow-md flex items-center justify-center pointer-events-none z-10"
          title="TaskLynk Verified Specialist"
        >
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </span>
      )}
    </div>
  );
}
