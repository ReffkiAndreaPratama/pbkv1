import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { CardGridSkeleton, EmptyState } from "@/components/ui/feedback";
import { difficultyColor, difficultyLabel, cn, tierColor, tierLabel } from "@/lib/utils";
import { skillImageUrl } from "@/lib/skill-media";
import type { CaseListItem, Difficulty } from "@/lib/types";

const DIFF_FILTERS: { value: "ALL" | Difficulty; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "EASY", label: "Mudah" },
  { value: "MEDIUM", label: "Sedang" },
  { value: "HARD", label: "Sulit" },
];

type Availability = "ALL" | "OPEN" | "LOCKED";

const AVAIL_FILTERS: { value: Availability; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "OPEN", label: "Terbuka" },
  { value: "LOCKED", label: "Terkunci" },
];

export function CasesPage() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState<"ALL" | Difficulty>("ALL");
  const [avail, setAvail] = useState<Availability>("ALL");

  useEffect(() => {
    api
      .get<CaseListItem[]>("/api/cases")
      .then(setCases)
      .catch(() => setCases([]));
  }, []);

  const stats = useMemo(() => {
    const list = cases ?? [];
    return {
      total: list.length,
      open: list.filter((c) => !c.locked).length,
      locked: list.filter((c) => c.locked).length,
      tries: list.reduce((sum, c) => sum + c.tries, 0),
      solved: list.filter((c) => c.tries > 0).length,
    };
  }, [cases]);

  if (!cases) return <CardGridSkeleton groups={3} perGroup={2} />;

  const q = search.trim().toLowerCase();
  const visible = cases.filter(
    (c) =>
      (diff === "ALL" || c.difficulty === diff) &&
      (avail === "ALL" ? true : avail === "OPEN" ? !c.locked : c.locked) &&
      (!q || c.title.toLowerCase().includes(q) || c.skill.name.toLowerCase().includes(q))
  );
  const recommended =
    visible.find((c) => !c.locked && c.tries === 0) ?? visible.find((c) => !c.locked) ?? null;
  const jalur = getJalur();
  const openPct = stats.total ? Math.round((stats.open / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-5">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-slate-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-300" />
              </span>
              Antrean kasus · {jalur} track
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Diagnosis
              <br />
              <span className="text-gradient">di bawah tekanan.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Setiap kasus adalah pohon keputusan: pilih langkah diagnosis yang tepat, hindari tindakan berisiko, dan
              temukan solusi dengan langkah paling efisien.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to={recommended ? `/cases/${recommended.id}` : "#cases"}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Play className="h-4 w-4" /> {recommended ? "Mulai kasus rekomendasi" : "Lihat daftar kasus"}
              </Link>
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-4 w-4" /> Praktik langsung
              </Link>
            </div>

            <div className="mt-7 max-w-lg">
              <div className="flex items-center justify-between font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Kasus terbuka</span>
                <span className="text-emerald-300">
                  {stats.open}/{stats.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700"
                  style={{ width: `${Math.max(2, openPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* queue terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    case.queue
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {stats.open} OPEN
                </span>
              </div>

              <div className="mt-4 space-y-2.5 font-mono-tech text-[11px]">
                <TerminalRow label="Total kasus" value={`${stats.total}`} width={1} tone="blue" />
                <TerminalRow label="Terbuka" value={`${stats.open}`} width={stats.total ? stats.open / stats.total : 0} tone="emerald" />
                <TerminalRow label="Terkunci" value={`${stats.locked}`} width={stats.total ? stats.locked / stats.total : 0} tone="rose" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Percobaan</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-sky-300">{stats.tries}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Pernah benar</div>
                  <div className="mt-0.5 font-display text-base font-extrabold text-emerald-300">{stats.solved}</div>
                </div>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> pilih kasus, lalu diagnosis
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={ShieldAlert} label="Total kasus" value={`${stats.total}`} hint="skenario tersedia" tone="violet" />
        <QuickStat icon={Play} label="Terbuka" value={`${stats.open}`} hint="bisa dimainkan" tone="emerald" />
        <QuickStat icon={Lock} label="Terkunci" value={`${stats.locked}`} hint="naikkan mastery" tone="amber" />
        <QuickStat icon={TrendingUp} label="Percobaan" value={`${stats.tries}`} hint={`${stats.solved} kasus pernah benar`} tone="blue" />
      </section>

      {/* ---------------------------------------------------------- filters + list */}
      <section id="cases" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Daftar kasus
            </div>
            <h2 className="mt-0.5 font-display text-xl font-extrabold">Pilih skenario diagnosis</h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {visible.length} dari {cases.length} kasus
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft lg:flex-row lg:items-center">
          <div className="inline-flex w-full shrink-0 rounded-xl bg-muted/70 p-1 lg:w-auto" role="group" aria-label="Filter ketersediaan">
            {AVAIL_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setAvail(f.value)}
                aria-pressed={avail === f.value}
                className={cn(
                  "inline-flex flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all lg:flex-none",
                  avail === f.value ? "bg-slate-900 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kasus atau skill…"
              className="h-10 w-full rounded-xl border border-border/70 bg-muted/30 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white"
              aria-label="Cari kasus"
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

        {cases.length === 0 ? (
          <EmptyState
            icon={<Play className="h-6 w-6" />}
            title="Belum ada kasus"
            description="Kasus akan tersedia setelah admin menambahkannya."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Tidak ada hasil"
            description="Tidak ada kasus yang cocok dengan pencarian atau filter-mu."
          />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((c) => (
              <CaseCard key={c.id} item={c} recommended={recommended?.id === c.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CaseCard({ item: c, recommended }: { item: CaseListItem; recommended: boolean }) {
  const body = (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all",
        c.locked ? "border-border/70 opacity-75" : "border-border/70 card-hover",
        recommended && "border-emerald-300/80 ring-1 ring-emerald-200/60"
      )}
    >
      {recommended && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-950 shadow">
          <Sparkles className="h-2.5 w-2.5" /> Rekomendasi
        </span>
      )}

      <div className="relative h-28 overflow-hidden bg-[#0d1a2f]">
        <img
          src={skillImageUrl(c.skill.code)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-60 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a2f] via-[#0d1a2f]/50 to-transparent" />
        <div className="lab-grid-dark absolute inset-0 opacity-40" aria-hidden />

        <div className="relative flex h-full flex-col justify-between p-3.5">
          <div className="flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">
            <span className="text-violet-300">{c.skill.code}</span>
            <span className="text-slate-600">/</span>
            <span>{c.targetSteps} LANGKAH</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-semibold text-slate-300">
              {c.skill.name}
            </span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", difficultyColor(c.difficulty))}>
              {difficultyLabel(c.difficulty)}
            </span>
          </div>
        </div>

        {c.locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow">
              <Lock className="h-4 w-4" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[13px] font-extrabold leading-snug">{c.title}</h3>
          <span className={cn("mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[8.5px] font-bold", tierColor(c.tier))}>
            {tierLabel(c.tier)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono-tech text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Urgensi
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                c.urgency >= 70 ? "bg-rose-400" : c.urgency >= 40 ? "bg-amber-400" : "bg-emerald-400"
              )}
              style={{ width: `${Math.min(100, Math.max(3, c.urgency))}%` }}
            />
          </div>
          <span className="font-mono-tech text-[9px] font-bold text-muted-foreground">{c.urgency}%</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9.5px] font-semibold text-muted-foreground">
          {c.tries > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-1 text-emerald-700">
              <CheckCircle2 className="h-2.5 w-2.5" /> {c.tries}× pernah benar
            </span>
          )}
          {c.tries === 0 && !c.locked && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-1">
              <Play className="h-2.5 w-2.5" /> belum dicoba
            </span>
          )}
          {c.locked && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-amber-700">
              <Lock className="h-2.5 w-2.5" /> naikkan mastery
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {c.locked ? "Terkunci" : "Siap dimainkan"}
          </span>
          <span
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-xl px-3 text-[11px] font-bold",
              c.locked
                ? "bg-muted text-muted-foreground"
                : "bg-slate-900 text-white transition-colors group-hover:bg-slate-800"
            )}
          >
            {c.locked ? (
              <>
                <Lock className="h-3 w-3" /> Terkunci
              </>
            ) : (
              <>
                Mulai <ArrowRight className="h-3 w-3" />
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );

  if (c.locked) return <div className="h-full cursor-not-allowed">{body}</div>;
  return (
    <Link to={`/cases/${c.id}`} className="h-full">
      {body}
    </Link>
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
  tone: "blue" | "emerald" | "rose";
}) {
  const bar = {
    blue: "bg-blue-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
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
  tone: "violet" | "emerald" | "amber" | "blue";
}) {
  const cls = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
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
