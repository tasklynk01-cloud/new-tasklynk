import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TaskLynkLogoProps {
  className?: string;
  variant?: "auto" | "light" | "dark" | "white";
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  href?: string;
}

export function TaskLynkLogo({
  className,
  variant = "auto",
  showTagline = true,
  size = "md",
  asLink = true,
  href = "/",
}: TaskLynkLogoProps) {
  // Size mapping
  const sizeConfig = {
    sm: {
      height: 32,
      iconSize: 26,
      fontSize: "text-lg",
      taglineSize: "text-[7.5px]",
    },
    md: {
      height: 40,
      iconSize: 32,
      fontSize: "text-xl",
      taglineSize: "text-[8.5px]",
    },
    lg: {
      height: 48,
      iconSize: 38,
      fontSize: "text-2xl",
      taglineSize: "text-[10px]",
    },
  }[size];

  // Color configurations based on variant
  const isWhite = variant === "white";
  const isDarkTheme = variant === "dark";

  const textColorClass = isWhite
    ? "text-white"
    : isDarkTheme
    ? "text-white"
    : "text-[#22183D] dark:text-white";

  const taglineColorClass = isWhite
    ? "text-[#DDD5E8]"
    : isDarkTheme
    ? "text-[#DDD5E8]"
    : "text-[#6B627A] dark:text-[#DDD5E8]/80";

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Brand Logo Icon */}
      <Image
        src="/tl-logo-192.png"
        alt="TaskLynk Logo"
        width={sizeConfig.iconSize}
        height={sizeConfig.iconSize}
        className="shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
        priority
        unoptimized
      />

      {/* Typography: TaskLynk + Tagline */}
      <div className="flex flex-col justify-center leading-none">
        <div className={cn("font-black tracking-tight flex items-baseline", sizeConfig.fontSize)}>
          <span className={textColorClass}>Task</span>
          <span className="text-[#FF7A3D]">Lynk</span>
        </div>
        {showTagline && (
          <span
            className={cn(
              "font-medium tracking-normal mt-0.5 whitespace-nowrap",
              sizeConfig.taglineSize,
              taglineColorClass
            )}
          >
            Linking Talent, Delivering Results.
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

export default TaskLynkLogo;
