"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type Theme = "professional" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = "tasklynk_workspace_theme";
const ALL_THEME_CLASSES = ["dark", "professional", "earthy", "nature"];

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/client",
  "/freelancer",
  "/admin",
  "/workspace",
  "/orders",
  "/messages",
  "/analytics",
  "/finance",
  "/settings",
  "/profile",
];

function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return DASHBOARD_ROUTES.some((route) => pathname.startsWith(route));
}

function applyThemeClass(theme: Theme, pathname: string | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Remove all legacy/active theme classes first
  ALL_THEME_CLASSES.forEach((cls) => root.classList.remove(cls));

  // Public/marketing pages ALWAYS stay in the clean professional linen theme (never dark)
  if (!isDashboardRoute(pathname)) {
    return;
  }

  // Dashboard pages adopt the user's selected theme (dark or professional)
  if (theme === "dark") {
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, _setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "professional";
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null;
    return stored === "dark" ? "dark" : "professional";
  });

  useEffect(() => {
    applyThemeClass(theme, pathname);
  }, [theme, pathname]);

  const setTheme = (t: Theme) => {
    _setTheme(t);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, t);
    }
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const stored = (typeof window !== "undefined" ? (window.localStorage.getItem(THEME_KEY) as Theme | null) : null) === "dark" ? "dark" : "professional";
    return {
      theme: stored,
      setTheme: (t: Theme) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(THEME_KEY, t);
          applyThemeClass(t, window.location.pathname);
        }
      },
    } as ThemeContextValue;
  }
  return ctx;
}
