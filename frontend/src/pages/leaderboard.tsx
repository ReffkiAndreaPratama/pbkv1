import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Flame, Medal, Sparkles, Trophy, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { EmptyState, PageLoader } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth";
import { cn, formatNumber } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/types";

const RANK_TONE = [
  "bg-gradient-to-br from-amber-300 to-amber-400 text-amber-950",
  "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700",
  "bg-gradient-to-br from-orange-200 to-amber-300 text-orange-900",
];

const PODIUM_HEIGHT = ["h-28", "h-20", "h-16"];

export function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    api
      .get<LeaderboardRow[]>("/api/progress/leaderboard")
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  if (!rows) return <PageLoader />;

  if (rows.length === 0)
    return (
      <EmptyState
        icon={<Trophy className="h-6 w-6" />}
        title="Belum ada peserta"
        description="Ajak temanmu ikut TechTutor dan mulai kumpulkan XP bersama."
        action={
          <Link
            to="/practice"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
          >
            Mulai latihan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
    );

  const me = rows.find((r) => r.user.id === user?.id) ?? null;
  const leader = rows[0];
  const maxXp = Math.max(1, leader.totalXp);
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const gapToNext =
    me && me.rank > 1 ? Math.max(0, rows[me.rank - 2].totalXp - me.totalXp) : 0;
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean) as LeaderboardRow[];

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
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-300" />
              </span>
              Papan peringkat · {rows.length} teknisi
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Naik peringkat
              <br />
              <span className="text-gradient">dengan kerja nyata.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Peringkat dihitung dari total XP: materi, kuis, simulasi kasus, dan perbaikan bengkel semuanya
              berkontribusi. Konsistensi mengalahkan keberuntungan.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Sparkles className="h-4 w-4" /> Tambah XP di bengkel
              </Link>
              <Link
                to="/achievements"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Trophy className="h-4 w-4" /> Buka pencapaian
              </Link>
            </div>
          </div>

          {/* own rank terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    rank.status
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {me ? `#${me.rank}` : "GUEST"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-xl font-extrabold text-amber-950 shadow-lg">
                  {me ? initials(me.user.name) : "?"}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-extrabold text-white">
                    {me ? me.user.name : "Belum masuk"}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono-tech text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3 w-3 text-rose-300" /> {me?.streakDays ?? 0} hari
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-300" /> Lv {me?.level ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Total XP</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-amber-200">
                    {formatNumber(me?.totalXp ?? 0)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Peringkat</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-emerald-300">
                    {me ? `#${me.rank}` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <span className="font-mono-tech text-[10px] text-slate-400">
                  {me && me.rank === 1 ? "Kamu memimpin papan" : "Selisih ke atas"}
                </span>
                <span className="font-mono-tech text-[10px] font-bold text-slate-200">
                  {me && me.rank === 1 ? "—" : `${formatNumber(gapToNext)} XP`}
                </span>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> peringkat diperbarui real-time
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- podium */}
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Podium
            </div>
            <h2 className="mt-0.5 font-display text-xl font-extrabold">Tiga teknisi teratas</h2>
          </div>
          <span className="text-[10.5px] font-semibold text-muted-foreground">Berdasarkan total XP</span>
        </div>

        <div className="mt-6 flex items-end justify-center gap-3 sm:gap-6">
          {podiumOrder.map((r) => {
            const isMe = r.user.id === user?.id;
            const first = r.rank === 1;
            return (
              <div key={r.rank} className="flex w-24 flex-col items-center sm:w-32">
                <span
                  className={cn(
                    "flex items-center justify-center rounded-2xl font-display font-extrabold ring-2 ring-white",
                    first
                      ? "h-16 w-16 bg-gradient-to-br from-amber-300 to-amber-500 text-xl text-amber-950 shadow-lg"
                      : "h-12 w-12 bg-gradient-to-br from-slate-100 to-slate-300 text-base text-slate-700"
                  )}
                >
                  {initials(r.user.name)}
                </span>
                <div className="mt-2 flex max-w-full items-center gap-1">
                  <span className="truncate text-center text-[11.5px] font-bold">{r.user.name}</span>
                  {first && <Crown className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" />}
                </div>
                <span className="mt-0.5 font-mono-tech text-[10px] font-bold text-muted-foreground">
                  {formatNumber(r.totalXp)} XP
                </span>
                <div
                  className={cn(
                    "mt-2 flex w-full items-start justify-center rounded-t-xl pt-2",
                    PODIUM_HEIGHT[r.rank - 1] ?? "h-14",
                    r.rank === 1
                      ? "bg-gradient-to-b from-amber-100 to-amber-50 text-amber-700"
                      : r.rank === 2
                        ? "bg-gradient-to-b from-slate-100 to-slate-50 text-slate-600"
                        : "bg-gradient-to-b from-orange-100 to-orange-50 text-orange-700",
                    isMe && "ring-2 ring-primary/40"
                  )}
                >
                  <span className="font-display text-lg font-extrabold">#{r.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- full ranking */}
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Klasemen lengkap
            </div>
            <h2 className="mt-0.5 font-display text-base font-extrabold">Semua peserta</h2>
          </div>
          <span className="text-[10.5px] font-semibold text-muted-foreground">{rows.length} teknisi</span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
          {[...top, ...rest].map((r, i) => {
            const isMe = r.user.id === user?.id;
            const ratio = Math.max(2, Math.round((r.totalXp / maxXp) * 100));
            return (
              <div
                key={r.user.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 transition-colors",
                  i > 0 && "border-t border-border/60",
                  isMe ? "bg-primary/[0.06]" : "hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                    r.rank <= 3 ? RANK_TONE[r.rank - 1] : "bg-muted text-muted-foreground"
                  )}
                >
                  {r.rank}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted font-display text-[10px] font-extrabold text-muted-foreground">
                  {initials(r.user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[11.5px] font-bold">{r.user.name}</span>
                    {isMe && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8.5px] font-bold text-primary">
                        kamu
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          r.rank === 1
                            ? "bg-amber-400"
                            : r.rank === 2
                              ? "bg-slate-400"
                              : r.rank === 3
                                ? "bg-orange-400"
                                : "bg-primary/50"
                        )}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono-tech text-[9px] text-muted-foreground">
                      Lv {r.level} · {r.streakDays}h
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {r.rank <= 3 ? (
                    <Medal className={cn("h-3.5 w-3.5", r.rank === 1 ? "text-amber-500" : "text-slate-400")} />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                  <span className="font-display text-[12px] font-extrabold">{formatNumber(r.totalXp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
