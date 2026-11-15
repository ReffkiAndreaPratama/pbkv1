import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Clock,
  HardDrive,
  Heart,
  History,
  Monitor,
  Power,
  Printer,
  Search,
  Star,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, EmptyState } from "@/components/ui/feedback";
import { cn, difficultyColor, difficultyLabel, formatDate, formatTime } from "@/lib/utils";
import type { Difficulty, RepairAttemptState, RepairHistoryItem, RepairJobListItem } from "@/lib/types";

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

export function RepairIndexPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RepairJobListItem[] | null>(null);
  const [history, setHistory] = useState<RepairHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState<"ALL" | Difficulty>("ALL");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<RepairJobListItem[]>("/api/repair/jobs"),
      api.get<RepairHistoryItem[]>("/api/repair/history").catch(() => [] as RepairHistoryItem[]),
    ])
      .then(([j, h]) => {
        setJobs(j);
        setHistory(h);
      })
      .catch(() => setJobs([]));
  }, []);

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

  if (!jobs) return <CardGridSkeleton groups={3} perGroup={2} />;

  const visible = jobs.filter(
    (j) =>
      (diff === "ALL" || j.difficulty === diff) &&
      (search.trim() === "" ||
        j.title.toLowerCase().includes(search.trim().toLowerCase()) ||
        j.skill.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        j.symptom.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const totalSuccess = jobs.reduce((a, j) => a + j.successCount, 0);
  const best = jobs.reduce((a, j) => Math.max(a, j.bestScore ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bengkel PC — Simulasi Perbaikan"
        subtitle="Bukan ujian pilihan ganda. Kamu memegang obeng: inspeksi komponen, pakai alat ukur, ganti/reseat bagian rusak, lalu nyalakan PC. Nyawa terbatas, combo menambah skor."
      />

      {/* Hero / cara main */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-lift">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <Wrench className="h-6 w-6" />
            </span>
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">
                Mode Praktik Langsung
              </div>
              <h2 className="font-display text-lg font-extrabold">Meja kerja teknisi menantimu</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11px] text-slate-300 sm:grid-cols-4">
            <Step n={1} text="Inspeksi komponen" />
            <Step n={2} text="Tes pakai alat" />
            <Step n={3} text="Perbaiki bagian rusak" />
            <Step n={4} text="Tes nyala PC" />
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-slate-950/40 text-center">
          <Stat label="Misi tersedia" value={String(jobs.length)} />
          <Stat label="Perbaikan sukses" value={String(totalSuccess)} />
          <Stat label="Skor terbaik" value={String(best)} />
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari misi, skill, atau gejala..."
            className="w-full rounded-xl border border-border/70 bg-card px-9 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white"
            aria-label="Cari misi perbaikan"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter kesulitan">
          {DIFF_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDiff(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                diff === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={<Wrench className="h-6 w-6" />} title="Belum ada misi" description="Misi perbaikan akan muncul setelah data bengkel di-seed." />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Tidak ada hasil" description="Tidak ada misi yang cocok dengan pencarian/filter-mu." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((j) => (
            <JobCard key={j.id} job={j} starting={starting === j.id} onStart={() => void start(j.id)} />
          ))}
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-bold">Riwayat Perbaikan</h2>
            </div>
            <span className="text-[11px] text-muted-foreground">{history.length} sesi terakhir</span>
          </div>
          <Card className="divide-y divide-border/60 overflow-hidden">
            {history.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => navigate(`/repair/${h.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                title="Lihat hasil perbaikan"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-sm font-extrabold",
                    h.success ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}
                >
                  {h.grade}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{h.jobTitle}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                    <span>{h.skill.code}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(h.completedAt)}</span>
                    <span aria-hidden>·</span>
                    <span>{formatTime(h.timeSec)}</span>
                    <span aria-hidden>·</span>
                    <span>{h.hearts}/{h.maxHearts} nyawa</span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <Star key={i} className={cn("h-3 w-3", i <= h.stars ? "fill-amber-400 text-amber-400" : "text-muted")} />
                  ))}
                </span>
                <span className="w-10 shrink-0 text-right font-display text-sm font-extrabold">{h.score}</span>
              </button>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function JobCard({ job, starting, onStart }: { job: RepairJobListItem; starting: boolean; onStart: () => void }) {
  const Icon = SKILL_ICON[job.skill.code] ?? Wrench;
  const stars = job.bestScore === null ? 0 : job.bestScore >= 88 ? 3 : job.bestScore >= 72 ? 2 : 1;
  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Icon className="h-5 w-5 text-emerald-300" />
            </span>
            <div>
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{job.skill.code}</div>
              <div className="text-xs text-slate-300">{job.skill.name}</div>
            </div>
          </div>
          <Badge className={cn(difficultyColor(job.difficulty), "shrink-0")}>{difficultyLabel(job.difficulty)}</Badge>
        </div>
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-sm font-bold leading-snug">{job.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{job.symptom}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold">
            <Clock className="h-3 w-3" /> {formatTime(job.timeLimitSec)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold">
            <Heart className="h-3 w-3" /> {job.maxHearts} nyawa
          </span>
          {job.attempts > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
              <Activity className="h-3 w-3" /> {job.successCount}/{job.attempts} sukses
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Skor terbaik</div>
            <div className="flex items-center gap-1">
              <span className="font-display text-lg font-extrabold">{job.bestScore ?? "—"}</span>
              <span className="flex">
                {[1, 2, 3].map((i) => (
                  <Star key={i} className={cn("h-3 w-3", i <= stars ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
              </span>
            </div>
          </div>
          <Button size="sm" onClick={onStart} disabled={starting}>
            {starting ? "Menyiapkan…" : "Mulai Perbaikan"} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono-tech text-[10px] font-bold text-emerald-300">
        {n}
      </span>
      <span>{text}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3">
      <div className="font-display text-xl font-extrabold text-white">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}
