import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpenText,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  MonitorCog,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { tierLabel, formatNumber, greeting, dateChip, cn } from "@/lib/utils";
import type { SummaryData, PathItem, QuizSessionRow } from "@/lib/types";

const pathIcon: Record<string, React.ReactNode> = {
  MATERIAL: <BookOpenText size={17} />,
  CASE: <MonitorCog size={17} />,
  QUIZ: <Brain size={17} />,
  POSTTEST: <Trophy size={17} />,
};

const pathHref = (item: PathItem) =>
  item.type === "MATERIAL"
    ? `/materials/${item.refId}`
    : item.type === "CASE"
      ? `/cases/${item.refId}`
      : item.type === "QUIZ"
        ? `/quiz/adaptive?skill=${item.skillId}`
        : "/exam";

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [path, setPath] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<SummaryData>("/api/progress/summary"), api.get<PathItem[]>("/api/cases/path")])
      .then(([s, p]) => {
        setSummary(s);
        setPath(p);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <PageLoader />;

  const p = summary.profile;
  const jalur = getJalur();
  const isPC = jalur === "PC";
  const overall = Math.min(100, Math.round((summary.avgMastery || 0) * 100));
  const currentMaterial = path.find((i) => i.type === "MATERIAL");
  const recommended = path[0];
  const missionsDone = summary.successCases + summary.repairSuccess;
  const lastQuiz = summary.recentQuizzes[0] ?? null;

  return (
    <div className="animate-fade-in space-y-5">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-0 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              Dashboard · {jalur} track
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl">
              {greeting()}, {user?.name?.split(" ")[0]}.
              <br />
              <span className="text-gradient">Lanjutkan progresmu.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              {summary.materialReads} materi dibaca · {missionsDone} misi tuntas · mastery rata-rata {overall}%. Semua
              aktivitasmu tersusun di satu tempat.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to={currentMaterial ? pathHref(currentMaterial) : "/materials"}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 shadow-none transition-colors hover:bg-emerald-400"
              >
                <BookOpenText className="h-4 w-4" /> Lanjutkan materi
              </Link>
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Wrench className="h-4 w-4" /> Masuk bengkel
              </Link>
              <Link
                to="/progress"
                className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                Lihat progres <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-7 max-w-lg">
              <div className="flex items-center justify-between font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Progress jalur · Troubleshooting {jalur}</span>
                <span className="text-emerald-300">{overall}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700"
                  style={{ width: `${Math.max(2, overall)}%` }}
                />
              </div>
            </div>
          </div>

          {/* status terminal */}
          <div className="self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    learner.status
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {p.pretestDone ? "READY" : "PRETEST"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <TerminalStat icon={Zap} label="Total XP" value={formatNumber(p.totalXp)} tone="amber" />
                <TerminalStat icon={Flame} label="Streak" value={`${p.streakDays} hari`} tone="rose" />
                <TerminalStat icon={Trophy} label="Level" value={`${p.level}`} tone="emerald" />
                <TerminalStat icon={Activity} label="Mastery" value={`${overall}%`} tone="sky" />
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <span className="font-mono-tech text-[10px] text-slate-400">Materi dibaca · misi tuntas</span>
                <span className="font-mono-tech text-[10px] font-bold text-slate-200">
                  {summary.materialReads} · {missionsDone}
                </span>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> jalur {jalur.toLowerCase()} aktif
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- pretest banner */}
      {!p.pretestDone && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Target className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="text-sm font-extrabold text-amber-950">Belum mengerjakan pretest</strong>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-900/75">
              Pretest membantu kami mengukur kemampuan awalmu dan menyusun jalur belajar adaptif.
            </p>
          </div>
          <Link
            to="/quiz/pretest"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white transition-colors hover:bg-amber-700"
          >
            Kerjakan Pretest <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ---------------------------------------------------------- stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat icon={Zap} label="XP total" value={formatNumber(p.totalXp)} hint="dari semua aktivitas" tone="amber" />
        <MiniStat icon={Flame} label="Streak" value={`${p.streakDays}`} hint="hari beruntun" tone="rose" />
        <MiniStat icon={Trophy} label="Level" value={`${p.level}`} hint="level teknisi" tone="emerald" />
        <MiniStat icon={ListChecks} label="Misi berhasil" value={`${missionsDone}`} hint={`${summary.repairSuccess} di bengkel`} tone="blue" />
      </section>

      {/* ---------------------------------------------------------- next up */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Lanjutkan dari terakhir
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Materi saat ini</h2>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 font-mono-tech text-[9px] font-bold text-muted-foreground">
              {currentMaterial ? currentMaterial.skillCode : "MULAI"}
            </span>
          </div>

          <div className="mt-4 flex flex-1 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <BookOpenText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-snug">
                {currentMaterial ? currentMaterial.reason : "Mulai dari materi pertama"}
              </h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {currentMaterial
                  ? "Ikuti materi yang direkomendasikan sesuai hasil pretest kamu."
                  : "Baca materi untuk membangun dasar troubleshooting."}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, overall)}%` }} />
                </div>
                <strong className="font-mono-tech text-[10px] text-muted-foreground">{summary.materialReads}/6</strong>
              </div>
            </div>
          </div>

          <Link
            to="/materials"
            className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Buka Materi <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>

        <section className="flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Rekomendasi untukmu
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Aktivitas berikutnya</h2>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-4 flex flex-1 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <Target className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-snug">
                {recommended ? recommended.reason : "Latihan adaptif"}
              </h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {recommended
                  ? `Fokus pada skill ${recommended.skillCode} yang masih perlu diperkuat.`
                  : "Kerjakan pretest untuk mendapat rekomendasi personal."}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" /> 10 menit <span className="text-border">|</span> 10 soal
              </span>
            </div>
          </div>

          <Link
            to={recommended ? pathHref(recommended) : "/practice"}
            className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-white text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            Mulai Latihan <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>

      {/* ---------------------------------------------------------- insight strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InsightCard
          icon={CheckCircle2}
          label="Hasil terakhir"
          value={
            lastQuiz
              ? `${lastQuiz.correctCount}/${lastQuiz.totalCount} benar · ${Math.round(lastQuiz.score ?? 0)}%`
              : "Belum ada hasil"
          }
          tone="emerald"
        />
        <InsightCard
          icon={Target}
          label="Kategori lemah"
          value={weakestSkill(summary) || "Belum ada data"}
          tone="amber"
        />
        <Link
          to="/repair"
          className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Wrench className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Akses cepat</span>
            <span className="mt-0.5 block truncate text-xs font-bold">Bengkel · {summary.repairSuccess} perbaikan sukses</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </div>

      {/* ---------------------------------------------------------- skills + adaptive */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Perkembangan kemampuan
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Progress keterampilan</h2>
            </div>
            <Link
              to="/progress"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              Lihat detail <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {summary.masteryBySkill.map((m) => {
              const pct = Math.round(m.mastery * 100);
              return (
                <div key={m.code} className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-tech text-[11px] font-bold">{m.code}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                        pct >= 75
                          ? "bg-emerald-50 text-emerald-700"
                          : pct >= 40
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tierLabel(m.tier)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-slate-400"
                        )}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono-tech text-[10px] font-bold text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Link
          to="/adaptive"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#0d1a2f] p-5 text-white shadow-soft"
        >
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" aria-hidden />
          <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Brain className="h-5 w-5 text-violet-300" />
            </span>
            <div className="mt-4 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-violet-300">
              Pembelajaran adaptif
            </div>
            <h3 className="mt-1 font-display text-lg font-extrabold leading-snug">Belajar sesuai kebutuhanmu</h3>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
              Rekomendasi disusun dari hasil kuis, simulasi, dan perbaikan terakhir.
            </p>
          </div>
          <div className="relative mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
            Lihat rekomendasi <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* ---------------------------------------------------------- quiz history */}
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Kuis terbaru
            </div>
            <h2 className="mt-0.5 font-display text-base font-extrabold">Riwayat kuis</h2>
          </div>
          <Link to="/evaluation" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
            Lihat evaluasi <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {summary.recentQuizzes.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={24} />}
            title="Belum ada kuis"
            description="Kerjakan pretest, kuis adaptif, atau posttest untuk melihat hasilnya di sini."
          />
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
            {summary.recentQuizzes.map((q, i) => (
              <QuizHistoryRow key={q.id} q={q} first={i === 0} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- path preview */}
      {path.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Jalur personal
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Langkah berikutnya</h2>
            </div>
            <span className="text-[10.5px] font-semibold text-muted-foreground">{path.length} aktivitas tersusun</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {path.slice(0, 4).map((item, i) => (
              <Link
                key={`${item.type}-${item.refId}-${i}`}
                to={pathHref(item)}
                className="group flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-border/70">
                  {pathIcon[item.type]}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono-tech text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.skillCode}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] font-semibold leading-snug">{item.reason}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="flex items-center gap-1.5 px-1 text-[10.5px] text-muted-foreground">
        <Clock className="h-3 w-3" /> {dateChip()}
      </p>
    </div>
  );
}

function weakestSkill(s: SummaryData): string | null {
  const weak = [...s.masteryBySkill].sort((a, b) => a.mastery - b.mastery)[0];
  if (!weak || weak.mastery >= 0.75) return null;
  return `${weak.code} — ${tierLabel(weak.tier)}`;
}

function TerminalStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "amber" | "rose" | "emerald" | "sky";
}) {
  const cls = {
    amber: "text-amber-300",
    rose: "text-rose-300",
    emerald: "text-emerald-300",
    sky: "text-sky-300",
  }[tone];
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 px-2.5 py-2">
      <div className="flex items-center gap-1.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <Icon className={cn("h-3 w-3", cls)} /> {label}
      </div>
      <div className="mt-1 font-display text-sm font-extrabold leading-none text-white">{value}</div>
    </div>
  );
}

function MiniStat({
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
  tone: "amber" | "rose" | "emerald" | "blue";
}) {
  const cls = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
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

function InsightCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "emerald" | "amber";
}) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", cls)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-xs font-bold">{value}</div>
      </div>
    </div>
  );
}

function QuizHistoryRow({ q, first }: { q: QuizSessionRow; first: boolean }) {
  const typeLabel: Record<string, string> = { PRETEST: "Pretest", POSTTEST: "Posttest", ADAPTIVE: "Kuis Adaptif" };
  const pass = q.score !== null && q.score >= 70;
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3.5 py-3",
        !first && "border-t border-border/60",
        "transition-colors hover:bg-muted/40"
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ListChecks size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold">{typeLabel[q.type] ?? q.type}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">
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
        {q.completedAt ? (pass ? "Lulus" : "Belum lulus") : "Berjalan"}
      </span>
    </div>
  );
}
