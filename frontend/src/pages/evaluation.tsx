import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { EmptyState, PageLoader } from "@/components/ui/feedback";
import { cn, formatDate, formatNumber, quizTypeLabel, tierColor, tierLabel } from "@/lib/utils";
import type { QuizSessionRow, SummaryData } from "@/lib/types";

export function EvaluationPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    api.get<SummaryData>("/api/progress/summary").then(setSummary);
  }, []);

  if (!summary) return <PageLoader />;

  const p = summary.profile;
  const completed = summary.recentQuizzes.filter((q) => q.completedAt);
  const avg = completed.length
    ? Math.round(completed.reduce((a, q) => a + (q.score ?? 0), 0) / completed.length)
    : 0;
  const pretestScore = summary.recentQuizzes.find((q) => q.type === "PRETEST")?.score ?? null;
  const posttestScore =
    summary.recentQuizzes.find((q) => q.type === "POSTTEST")?.score ?? p.posttestScore;
  const growth =
    pretestScore !== null && posttestScore !== null
      ? Math.round(posttestScore - pretestScore)
      : null;
  const missionsDone = summary.successCases + summary.repairSuccess;
  const overall = Math.round((summary.avgMastery || 0) * 100);

  const bars = [
    { label: "Pretest", value: pretestScore, tone: "from-sky-400 to-blue-500", text: "text-sky-300" },
    { label: "Rata-rata", value: completed.length ? avg : null, tone: "from-amber-300 to-orange-400", text: "text-amber-300" },
    { label: "Ujian", value: posttestScore, tone: "from-emerald-400 to-teal-400", text: "text-emerald-300" },
  ];

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
              Rapor resmi · capaian belajar
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Bukti bahwa
              <br />
              <span className="text-gradient">kamu berkembang.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Bandingkan hasil pretest dengan ujian akhir, lihat skill yang menguat, dan temukan langkah berikutnya.
              Latihan tidak dinilai di sini — hanya capaian resmi yang masuk rapor.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to={p.posttestDone ? "/progress" : "/exam"}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                {p.posttestDone ? <TrendingUp className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                {p.posttestDone ? "Lihat rapor lengkap" : "Kerjakan ujian akhir"}
              </Link>
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Wrench className="h-4 w-4" /> Tambah pengalaman
              </Link>
            </div>

            <div className="mt-7 grid max-w-lg grid-cols-3 gap-2.5">
              {bars.map((b) => (
                <div key={b.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">{b.label}</div>
                  <div className={cn("mt-0.5 font-display text-lg font-extrabold", b.text)}>
                    {b.value !== null ? Math.round(b.value) : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* eval terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    eval.summary
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {p.posttestDone ? "FINAL" : "ONGOING"}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-3">
                <div className="flex items-center justify-between font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  <span>Pertumbuhan skor</span>
                  <span className={growth !== null && growth >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {growth !== null ? `${growth > 0 ? "+" : ""}${growth}` : "—"}
                  </span>
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-display text-3xl font-extrabold leading-none">
                    {growth !== null ? `${growth > 0 ? "+" : ""}${growth}` : "—"}
                  </span>
                  <span className="pb-0.5 font-mono-tech text-[9px] text-slate-500">poin</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      growth !== null && growth < 0 ? "bg-rose-400" : "bg-gradient-to-r from-emerald-400 to-teal-300"
                    )}
                    style={{ width: `${growth !== null ? Math.max(3, Math.min(100, Math.abs(growth))) : 3}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Level</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-sky-300">{p.level}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Mastery</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-emerald-300">{overall}%</div>
                </div>
              </div>

              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> evaluasi diperbarui otomatis
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={Target} label="Pretest" value={pretestScore !== null ? `${Math.round(pretestScore)}` : "—"} hint="titik awal" tone="blue" />
        <QuickStat icon={Trophy} label="Ujian" value={posttestScore !== null ? `${Math.round(posttestScore)}` : "—"} hint="KKM 70" tone="amber" />
        <QuickStat icon={ListChecks} label="Rata-rata" value={completed.length ? `${avg}` : "—"} hint={`${completed.length} kuis selesai`} tone="violet" />
        <QuickStat
          icon={TrendingUp}
          label="Growth"
          value={growth !== null ? `${growth > 0 ? "+" : ""}${growth}` : "—"}
          hint="poin perubahan"
          tone="emerald"
        />
      </section>

      {/* ---------------------------------------------------------- growth + skills */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Perbandingan hasil
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Pretest → ujian akhir</h2>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                p.posttestDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}
            >
              {p.posttestDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {p.posttestDone ? "Selesai" : "Berjalan"}
            </span>
          </div>

          <div className="mt-6 flex h-44 items-end justify-around gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 pb-3 pt-6">
            {bars.map((b) => {
              const value = b.value !== null ? Math.max(4, Math.min(100, Math.round(b.value))) : 4;
              return (
                <div key={b.label} className="flex h-full w-full max-w-[76px] flex-col items-center justify-end gap-1.5">
                  <span className="font-mono-tech text-[10px] font-bold">
                    {b.value !== null ? Math.round(b.value) : "—"}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-lg bg-gradient-to-t transition-all duration-700",
                        b.value !== null ? b.tone : "from-slate-200 to-slate-300"
                      )}
                      style={{ height: `${value}%` }}
                    />
                  </div>
                  <span className="text-[9.5px] font-bold text-muted-foreground">{b.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <TrendingUp className="h-4 w-4" />
            </span>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {growth !== null
                ? growth > 0
                  ? `Skormu naik ${growth} poin dari pretest ke ujian akhir. Pertahankan pola belajar yang sama.`
                  : growth === 0
                    ? "Skor pretest dan ujian akhir sama. Fokuskan latihan pada skill dengan penguasaan terendah."
                    : `Skor turun ${Math.abs(growth)} poin. Tinjau kembali materi dan kerjakan latihan adaptif per skill.`
                : "Kerjakan pretest dan ujian akhir untuk melihat pertumbuhan skor secara utuh."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Kompetensi
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Perkembangan keterampilan</h2>
            </div>
            <Link
              to="/progress"
              className="inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline"
            >
              Detail <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {summary.masteryBySkill.map((m) => {
              const pct = Math.round(m.mastery * 100);
              return (
                <div key={m.code} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
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
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ---------------------------------------------------------- summary + history */}
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Ringkasan capaian
          </div>
          <h2 className="mt-0.5 font-display text-base font-extrabold">Progres keseluruhan</h2>

          <div className="mt-4 space-y-2.5">
            <SummaryRow icon={Trophy} tone="amber" title={`Level ${p.level}`} sub={`${formatNumber(p.totalXp)} XP total`} />
            <SummaryRow icon={Flame} tone="rose" title={`${p.streakDays} hari streak`} sub="jaga konsistensi harian" />
            <SummaryRow
              icon={CheckCircle2}
              tone="emerald"
              title={`${missionsDone} misi tuntas`}
              sub={`${summary.repairSuccess} dari bengkel`}
            />
            <SummaryRow icon={Brain} tone="violet" title={`${overall}% mastery`} sub="rata-rata seluruh skill" />
          </div>

          {!p.posttestDone ? (
            <Link
              to="/exam"
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              Kerjakan ujian akhir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              to="/achievements"
              className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Lihat pencapaian
            </Link>
          )}
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Riwayat
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Semua hasil latihan &amp; ujian</h2>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-[9.5px] font-bold text-muted-foreground">
              {summary.recentQuizzes.length} sesi
            </span>
          </div>

          {summary.recentQuizzes.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-6 w-6" />}
              title="Belum ada hasil"
              description="Kerjakan pretest atau ujian akhir untuk mulai mengisi rapor."
            />
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              {summary.recentQuizzes.map((q, i) => (
                <EvalRow key={q.id} q={q} first={i === 0} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EvalRow({ q, first }: { q: QuizSessionRow; first: boolean }) {
  const pass = q.score !== null && q.score >= 70;
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40",
        !first && "border-t border-border/60"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ListChecks className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11.5px] font-bold">{quizTypeLabel(q.type)}</div>
        <div className="mt-0.5 text-[9.5px] text-muted-foreground">
          {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100 ·{" "}
          {q.completedAt ? formatDate(q.completedAt) : "belum selesai"}
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
}

function SummaryRow({
  icon: Icon,
  tone,
  title,
  sub,
}: {
  icon: LucideIcon;
  tone: "amber" | "rose" | "emerald" | "violet";
  title: string;
  sub: string;
}) {
  const cls = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", cls)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[11.5px] font-bold">{title}</div>
        <div className="text-[9.5px] text-muted-foreground">{sub}</div>
      </div>
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
  tone: "blue" | "amber" | "violet" | "emerald";
}) {
  const cls = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
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
