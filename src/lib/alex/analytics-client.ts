"use client";
import type { AlexEvent } from "./types";

export function trackAlex(event: AlexEvent): void {
  try {
    if (sessionStorage.getItem("alex-metrics-consent") !== "yes" || navigator.doNotTrack === "1") return;
    void fetch("/api/alex/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }), keepalive: true }).catch(() => undefined);
  } catch { /* Optional metrics must never affect orders or chat. */ }
}