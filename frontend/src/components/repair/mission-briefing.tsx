import { useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Gauge,
  Heart,
  Laptop,
  MonitorCog,
  Power,
  Search,
  ShieldQuestion,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, difficultyColor, difficultyLabel, formatTime } from "@/lib/utils";
import type { RepairJobListItem } from "@/lib/types";

interface MissionBriefingProps {
  job: RepairJobListItem | null;
  starting: boolean;
  onClose: () => void;
  onStart: () => void;
}

/**
 * Briefing singkat sebelum misi dimulai. Tujuannya memberi konteks
 * (gejala, batas waktu, nyawa, rekor) tanpa membocorkan komponen rusak.
 */
export function MissionBriefing({ job, starting, onClose, onStart }: MissionBriefingProps) {
  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !starting) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [job, starting, onClose]);

  if (!job) return null;

  const isLaptop = job.deviceType === "LAPTOP";
  const bestStars = job.bestScore === null ? 0 : job.bestScore >= 88 ? 3 : job.bestScore >= 72 ? 2 : 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !starting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-briefing-title"
        className="animate-fade-in-up max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-card shadow-lift outline-none sm:rounded-3xl"
      >
        {/* header */}
        <div className="relative overflow-hidden bg-[#0b1628] px-5 pb-5 pt-4 text-white">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-mono-tech text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">
              <Wrench className="h-3.5 w-3.5" aria-hidden /> Briefing Misi
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={starting}
              aria-label="Tutup briefing"
              className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-4 flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              {isLaptop ? <Laptop className="h-6 w-6 text-sky-300" /> : <MonitorCog className="h-6 w-6 text-emerald-300" />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {job.skill.code}
                </span>
                <Badge className={cn(difficultyColor(job.difficulty), "border-0 text-[10px]")}>
                  {difficultyLabel(job.difficulty)}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-[10px] text-slate-200">
                  {isLaptop ? "Laptop" : "PC"}
                </Badge>
              </div>
              <h2 id="mission-briefing-title" className="mt-1 font-display text-xl font-extrabold leading-snug">
                {job.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <div className="flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldQuestion className="h-3.5 w-3.5" aria-hidden /> Gejala yang dilaporkan
            </div>
            <p className="mt-1.5 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/85">
              {job.symptom}
            </p>
          </div>

          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Alur kerjamu
            </div>
            <ol className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                { icon: Search, title: "Inspeksi", body: "Cek kondisi tiap komponen." },
                { icon: Gauge, title: "Ukur", body: "Pakai multimeter / POST / software." },
                { icon: Power, title: "Perbaiki & tes", body: "Tindakan tepat, lalu Tes Nyala." },
              ].map((s, i) => (
                <li key={s.title} className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 font-mono-tech text-[9px] text-primary">
                      {i + 1}
                    </span>
                    <s.icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {s.title}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-foreground/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat icon={Clock} label="Batas waktu" value={formatTime(job.timeLimitSec)} tone="sky" />
            <Stat icon={Heart} label="Nyawa" value={`${job.maxHearts}`} tone="rose" />
            <Stat icon={Gauge} label="Percobaan" value={`${job.attempts}`} tone="slate" />
            <Stat
              icon={Star}
              label="Rekor"
              value={job.bestScore === null ? "—" : `${job.bestScore}`}
              tone="amber"
              hint={bestStars > 0 ? "★".repeat(bestStars) : undefined}
            />
          </div>

          <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
            <strong className="font-bold">Tanpa bocoran:</strong> komponen rusak tidak ditandai. Temukan lewat inspeksi
            dan pengukuran — tindakan perbaikan yang salah mengurangi 1 nyawa.
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={starting}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Nanti dulu
          </button>
          <Button onClick={onStart} disabled={starting} className="min-w-[150px]">
            {starting ? "Menyiapkan meja…" : "Mulai Perbaikan"}
            {!starting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone: "sky" | "rose" | "slate" | "amber";
  hint?: string;
}) {
  const toneClass = {
    sky: "bg-sky-50 text-sky-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5">
      <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", toneClass)}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="mt-1.5 font-display text-sm font-extrabold leading-none">{value}</div>
      <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[10px] font-bold text-amber-500">{hint}</div>}
    </div>
  );
}
