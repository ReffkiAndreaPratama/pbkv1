import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  MonitorCog,
  Target,
  TrendingUp,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import {
  cn,
  formatDate,
  formatNumber,
  formatTime,
  quizTypeLabel,
  tierColor,
  tierLabel,
} from "@/lib/utils";
import type {
  ActivityLog,
  MasteryRow,
  QuizSessionRow,
  SimHistoryRow,
  SummaryData,
} from "@/lib/types";

const ACTIVITY_LABEL: Record<string, string> = {
  PRETEST: "Mengerjakan pretest",
  POSTTEST: "Mengerjakan posttest",
  QUIZ_ANSWER: "Menjawab soal kuis",
  CASE_SUBMIT: "Menyelesaikan simulasi",
  MATERIAL_READ: "Membaca materi",
  ACHIEVEMENT: "Membuka pencapaian",
};

const ACTIVITY_TONE: Record<string, string> = {
  PRETEST: "bg-sky-400",
  POSTTEST: "bg-violet-400",
  QUIZ_ANSWER: "bg-amber-400",
  CASE_SUBMIT: "bg-emerald-400",
  MATERIAL_READ: "bg-blue-400",
  ACHIEVEMENT: "bg-amber-300",
};

export function ProgressPage() {
  const [mastery, setMastery] = useState<MasteryRow[] | null>(null);
  const [history, setHistory] = useState<SimHistoryRow[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSessionRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<MasteryRow[]>("/api/progress/mastery"),
      api.get<SimHistoryRow[]>("/api/cases/history"),
      api.get<ActivityLog[]>("/api/progress/activity"),
      api.get<SummaryData>("/api/progress/summary"),
    ])
      .then(([m, h, a, s]) => {
        setMastery(m);
        setHistory(h);
        setActivities(a);
        setQuizzes(s.recentQuizzes ?? []);
        setSummary(s);
      })
      .catch(() => setMastery([]));
  }, []);

  if (!mastery) return <PageLoader />;

  const jalur = getJalur();
  const overall = Math.round(
    (mastery.reduce((sum, m) => sum + m.mastery, 0) / (mastery.length || 1)) * 100
  );
  const chartData = mastery.map((m) => ({
    code: m.code,
    mastery: Math.round(m.mastery * 100),
  }));
  const strongest = [...mastery].sort((a, b) => b.mastery - a.mastery)[0];
  const weakest = [...mastery].sort((a, b) => a.mastery - b.mastery)[0];
  const simSuccess = history.filter((h) => h.success).length;
  const quizAvg = quizzes.length
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.score ?? 0), 0) / quizzes.length)
    : 0;
  const profile = summary?.profile;
  const missionsDone = (summary?.successCases ?? 0) + (summary?.repairSuccess ?? 0);

  return (
    <div className="animate-fade-in space-y-5">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              Rapor teknisi · {jalur} track
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Setiap percobaan
              <br />
              <span className="text-gradient">meninggalkan jejak.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              {strongest
                ? `Kekuatanmu ada di ${strongest.name} (${Math.round(strongest.mastery * 100)}%). ${weakest && weakest.mastery < 0.75 ? `Saat ini ${weakest.name} paling butuh perhatian.` : "Semua skill sudah di jalur mahir — pertahankan!"}`
                : "Belum ada data penguasaan. Mulai dari pretest atau satu misi bengkel."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to={weakest ? `/quiz/adaptive?skill=${weakest.skillId}` : "/practice"}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Target className="h-4 w-4" /> Latih skill terlemah
              </Link>
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Wrench className="h-4 w-4" /> Masuk bengkel
              </Link>
              <Link
                to="/achievements"
                className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                Lihat pencapaian <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* report terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    progress.report
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  SYNCED
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <MasteryDial value={overall} />
                <div className="min-w-0 flex-1 space-y-2">
                  <TerminalRow label="Level" value={`${profile?.level ?? 0}`} tone="sky" />
                  <TerminalRow label="Total XP" value={formatNumber(profile?.totalXp ?? 0)} tone="amber" />
                  <TerminalRow label="Streak" value={`${profile?.streakDays ?? 0} hari`} tone="rose" />
                </div>
              </div>

              <div className="mt-4 space-y-2.5 font-mono-tech text-[10.5px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Simulasi tuntas</span>
                  <span className="font-bold text-slate-200">
                    {history.length > 0 ? `${simSuccess}/${history.length}` : "—"}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${history.length ? Math.max(3, (simSuccess / history.length) * 100) : 3}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Rata-rata kuis</span>
                  <span className="font-bold text-slate-200">{quizzes.length ? `${quizAvg}/100` : "—"}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.max(3, quizAvg)}%` }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <span className="font-mono-tech text-[10px] text-slate-400">Misi tuntas</span>
                <span className="font-mono-tech text-[10px] font-bold text-emerald-300">{missionsDone}</span>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> laporan diperbarui otomatis
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={TrendingUp} label="Mastery" value={`${overall}%`} hint="rata-rata 6 skill" tone="emerald" />
        <QuickStat icon={Trophy} label="Level" value={`${profile?.level ?? 0}`} hint={`${formatNumber(profile?.totalXp ?? 0)} XP`} tone="amber" />
        <QuickStat
          icon={CheckCircle2}
          label="Simulasi"
          value={`${simSuccess}`}
          hint={history.length ? `dari ${history.length} percobaan` : "belum ada percobaan"}
          tone="blue"
        />
        <QuickStat
          icon={Zap}
          label="Kuis"
          value={quizzes.length ? `${quizAvg}` : "—"}
          hint={quizzes.length ? `${quizzes.length} sesi terakhir` : "belum ada kuis"}
          tone="violet"
        />
      </section>

      {/* ---------------------------------------------------------- mastery map */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Peta penguasaan
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Sebaran skill troubleshooting</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              <Activity className="h-3 w-3" /> {overall}% rata-rata
            </span>
          </div>

          {mastery.length === 0 ? (
            <EmptyState
              icon={<BrainCircuit className="h-6 w-6" />}
              title="Belum ada data penguasaan"
              description="Kerjakan pretest atau satu misi bengkel untuk mulai membentuk peta skill."
            />
          ) : (
            <>
              <div className="mt-2 h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="72%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="code"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Mastery"
                      dataKey="mastery"
                      stroke="#0d9488"
                      fill="#14b8a6"
                      fillOpacity={0.28}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Penguasaan"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {mastery.map((m) => {
                  const pct = Math.round(m.mastery * 100);
                  return (
                    <div key={m.skillId} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="font-mono-tech text-[10px] font-bold text-muted-foreground">{m.code}</span>
                          <span className="truncate text-[11px] font-bold">{m.name}</span>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", tierColor(m.tier))}>
                          {tierLabel(m.tier)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400"
                            )}
                            style={{ width: `${Math.max(3, pct)}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono-tech text-[10px] font-bold text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-muted-foreground">
                        <span>
                          {m.successes}/{m.attempts} berhasil
                        </span>
                        <Link
                          to={`/quiz/adaptive?skill=${m.skillId}`}
                          className="font-bold text-primary transition-colors hover:text-primary/80"
                        >
                          Latih
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* activity timeline */}
        <section className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Log aktivitas
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Jejak belajar terbaru</h2>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </span>
          </div>

          {activities.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="Belum ada aktivitas"
              description="Aktivitas membaca materi, kuis, dan misi akan muncul di sini."
            />
          ) : (
            <ol className="relative mt-5 space-y-4 border-l border-border/70 pl-4">
              {activities.slice(0, 12).map((a) => (
                <li key={a.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ring-4 ring-card",
                      ACTIVITY_TONE[a.type] ?? "bg-slate-400"
                    )}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold leading-snug">
                        {ACTIVITY_LABEL[a.type] ?? a.type}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(a.createdAt)}</div>
                    </div>
                    {a.points > 0 && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-700">
                        +{a.points} XP
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {weakest && (
            <Link
              to={`/quiz/adaptive?skill=${weakest.skillId}`}
              className="group mt-auto flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <Target className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Fokus berikutnya
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-bold">
                  {weakest.code} · {tierLabel(weakest.tier)} — {Math.round(weakest.mastery * 100)}%
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          )}
        </section>
      </div>

      {/* ---------------------------------------------------------- histories */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Pohon keputusan
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Riwayat simulasi</h2>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-[9.5px] font-bold text-muted-foreground">
              {history.length} sesi
            </span>
          </div>

          {history.length === 0 ? (
            <EmptyState
              icon={<MonitorCog className="h-6 w-6" />}
              title="Belum ada simulasi"
              description="Mulai dari halaman Simulasi Kasus untuk menguji langkah diagnosis."
            />
          ) : (
            <div className="mt-4 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              <div className="overflow-hidden rounded-xl border border-border/60">
                {history.slice(0, 15).map((h, i) => (
                  <div
                    key={h.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5",
                      i > 0 && "border-t border-border/60",
                      "transition-colors hover:bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        h.success
                          ? "bg-emerald-50 text-emerald-700"
                          : h.success === false
                            ? "bg-rose-50 text-rose-700"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {h.success ? <CheckCircle2 className="h-4 w-4" /> : <MonitorCog className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-bold">{h.caseTitle}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[9.5px] text-muted-foreground">
                        <span className="font-mono-tech">{h.skill.code}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDate(h.startedAt)}</span>
                        <span aria-hidden>·</span>
                        <span>{formatTime(h.timeSec)}</span>
                      </div>
                    </div>
                    {h.success == null ? (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                        Ditinggalkan
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 font-mono-tech text-[10px] font-bold",
                          h.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}
                      >
                        {Math.round(h.score ?? 0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Evaluasi
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Riwayat kuis</h2>
            </div>
            <Link
              to="/evaluation"
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline"
            >
              Detail <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={<BrainCircuit className="h-6 w-6" />}
              title="Belum ada kuis"
              description="Kerjakan pretest, kuis adaptif, atau posttest untuk melihat hasilnya."
            />
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              {quizzes.slice(0, 8).map((q, i) => {
                const pass = q.score !== null && q.score >= 70;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5",
                      i > 0 && "border-t border-border/60",
                      "transition-colors hover:bg-muted/40"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <BrainCircuit className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11.5px] font-bold">{quizTypeLabel(q.type)}</div>
                      <div className="mt-0.5 text-[9.5px] text-muted-foreground">
                        {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold",
                        !q.completedAt
                          ? "bg-sky-50 text-sky-700"
                          : pass
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {q.completedAt ? (pass ? "Lulus" : "Remedial") : "Berjalan"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
            <span className="text-[10.5px] font-semibold text-muted-foreground">Rata-rata skor kuis</span>
            <span className="font-display text-lg font-extrabold">
              {quizzes.length ? quizAvg : "—"}
              {quizzes.length > 0 && <span className="text-[10px] text-muted-foreground">/100</span>}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function MasteryDial({ value }: { value: number }) {
  const size = 108;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, value));
  const offset = c * (1 - safe / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#masteryDialGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="masteryDialGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-white">{safe}%</span>
        <span className="font-mono-tech text-[8px] uppercase tracking-[0.18em] text-slate-500">mastery</span>
      </div>
    </div>
  );
}

function TerminalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sky" | "amber" | "rose";
}) {
  const cls = {
    sky: "text-sky-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  }[tone];
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
      <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className={cn("font-mono-tech text-[10.5px] font-bold", cls)}>{value}</span>
    </div>
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
  tone: "emerald" | "amber" | "blue" | "violet";
}) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
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
