import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, CheckCircle2, Layers, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { CardGridSkeleton, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

type ReadFilter = "ALL" | "READ" | "UNREAD";

const READ_FILTERS: { value: ReadFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "UNREAD", label: "Belum dibaca" },
  { value: "READ", label: "Selesai" },
];

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("ALL");

  useEffect(() => {
    api
      .get<Material[]>("/api/materials")
      .then(setMaterials)
      .catch(() => setMaterials([]));
  }, []);

  const completedCount = useMemo(
    () => (materials ?? []).filter((m) => m.completed).length,
    [materials]
  );

  if (!materials) return <CardGridSkeleton />;

  const total = materials.length;
  const pct = total ? Math.round((completedCount / total) * 100) : 0;
  const jalur = getJalur();
  const q = search.trim().toLowerCase();

  const filtered = materials.filter((m) => {
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.skill.name.toLowerCase().includes(q);
    const matchRead =
      readFilter === "ALL" ? true : readFilter === "READ" ? m.completed : !m.completed;
    return matchSearch && matchRead;
  });

  const grouped = filtered.reduce<Record<string, { name: string; items: Material[] }>>((acc, m) => {
    const key = m.skill.code;
    if (!acc[key]) acc[key] = { name: m.skill.name, items: [] };
    acc[key].items.push(m);
    return acc;
  }, {});

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
              Perpustakaan teknisi · {jalur} track
            </div>

            <h1 className="mt-4 max-w-xl font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Baca dulu,
              <br />
              <span className="text-gradient">bongkar kemudian.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Materi disusun per skill: dari daya, booting, jaringan, sampai periferal. Baca ringkasannya, lalu buktikan
              di bengkel dan kuis.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to="/repair"
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                <Sparkles className="h-4 w-4" /> Praktik di bengkel
              </Link>
              <Link
                to="/practice"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                Latihan kemampuan <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 max-w-lg">
              <div className="flex items-center justify-between font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span>Materi selesai dibaca</span>
                <span className="text-emerald-300">
                  {completedCount}/{total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700"
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* library terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    library.index
                  </span>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {pct}%
                </span>
              </div>

              <div className="mt-4 space-y-2.5 font-mono-tech text-[11px]">
                <TerminalRow label="Total modul" value={`${total}`} width={1} tone="blue" />
                <TerminalRow label="Selesai" value={`${completedCount}`} width={total ? completedCount / total : 0} tone="emerald" />
                <TerminalRow label="Tersisa" value={`${total - completedCount}`} width={total ? (total - completedCount) / total : 0} tone="amber" />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <span className="font-mono-tech text-[10px] text-slate-400">Skill tercakup</span>
                <span className="font-mono-tech text-[10px] font-bold text-slate-200">
                  {new Set(materials.map((m) => m.skill.code)).size} skill
                </span>
              </div>
              <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> baca → tandai selesai otomatis
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- stat strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickStat icon={BookOpenText} label="Total materi" value={`${total}`} hint="siap dibaca" tone="blue" />
        <QuickStat icon={CheckCircle2} label="Selesai" value={`${completedCount}`} hint={`${pct}% dari semua`} tone="emerald" />
        <QuickStat icon={Layers} label="Belum dibaca" value={`${total - completedCount}`} hint="lanjutkan besok" tone="amber" />
        <QuickStat icon={Sparkles} label="Skill" value={`${new Set(materials.map((m) => m.skill.code)).size}`} hint="kategori tercakup" tone="violet" />
      </section>

      {/* ---------------------------------------------------------- filters */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Katalog materi
            </div>
            <h2 className="mt-0.5 font-display text-xl font-extrabold">Pilih modul bacaanmu</h2>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {filtered.length} dari {total} materi
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-soft lg:flex-row lg:items-center">
          <div className="inline-flex w-full shrink-0 rounded-xl bg-muted/70 p-1 lg:w-auto" role="group" aria-label="Filter materi">
            {READ_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setReadFilter(f.value)}
                aria-pressed={readFilter === f.value}
                className={cn(
                  "inline-flex flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all lg:flex-none",
                  readFilter === f.value
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
              placeholder="Cari judul, ringkasan, atau skill…"
              className="h-10 w-full rounded-xl border border-border/70 bg-muted/30 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white"
              aria-label="Cari materi"
            />
          </div>
        </div>

        {total === 0 ? (
          <EmptyState icon={<BookOpenText className="h-6 w-6" />} title="Belum ada materi" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Tidak ada hasil"
            description="Tidak ada materi yang cocok dengan pencarian atau filter-mu."
          />
        ) : (
          <div className="mt-5 space-y-7">
            {Object.entries(grouped).map(([code, g]) => (
              <section key={code}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-900 px-1.5 font-mono-tech text-[8px] font-bold text-emerald-300">
                      {code}
                    </span>
                    <h3 className="font-display text-sm font-extrabold">{g.name}</h3>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono-tech text-[9px] font-bold text-muted-foreground">
                      {g.items.length} modul
                    </span>
                  </div>
                  <span className="font-mono-tech text-[9.5px] text-muted-foreground">{code}</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((m) => (
                    <MaterialCard key={m.id} material={m} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MaterialCard({ material: m }: { material: Material }) {
  return (
    <Link to={`/materials/${m.id}`} className="group h-full">
      <article
        className={cn(
          "card-hover flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft",
          m.completed ? "border-emerald-200/80" : "border-border/70"
        )}
      >
        <div className="relative h-24 overflow-hidden bg-[#0d1a2f]">
          {m.imageUrl ? (
            <>
              <img
                src={m.imageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a2f] via-[#0d1a2f]/40 to-transparent" />
            </>
          ) : (
            <>
              <div className="lab-grid-dark absolute inset-0 opacity-60" aria-hidden />
              <BookOpenText className="pointer-events-none absolute -bottom-3 right-2 h-20 w-20 text-white/[0.07]" aria-hidden />
            </>
          )}

          <div className="relative flex h-full flex-col justify-between p-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">
                <span className="text-emerald-300">{m.skill.code}</span>
                <span className="text-slate-600">/</span>
                <span>MODUL {String(m.order).padStart(2, "0")}</span>
              </span>
              {m.completed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-300">
                  <CheckCircle2 className="h-2.5 w-2.5" /> SELESAI
                </span>
              )}
            </div>
            <span className="inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-semibold text-slate-300">
              {m.skill.name}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-[13px] font-extrabold leading-snug transition-colors group-hover:text-primary">
            {m.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">{m.summary}</p>

          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
            <span className={cn("text-[10px] font-bold", m.completed ? "text-emerald-700" : "text-muted-foreground")}>
              {m.completed ? "Sudah dibaca" : "Belum dibaca"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-primary">
              Baca <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
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
  tone: "blue" | "emerald" | "amber";
}) {
  const bar = {
    blue: "bg-blue-400",
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
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  tone: "blue" | "emerald" | "amber" | "violet";
}) {
  const cls = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
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
