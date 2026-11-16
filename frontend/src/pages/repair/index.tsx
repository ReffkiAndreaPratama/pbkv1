import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  HardDrive,
  Heart,
  HelpCircle,
  History,
  Laptop,
  Monitor,
  MonitorCog,
  Power,
  Printer,
  Search,
  Sparkles,
  Star,
  Trophy,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, EmptyState } from "@/components/ui/feedback";
import { MissionBriefing } from "@/components/repair/mission-briefing";
import { RepairTutorial, hasSeenRepairTutorial, markRepairTutorialSeen } from "@/components/repair/repair-tutorial";
import { cn, difficultyColor, difficultyLabel, formatDate, formatTime, tierColor, tierLabel } from "@/lib/utils";
import type {
  Difficulty,
  RepairAttemptState,
  RepairDeviceType,
  RepairHistoryItem,
  RepairJobListItem,
  SummaryData,
} from "@/lib/types";

const SKILL_ICON: Record<string, LucideIcon> = {
  POWER: Zap,
  BOOT: Power,
  NETWORK: Wifi,
  STORAGE: HardDrive,
  DISPLAY: Monitor,
  PERIPHERAL: Printer,
};

const DIFF_FILTERS: { value: "ALL" | Difficulty; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "EASY", label: "Mudah" },
  { value: "MEDIUM", label: "Sedang" },
  { value: "HARD", label: "Sulit" },
];

const DEVICE_FILTERS: { value: "ALL" | RepairDeviceType; label: string; icon: LucideIcon }[] = [
  { value: "ALL", label: "Semua", icon: Wrench },
  { value: "PC", label: "PC", icon: MonitorCog },
  { value: "LAPTOP", label: "Laptop", icon: Laptop },
];

function deviceLabel(deviceType: RepairDeviceType): string {
  return deviceType === "LAPTOP" ? "Laptop" : "PC";
}

