import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  return "Selamat malam";
}

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0%";
  return `${Math.round(n * 100)}%`;
}

export function formatTime(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return "0m";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    NOVICE: "Pemula",
    DEVELOPING: "Berkembang",
    PROFICIENT: "Mahir",
  };
  return map[tier] ?? tier;
}

export function tierColor(tier: string): string {
  const map: Record<string, string> = {
    NOVICE: "bg-rose-100 text-rose-700",
    DEVELOPING: "bg-amber-100 text-amber-700",
    PROFICIENT: "bg-emerald-100 text-emerald-700",
  };
  return map[tier] ?? "bg-muted text-muted-foreground";
}

export function difficultyLabel(d: string): string {
  const map: Record<string, string> = {
    EASY: "Mudah",
    MEDIUM: "Sedang",
    HARD: "Sulit",
  };
  return map[d] ?? d;
}

export function difficultyColor(d: string): string {
  const map: Record<string, string> = {
    EASY: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    HARD: "bg-rose-100 text-rose-700",
  };
  return map[d] ?? "bg-muted text-muted-foreground";
}

export function quizTypeLabel(t: string): string {
  const map: Record<string, string> = {
    PRETEST: "Pretest",
    POSTTEST: "Posttest",
    ADAPTIVE: "Kuis Adaptif",
  };
  return map[t] ?? t;
}