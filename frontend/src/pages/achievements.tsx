import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Footprints,
  Hand,
  Lock,
  Medal,
  Rocket,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { EmptyState, PageLoader } from "@/components/ui/feedback";
import { cn, formatDate } from "@/lib/utils";
import type { Achievement } from "@/lib/types";

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  wrench: Wrench,
  target: Target,
  brain: Brain,
  flame: Flame,
  fire: Flame,
  "book-open": BookOpen,
  sparkles: Sparkles,
  medal: Medal,
  rocket: Rocket,
  timer: Timer,
  award: Award,
  hand: Hand,
};

type Filter = "ALL" | "UNLOCKED" | "LOCKED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "UNLOCKED", label: "Terbuka" },
  { value: "LOCKED", label: "Terkunci" },
];

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    api
      .get<Achievement[]>("/api/progress/achievements")
      .then(setAchievements)
      .catch(() => setAchievements([]));
  }, []);

  const unlocked = useMemo(() => (achievements ?? []).filter((a) => a.unlocked), [achievements]);
  const locked = useMemo(() => (achievements ?? []).filter((a) => !a.unlocked), [achievements]);

  if (!achievements) return <PageLoader />;

  const total = achievements.length;
  const unlockedCount = unlocked.length;
  const pct = total ? Math.round((unlockedCount / total) * 100) : 0;
  const earnedXp = unlocked.reduce((sum, a) => sum + a.xpReward, 0);
  const remainingXp = locked.reduce((sum, a) => sum + a.xpReward, 0);
  const next = [...locked].sort((a, b) => a.xpReward - b.xpReward)[0] ?? null;

  const visible = achievements.filter((a) =>
    filter === "ALL" ? true : filter === "UNLOCKED" ? a.unlocked : !a.unlocked
  );

  return (
    <div className="animate-fade-in space-y-5">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-amber-200">
              <Trophy className="h-3 w-3" />
              Koleksi pencapaian · {unlockedCount}/{total}
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Trofi untuk
              <br />
              <span className="text-gradient">kerja nyata.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Pencapaian terbuka otomatis saat kamu membaca materi, menuntaskan misi bengkel, dan menjaga streak.
              Setiap trofi menambah XP ke profil teknisimu.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Wrench className="h-4 w-4" /> Buka trofi berikutnya
              </Link>
              <Link
                to="/progress"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                Lihat rapor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 max-w-lg">
              <div className="flex items-center justify-between font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Koleksi terbuka</span>
                <span className="text-amber-200">{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-200 transition-all duration-700"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* vault terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    trophy.vault
                  </span>
                </div>
                <span className="rounded-full bg-amber-300/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-amber-200">
                  {unlockedCount}/{total}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
                    <circle cx="48" cy="48" r="41" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <circle
                      cx="48"
                      cy="48"
                      r="41"
                      fill="none"
                      stroke="url(#trophyDialGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 41}
                      strokeDashoffset={2 * Math.PI * 41 * (1 - pct / 100)}
                    />
                    <defs>
                      <linearGradient id="trophyDialGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="text-center">
                    <div className="font-display text-xl font-extrabold text-white">{pct}%</div>
                    <div className="font-mono-tech text-[8px] uppercase tracking-[0.16em] text-slate-500">selesai</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                    <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">XP terbuka</div>
                    <div className="mt-0.5 font-display text-sm font-extrabold text-amber-200">+{earnedXp} XP</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                    <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">XP tersisa</div>
                    <div className="mt-0.5 font-display text-sm font-extrabold text-slate-200">{remainingXp} XP</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">
                  Target terdekat
                </div>
                <div className="mt-0.5 truncate text-[11px] font-bold text-slate-200">
                  {next ? next.name : "Semua pencapaian sudah terbuka"}
                </div>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> pantau trofi baru otomatis
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={Trophy} label="Terbuka" value={`${unlockedCount}`} hint={`dari ${total} trofi`} tone="amber" />
        <QuickStat icon={Lock} label="Terkunci" value={`${locked.length}`} hint="terus berlatih" tone="slate" />
        <QuickStat icon={Sparkles} label="XP terbuka" value={`+${earnedXp}`} hint="dari pencapaian" tone="emerald" />
        <QuickStat icon={Target} label="XP tersisa" value={`${remainingXp}`} hint="menanti dibuka" tone="blue" />
      </section>

      {/* ---------------------------------------------------------- filters */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Lemari trofi
            </div>
            <h2 className="mt-0.5 font-display text-xl font-extrabold">Koleksi pencapaianmu</h2>
          </div>
          <div className="inline-flex rounded-xl bg-muted/70 p-1" role="group" aria-label="Filter pencapaian">
            {FILTERS.map((f) => {
              const count =
                f.value === "ALL" ? total : f.value === "UNLOCKED" ? unlockedCount : locked.length;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                    filter === f.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-mono-tech text-[9px]",
                      filter === f.value ? "bg-white/15 text-white" : "bg-background text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {total === 0 ? (
          <EmptyState icon={<Trophy className="h-6 w-6" />} title="Belum ada pencapaian" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Lock className="h-6 w-6" />}
            title="Belum ada trofi di filter ini"
            description="Selesaikan aktivitas belajar untuk membuka pencapaian baru."
          />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Trophy;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-all",
        a.unlocked
          ? "border-amber-200/80 bg-gradient-to-br from-amber-50/80 via-card to-card shadow-soft hover:-translate-y-0.5 hover:shadow-lift"
          : "border-border/70 bg-card shadow-soft"
      )}
    >
      {a.unlocked && (
        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" aria-hidden />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl ring-1",
            a.unlocked
              ? "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 ring-amber-200/80"
              : "bg-muted/60 text-muted-foreground ring-border/60"
          )}
        >
          {a.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
            a.unlocked ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
          )}
        >
          {a.unlocked ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-2.5 w-2.5" />}
          {a.unlocked ? "Terbuka" : "Terkunci"}
        </span>
      </div>

      <h3 className={cn("relative mt-3 font-display text-sm font-extrabold", !a.unlocked && "text-muted-foreground")}>
        {a.name}
      </h3>
      <p className="relative mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">{a.description}</p>

      <div className="relative mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono-tech text-[9.5px] font-bold",
            a.unlocked ? "bg-amber-100/80 text-amber-800" : "bg-muted text-muted-foreground"
          )}
        >
          <Sparkles className="h-2.5 w-2.5" /> +{a.xpReward} XP
        </span>
        {a.unlocked && a.unlockedAt ? (
          <span className="text-[9.5px] text-muted-foreground">{formatDate(a.unlockedAt)}</span>
        ) : (
          <span className="text-[9.5px] text-muted-foreground">Belum terbuka</span>
        )}
      </div>
    </article>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone: "amber" | "slate" | "emerald" | "blue";
}) {
  const cls = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", cls)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[10.5px] text-muted-foreground">{hint}</div>
    </div>
  );
}