export function RepairIndexPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RepairJobListItem[] | null>(null);
  const [history, setHistory] = useState<RepairHistoryItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState<"ALL" | Difficulty>("ALL");
  const [device, setDevice] = useState<"ALL" | RepairDeviceType>("ALL");
  const [starting, setStarting] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [briefingJob, setBriefingJob] = useState<RepairJobListItem | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<RepairJobListItem[]>("/api/repair/jobs"),
      api.get<RepairHistoryItem[]>("/api/repair/history").catch(() => [] as RepairHistoryItem[]),
      api.get<SummaryData>("/api/progress/summary").catch(() => null),
    ])
      .then(([j, h, s]) => {
        setJobs(j);
        setHistory(h);
        setSummary(s);
      })
      .catch(() => setJobs([]));
  }, []);

  // Tutorial pertama kali: buka setelah papan misi siap, jangan di tengah attempt.
  useEffect(() => {
    if (jobs && jobs.length > 0 && !hasSeenRepairTutorial()) setTutorialOpen(true);
  }, [jobs]);

  const closeTutorial = () => {
    markRepairTutorialSeen();
    setTutorialOpen(false);
  };

  const start = async (jobId: string) => {
    if (starting) return;
    setStarting(jobId);
    try {
      const res = await api.post<{ state: RepairAttemptState }>(`/api/repair/jobs/${jobId}/start`);
      navigate(`/repair/${res.state.id}`);
    } catch (e: any) {
      toast.error(e.message || "Gagal memulai misi perbaikan.");
    } finally {
      setStarting(null);
    }
  };

  const visible = useMemo(() => {
    if (!jobs) return [];
    const q = search.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (device === "ALL" || j.deviceType === device) &&
        (diff === "ALL" || j.difficulty === diff) &&
        (q === "" ||
          j.title.toLowerCase().includes(q) ||
          j.skill.name.toLowerCase().includes(q) ||
          j.symptom.toLowerCase().includes(q) ||
          deviceLabel(j.deviceType).toLowerCase().includes(q))
    );
  }, [jobs, device, diff, search]);

  if (!jobs) return <CardGridSkeleton groups={3} perGroup={2} />;

  const totalSuccess = jobs.reduce((a, j) => a + j.successCount, 0);
  const best = jobs.reduce((a, j) => Math.max(a, j.bestScore ?? 0), 0);
  const pcCount = jobs.filter((j) => j.deviceType === "PC").length;
  const laptopCount = jobs.filter((j) => j.deviceType === "LAPTOP").length;
  const recommended =
    jobs.find((j) => j.attempts === 0) ??
    [...jobs].sort((a, b) => (a.bestScore ?? 101) - (b.bestScore ?? 101))[0] ??
    null;
  const avgMastery = summary ? Math.round((summary.avgMastery || 0) * 100) : null;
  const completed = jobs.filter((j) => j.successCount > 0).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-8 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 font-mono-tech text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              Mode praktik langsung · {jobs.length} misi
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.6rem]">
              Bukan pilihan ganda.
              <br />
              <span className="text-gradient">Kamu yang pegang obengnya.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              Pilih komponen di gambar PC atau laptop, inspeksi, ukur dengan alat diagnostik, perbaiki bagian yang
              rusak, lalu nyalakan perangkat. Nyawa terbatas — combo menambah skor.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() => (recommended ? setBriefingJob(recommended) : document.getElementById("missions")?.scrollIntoView())}
                className="bg-emerald-500 text-slate-950 shadow-none hover:bg-emerald-400"
              >
                <Sparkles className="h-4 w-4" /> Mulai misi rekomendasi
              </Button>
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <HelpCircle className="h-4 w-4" /> Cara main
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("missions")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
              >
                Lihat semua misi <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-7 grid max-w-lg grid-cols-2 gap-x-5 gap-y-2.5 text-[11px] text-slate-300 sm:grid-cols-4">
              {["Pilih komponen", "Inspeksi & ukur", "Perbaiki", "Tes nyala"].map((text, i) => (
                <div key={text} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 font-mono-tech text-[9px] font-bold text-emerald-300">
                    {i + 1}
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* terminal status */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    workbench.status
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  ONLINE
                </span>
              </div>

              <div className="mt-3 space-y-2.5 font-mono-tech text-[11px]">
                <TerminalRow label="Misi PC" value={`${pcCount}`} width={pcCount / Math.max(1, jobs.length)} tone="blue" />
                <TerminalRow
                  label="Misi laptop"
                  value={`${laptopCount}`}
                  width={laptopCount / Math.max(1, jobs.length)}
                  tone="teal"
                />
                <TerminalRow
                  label="Perbaikan sukses"
                  value={`${totalSuccess}`}
                  width={Math.min(1, totalSuccess / Math.max(1, jobs.length))}
                  tone="emerald"
                />
                <TerminalRow label="Skor terbaik" value={`${best}`} width={best / 100} tone="amber" />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <span className="font-mono-tech text-[10px] text-slate-400">
                  {completed}/{jobs.length} misi pernah dituntaskan
                </span>
                <span className="font-mono-tech text-[10px] font-bold text-emerald-300">
                  {avgMastery === null ? "—" : `${avgMastery}%`}
                </span>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> siap menerima perintah
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={Wrench} label="Misi tersedia" value={`${jobs.length}`} hint={`${pcCount} PC · ${laptopCount} laptop`} tone="blue" />
        <QuickStat icon={CheckCircle2} label="Perbaikan sukses" value={`${totalSuccess}`} hint={`${completed} misi tuntas`} tone="emerald" />
        <QuickStat icon={Trophy} label="Skor terbaik" value={best ? `${best}` : "—"} hint="dari 100" tone="amber" />
        <QuickStat
          icon={Activity}
          label="Mastery rata-rata"
          value={avgMastery === null ? "—" : `${avgMastery}%`}
          hint={summary ? `${summary.repairAttempts} percobaan` : "belum ada data"}
          tone="violet"
        />
      </section>

      {/* ---------------------------------------------------------- skill focus */}
      {summary && summary.masteryBySkill.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Fokus keterampilan
              </div>
              <h2 className="mt-0.5 font-display text-base font-extrabold">Skill yang dilatih di bengkel</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate("/progress")}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              Lihat progres <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.masteryBySkill.map((m) => {
              const Icon = SKILL_ICON[m.code] ?? Wrench;
              const pct = Math.round(m.mastery * 100);
              return (
                <div key={m.code} className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{m.name}</span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", tierColor(m.tier))}>
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
      )}

      {/* ---------------------------------------------------------- filters */}
      <section id="missions" className="scroll-mt-24">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Papan misi
              </div>
              <h2 className="mt-0.5 font-display text-xl font-extrabold">Pilih perangkat yang mau kamu bongkar</h2>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {visible.length} dari {jobs.length} misi
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft lg:flex-row lg:items-center">
            <div className="inline-flex w-full shrink-0 rounded-xl bg-muted/70 p-1 lg:w-auto" role="group" aria-label="Filter perangkat">
              {DEVICE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setDevice(f.value)}
                  aria-pressed={device === f.value}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all lg:flex-none",
                    device === f.value
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <f.icon className="h-3.5 w-3.5" /> {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari misi, skill, atau gejala…"
                className="h-10 w-full rounded-xl border border-border/70 bg-muted/30 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white"
                aria-label="Cari misi perbaikan"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter kesulitan">
              {DIFF_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setDiff(f.value)}
                  aria-pressed={diff === f.value}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors",
                    diff === f.value
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-6 w-6" />}
            title="Belum ada misi"
            description="Misi perbaikan akan muncul setelah data bengkel di-seed."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Tidak ada hasil"
            description="Tidak ada misi yang cocok dengan pencarian/filter-mu."
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((j) => (
              <JobCard
                key={j.id}
                job={j}
                recommended={recommended?.id === j.id}
                starting={starting === j.id}
                onOpen={() => setBriefingJob(j)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------------- history */}
      {history.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-sm font-extrabold">Riwayat Perbaikan</h2>
                <p className="text-[10.5px] text-muted-foreground">{history.length} sesi terakhir</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            {history.map((h, i) => (
              <button
                key={h.id}
                type="button"
                onClick={() => navigate(`/repair/${h.id}`)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  i > 0 && "border-t border-border/60"
                )}
                title="Lihat hasil perbaikan"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-extrabold ring-1",
                    h.success
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-rose-50 text-rose-700 ring-rose-200"
                  )}
                >
                  {h.grade}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{h.jobTitle}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                      {h.deviceType === "LAPTOP" ? <Laptop className="h-3 w-3" /> : <MonitorCog className="h-3 w-3" />}
                      {deviceLabel(h.deviceType)}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="font-mono-tech">{h.skill.code}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(h.completedAt)}</span>
                    <span aria-hidden>·</span>
                    <span>{formatTime(h.timeSec)}</span>
                    <span aria-hidden>·</span>
                    <span>{h.hearts}/{h.maxHearts} nyawa</span>
                  </span>
                </span>
                <span className="hidden shrink-0 items-center gap-0.5 sm:flex">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={cn("h-3 w-3", s <= h.stars ? "fill-amber-400 text-amber-400" : "text-slate-300")}
                    />
                  ))}
                </span>
                <span className="w-9 shrink-0 text-right font-display text-sm font-extrabold">{h.score}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <RepairTutorial open={tutorialOpen} onClose={closeTutorial} />
      <MissionBriefing
        job={briefingJob}
        starting={!!briefingJob && starting === briefingJob.id}
        onClose={() => setBriefingJob(null)}
        onStart={() => briefingJob && void start(briefingJob.id)}
      />
    </div>
  );
}

function TerminalRow({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: number;
  tone: "blue" | "teal" | "emerald" | "amber";
}) {
  const bar = {
    blue: "bg-blue-400",
    teal: "bg-teal-300",
    emerald: "bg-emerald-400",
    amber: "bg-amber-300",
  }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-slate-400">
        <span>{label}</span>
        <span className="font-bold text-slate-200">{value}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.max(2, Math.min(100, width * 100))}%` }} />
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
  tone: "blue" | "emerald" | "amber" | "violet";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[10.5px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function JobCard({
  job,
  recommended,
  starting,
  onOpen,
}: {
  job: RepairJobListItem;
  recommended: boolean;
  starting: boolean;
  onOpen: () => void;
}) {
  const Icon = SKILL_ICON[job.skill.code] ?? Wrench;
  const isLaptop = job.deviceType === "LAPTOP";
  const stars = job.bestScore === null ? 0 : job.bestScore >= 88 ? 3 : job.bestScore >= 72 ? 2 : 1;
  const done = job.successCount > 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft card-hover",
        recommended ? "border-emerald-300/80 ring-1 ring-emerald-200/60" : "border-border/70"
      )}
    >
      {recommended && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-950 shadow">
          <Sparkles className="h-2.5 w-2.5" /> Rekomendasi
        </span>
      )}

      <div className="relative h-28 overflow-hidden bg-[#0d1a2f]">
        <div className="lab-grid-dark absolute inset-0 opacity-60" aria-hidden />
        <div
          className={cn(
            "pointer-events-none absolute -right-4 -top-8 h-36 w-36 rounded-full blur-2xl",
            isLaptop ? "bg-sky-400/20" : "bg-emerald-400/20"
          )}
          aria-hidden
        />
        <Icon className="pointer-events-none absolute -bottom-4 right-2 h-24 w-24 text-white/[0.07]" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-4">
          <div className="flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span className="text-emerald-300">{job.skill.code}</span>
            <span className="text-slate-600">/</span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              {isLaptop ? <Laptop className="h-3 w-3" /> : <MonitorCog className="h-3 w-3" />}
              {deviceLabel(job.deviceType)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300">
              <Icon className="h-3 w-3 text-emerald-300" /> {job.skill.name}
            </span>
            <Badge className={cn(difficultyColor(job.difficulty), "border-0 text-[10px]")}>
              {difficultyLabel(job.difficulty)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-extrabold leading-snug">{job.title}</h3>
          {done && (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> tuntas
            </span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">{job.symptom}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-1">
            <Clock className="h-3 w-3" /> {formatTime(job.timeLimitSec)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-1">
            <Heart className="h-3 w-3" /> {job.maxHearts} nyawa
          </span>
          {job.attempts > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-emerald-700">
              <Activity className="h-3 w-3" /> {job.successCount}/{job.attempts}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Skor terbaik</div>
            <div className="flex items-center gap-1">
              <span className="font-display text-lg font-extrabold">{job.bestScore ?? "—"}</span>
              <span className="flex">
                {[1, 2, 3].map((i) => (
                  <Star key={i} className={cn("h-3 w-3", i <= stars ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                ))}
              </span>
            </div>
          </div>
          <Button size="sm" onClick={onOpen} disabled={starting} className="shadow-none">
            {starting ? "Menyiapkan…" : "Buka Misi"} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
