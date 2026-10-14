import { hasChosenJalur } from "./learning-path";
import type { SessionUser } from "./api";

export function flowTarget(user: SessionUser | null): string {
  if (!user) return "/login";
  if (user.role === "ADMIN") return "/admin";
  if (!user.profile?.learningStyle) return "/onboarding";
  if (!hasChosenJalur()) return "/path";
  if (!user.profile?.pretestDone) return "/quiz/pretest";
  return "/dashboard";
}

// Tahap wajib yang belum dilewati user. Jika null, semua halaman terbuka.
export function flowBlockedStep(user: SessionUser | null): string | null {
  if (!user) return "/login";
  if (user.role === "ADMIN") return null;
  if (!user.profile?.learningStyle) return "/onboarding";
  if (!hasChosenJalur()) return "/path";
  if (!user.profile?.pretestDone) return "/quiz/pretest";
  return null;
}
