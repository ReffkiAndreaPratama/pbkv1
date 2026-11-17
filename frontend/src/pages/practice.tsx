import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock,
  Laptop,
  MonitorCog,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { PageLoader } from "@/components/ui/feedback";
import { cn, formatDate, tierColor, tierLabel } from "@/lib/utils";
import type { MasteryRow, QuizSessionRow, RepairJobListItem, SummaryData } from "@/lib/types";

export function PracticePage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [jobs, setJobs] = useState<RepairJobListItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<SummaryData>("/api/progress/summary"),
      api.get<MasteryRow[]>("/api/progress/mastery"),
      api.get<RepairJobListItem[]>("/api/repair/jobs").catch(() => [] as RepairJobListItem[]),
    ]).then(([s, m, j]) => {
      setSummary(s);
      setMastery(m);
      setJobs(j);
    });
  }, []);

  if (!summary) return <PageLoader />;

  const jalur = getJalur();
  const recent = summary.recentQuizzes;
  const avgScore = recent.length
    ? Math.round(recent.reduce((a, q) => a + (q.score ?? 0), 0) / recent.length)
    : 0;
  const weak = [...mastery].sort((a, b) => a.mastery - b.mastery);
  const focus = weak[0] ?? null;
  const overall = Math.round((summary.avgMastery || 0) * 100);
  const pcJobs = jobs.filter((j) => j.deviceType === "PC").length;
  const laptopJobs = jobs.filter((j) => j.deviceType === "LAPTOP").length;
  const profile = summary.profile;

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
              Ruang latihan · {jalur} track
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Latihan yang tepat,
              <br />
              <span className="text-gradient">bukan asal klik.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Pilih format yang sesuai kebutuhanmu hari ini: ukur kemampuan, latih skill terlemah, atau langsung
              turun tangan membongkar perangkat di bengkel.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to={focus ? `/quiz/adaptive?skill=${focus.skillId}` : "/quiz/adaptive"}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Target className="h-4 w-4" /> Mulai kuis adaptif
              </Link>
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Wrench className="h-4 w-4" /> Masuk bengkel
              </Link>
              <Link
                to="/materials"
                className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                Baca materi <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-7 max-w-lg">
              <div className="flex items-center justify-between font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Penguasaan rata-rata</span>
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

          {/* practice terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    practice.status
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  READY
                </span>
              </div>

              <div className="mt-3 space-y-2 font-mono-tech text-[10.5px]">
                <TerminalRow
                  label="Pretest"
                  value={profile.pretestDone ? "SELESAI" : "BELUM"}
                  ok={profile.pretestDone}
                />
                <TerminalRow
                  label="Posttest"
                  value={profile.posttestDone ? `${profile.posttestScore ?? 0}/100` : "BELUM"}
                  ok={profile.posttestDone}
                />
                <TerminalRow label="Kuis dikerjakan" value={`${recent.length} sesi`} ok={recent.length > 0} />
                <TerminalRow
                  label="Rata-rata skor"
                  value={recent.length ? `${avgScore}/100` : "—"}
                  ok={recent.length > 0 && avgScore >= 70}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Level</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-sky-300">{profile.level}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Total XP</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-amber-200">{profile.totalXp}</div>
                </div>
              </div>

              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> pilih modul latihan di bawah
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={ClipboardList} label="Kuis" value={`${recent.length}`} hint="sesi terakhir" tone="blue" />
        <QuickStat
          icon={Trophy}
          label="Rata-rata"
          value={recent.length ? `${avgScore}` : "—"}
          hint={recent.length ? "skor kuis" : "belum ada kuis"}
          tone="amber"
        />
        <QuickStat icon={Zap} label="Level" value={`${profile.level}`} hint={`${profile.totalXp} XP`} tone="violet" />
        <QuickStat icon={Sparkles} label="Mastery" value={`${overall}%`} hint="rata-rata skill" tone="emerald" />
      </section>

      {/* ---------------------------------------------------------- practice modes */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Modul latihan
            </div>
            <h2 className="mt-0.5 font-display text-xl font-extrabold">Pilih cara kamu berlatih</h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">4 modul tersedia</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ModeCard
            icon={ClipboardList}
            tone="blue"
            badge={profile.pretestDone ? "Selesai" : "Wajib"}
            badgeTone={profile.pretestDone ? "emerald" : "amber"}
            title="Pretest Kemampuan"
            description="Ukur kemampuan awal sebelum jalur belajar adaptif disusun."
            progressLabel={profile.pretestDone ? "Sudah dikerjakan" : "Belum dikerjakan"}
            progress={profile.pretestDone ? 100 : 0}
            href="/quiz/pretest"
            cta={profile.pretestDone ? "Ulangi pretest" : "Mulai pretest"}
          />
          <ModeCard
            icon={Brain}
            tone="violet"
            badge="Adaptif"
            badgeTone="violet"
            title="Kuis Adaptif"
            description="Soal menyesuaikan penguasaan skill yang sedang kamu latih."
            progressLabel="Penguasaan saat ini"
            progress={overall}
            href={focus ? `/quiz/adaptive?skill=${focus.skillId}` : "/quiz/adaptive"}
            cta="Mulai kuis"
          />
          <ModeCard
            icon={Trophy}
            tone="amber"
            badge={profile.posttestDone ? "Lulus" : "Belum"}
            badgeTone={profile.posttestDone ? "emerald" : "slate"}
            title="Posttest"
            description="Uji pemahaman akhir setelah materi & simulasi. Minimal lulus 70."
            progressLabel={profile.posttestDone ? "Skor akhir" : "Belum dikerjakan"}
            progress={profile.posttestScore ?? 0}
            progressSuffix="/100"
            href="/quiz/posttest"
            cta="Mulai posttest"
          />
          <ModeCard
            icon={Wrench}
            tone="emerald"
            badge="Praktik"
            badgeTone="emerald"
            title="Bengkel PC & Laptop"
            description="Inspeksi komponen, ukur, ganti bagian rusak, lalu tes nyala."
            progressLabel={`${pcJobs} misi PC · ${laptopJobs} laptop`}
            progress={100}
            href="/repair"
            cta="Masuk bengkel"
            primary
          />
        </div>
      </section>

      {/* ---------------------------------------------------------- skill focus + aside */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Fokus per skill
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Latihan berdasarkan kemampuan</h2>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 font-mono-tech text-[9px] font-bold text-muted-foreground">
              {mastery.length} skill
            </span>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
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
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[9.5px] text-muted-foreground">
                      {m.successes}/{m.attempts} berhasil
                    </span>
                    <Link
                      to={`/quiz/adaptive?skill=${m.skillId}`}
                      className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-primary transition-colors hover:text-primary/80"
                    >
                      Latihan <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="relative overflow-hidden rounded-2xl bg-[#0d1a2f] p-5 text-white shadow-soft">
            <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" aria-hidden />
            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Target className="h-5 w-5 text-amber-300" />
              </span>
              <div className="mt-3 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Rekomendasi
              </div>
              <h3 className="mt-1 font-display text-lg font-extrabold leading-snug">
                {focus ? `Perkuat ${focus.code}` : "Mulai dari pretest"}
              </h3>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">
                {focus
                  ? `Penguasaan saat ini ${Math.round(focus.mastery * 100)}% (${tierLabel(focus.tier)}). Kerjakan kuis adaptif untuk menaikkan level.`
                  : "Kerjakan pretest agar rekomendasi latihan dapat disusun untukmu."}
              </p>
              <Link
                to={focus ? `/quiz/adaptive?skill=${focus.skillId}` : "/quiz/pretest"}
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                {focus ? "Latih skill ini" : "Kerjakan pretest"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Riwayat
                </div>
                <h2 className="mt-0.5 font-display text-base font-extrabold">Kuis terbaru</h2>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </span>
            </div>

            {recent.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-center text-[11.5px] text-muted-foreground">
                Belum ada kuis yang dikerjakan.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {recent.slice(0, 4).map((q) => (
                  <HistoryRow key={q.id} q={q} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ---------------------------------------------------------- shortcuts */}
      <section className="grid gap-3 sm:grid-cols-3">
        <ShortcutCard
          icon={BookOpenText}
          title="Materi pendukung"
          description="Konsep singkat sebelum berlatih."
          href="/materials"
          tone="blue"
        />
        <ShortcutCard
          icon={MonitorCog}
          title="Simulasi kasus"
          description="Latih alur diagnosis pada pohon keputusan."
          href="/cases"
          tone="violet"
        />
        <ShortcutCard
          icon={Laptop}
          title="Perangkatmu"
          description="PC atau laptop — semua misi bisa dimainkan."
          href="/repair"
          tone="emerald"
        />
      </section>
    </div>
  );
}

function ModeCard({
  icon: Icon,
  tone,
  badge,
  badgeTone,
  title,
  description,
  progressLabel,
  progress,
  progressSuffix,
  href,
  cta,
  primary,
}: {
  icon: LucideIcon;
  tone: "blue" | "violet" | "amber" | "emerald";
  badge: string;
  badgeTone: "amber" | "emerald" | "violet" | "slate";
  title: string;
  description: string;
  progressLabel: string;
  progress: number;
  progressSuffix?: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  const iconTone = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  }[tone];
  const badgeCls = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-muted text-muted-foreground",
  }[badgeTone];
  const barTone = {
    blue: "bg-blue-500",
    violet: "bg-violet-500",
    amber: "bg-amber-400",
    emerald: "bg-emerald-500",
  }[tone];

  return (
    <article className="card-hover flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", iconTone)}>
          <Icon className="h-5 w-5" />
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", badgeCls)}>{badge}</span>
      </div>

      <h3 className="mt-3 font-display text-sm font-extrabold leading-snug">{title}</h3>
      <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[9.5px] font-semibold text-muted-foreground">
          <span>{progressLabel}</span>
          <span className="font-mono-tech font-bold">{Math.round(progress)}{progressSuffix ?? "%"}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", barTone)} style={{ width: `${Math.max(2, Math.min(100, progress))}%` }} />
        </div>
      </div>

      <Link
        to={href}
        className={cn(
          "mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors",
          primary
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "border border-border bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

function HistoryRow({ q }: { q: QuizSessionRow }) {
  const label: Record<string, string> = { PRETEST: "Pretest", POSTTEST: "Posttest", ADAPTIVE: "Kuis Adaptif" };
  const pass = q.score !== null && q.score >= 70;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-border/60">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-bold">{label[q.type] ?? q.type}</div>
        <div className="text-[9.5px] text-muted-foreground">
          {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
          {q.completedAt ? ` · ${formatDate(q.completedAt)}` : ""}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold",
          !q.completedAt ? "bg-sky-50 text-sky-700" : pass ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        )}
      >
        {q.completedAt ? (pass ? "Lulus" : "Remedial") : "Berjalan"}
      </span>
    </div>
  );
}

function TerminalRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
      <span className="uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className={cn("font-bold", ok ? "text-emerald-300" : "text-slate-300")}>{value}</span>
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

function ShortcutCard({
  icon: Icon,
  title,
  description,
  href,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  tone: "blue" | "violet" | "emerald";
}) {
  const cls = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  }[tone];
  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", cls)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Akses cepat</span>
        <span className="mt-0.5 block truncate text-xs font-bold">{title}</span>
        <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
