import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/ui/feedback";
import { cn, difficultyColor, difficultyLabel } from "@/lib/utils";
import { embedVideoUrl } from "@/lib/media";
import type { Material } from "@/lib/types";

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h2", text: line.slice(3) });
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "h3", text: line.slice(4) });
      continue;
    }
    if (line.startsWith("- ")) {
      if (!list || list.kind !== "ul") {
        flush();
        list = { kind: "ul", items: [] };
      }
      list.items.push(line.slice(2));
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (!list || list.kind !== "ol") {
        flush();
        list = { kind: "ol", items: [] };
      }
      list.items.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }
    flush();
    if (line.startsWith("> ")) {
      blocks.push({ kind: "quote", text: line.slice(2) });
    } else {
      blocks.push({ kind: "p", text: line });
    }
  }
  flush();
  return blocks;
}

/** Renders **bold** and `code` inline spans without pulling in a markdown dep. */
function inline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono-tech text-[0.88em] font-semibold text-slate-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
}

function ArticleBody({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="space-y-3 text-[14.5px] leading-relaxed text-slate-700">
      {blocks.map((block, i) => {
        if (block.kind === "h2") {
          return (
            <h2
              key={i}
              className="mt-8 flex items-start gap-2.5 border-t border-slate-100 pt-6 font-display text-[19px] font-extrabold leading-snug tracking-tight text-slate-900 first:mt-0 first:border-0 first:pt-0"
            >
              <span className="mt-1.5 h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" aria-hidden />
              <span>{block.text}</span>
            </h2>
          );
        }
        if (block.kind === "h3") {
          return (
            <h3 key={i} className="mt-5 font-display text-[15.5px] font-extrabold text-slate-900">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "quote") {
          return (
            <blockquote
              key={i}
              className="my-4 flex gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-[13.5px] leading-relaxed text-amber-950"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>{inline(block.text)}</span>
            </blockquote>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={i} className="my-3 space-y-2">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  <span>{inline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={i} className="my-3 space-y-2.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-900 font-mono-tech text-[10px] font-bold text-emerald-300">
                    {j + 1}
                  </span>
                  <span>{inline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i} className="text-slate-700">
            {inline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

export function MaterialDetailPage() {
  const { id } = useParams();
  const [material, setMaterial] = useState<Material | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [prev, setPrev] = useState<Material | null>(null);
  const [next, setNext] = useState<Material | null>(null);
  const [progress, setProgress] = useState<{ read: number; total: number } | null>(null);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    if (!id) return;
    setMaterial(null);
    setNotFound(false);
    api
      .get<Material>(`/api/materials/${id}`)
      .then((m) => {
        setMaterial(m);
        setReadAt(m.readAt ?? null);
        setProgress(m.skillProgress ?? null);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api
      .get<Material[]>("/api/materials")
      .then((all) => {
        const ordered = [...all].sort(
          (a, b) => a.skill.code.localeCompare(b.skill.code) || a.order - b.order
        );
        const idx = ordered.findIndex((m) => m.id === id);
        if (idx > -1) {
          setPrev(idx > 0 ? ordered[idx - 1] : null);
          setNext(idx < ordered.length - 1 ? ordered[idx + 1] : null);
        }
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setScrollPct(0);
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setScrollPct(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [material]);

  const markRead = async () => {
    if (!id) return;
    try {
      await api.post(`/api/materials/${id}/read`);
      if (!readAt) {
        setProgress((p) => (p ? { ...p, read: Math.min(p.total, p.read + 1) } : p));
      }
      setReadAt(new Date().toISOString());
      toast.success("Materi selesai dibaca! Konsepmu naik. 🚀");
    } catch {
      toast.error("Gagal menandai materi.");
    }
  };

  if (notFound) {
    return (
      <div className="animate-fade-in rounded-2xl border border-border/70 bg-card p-10 text-center shadow-soft">
        <BookOpenText className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-lg font-extrabold">Materi tidak ditemukan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Materi mungkin sudah dipindahkan atau dihapus.</p>
        <Link
          to="/materials"
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar materi
        </Link>
      </div>
    );
  }

  if (!material) return <PageLoader />;

  const words = material.content.trim().split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(words / 200));
  const embed = embedVideoUrl(material.videoUrl);
  const links = material.links ?? [];
  const relatedCases = material.relatedCases ?? [];
  const isRead = Boolean(readAt);

  return (
    <div className="animate-fade-in space-y-5">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <Link
            to="/materials"
            className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Perpustakaan materi
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                  {material.skill.code}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                  {material.skill.name}
                </span>
                <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Modul {String(material.order).padStart(2, "0")}
                </span>
                {isRead && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-2.5 w-2.5" /> SELESAI
                  </span>
                )}
              </div>

              <h1 className="mt-4 max-w-2xl font-display text-2xl font-extrabold leading-[1.15] tracking-tight sm:text-3xl">
                {material.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{material.summary}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-sky-300" /> {readMinutes} menit baca
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpenText className="h-3.5 w-3.5 text-emerald-300" /> {words} kata
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-300" /> +15 XP
                </span>
              </div>
            </div>

            {material.imageUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-lg">
                <img
                  src={material.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-44 w-full object-cover opacity-90 lg:h-52"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-300 ring-1 ring-white/15">
                    <BookOpenText className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    Reading module
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 lg:block">
                <BookOpenText className="pointer-events-none absolute -bottom-6 -right-4 h-32 w-32 text-white/[0.05]" aria-hidden />
                <div className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  module.read
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2">
                    <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">Status</span>
                    <span className={cn("font-mono-tech text-[10px] font-bold", isRead ? "text-emerald-300" : "text-amber-300")}>
                      {isRead ? "SELESAI" : "BELUM DIBACA"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 px-3 py-2">
                    <span className="font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">Estimasi</span>
                    <span className="font-mono-tech text-[10px] font-bold text-sky-300">{readMinutes} menit</span>
                  </div>
                </div>
                <div className="mt-3 font-mono-tech text-[10px] text-slate-500">
                  <span className="text-emerald-300">$</span> baca → tandai selesai
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
                </div>
              </div>
            )}
          </div>

          {/* reading progress */}
          <div className="mt-7">
            <div className="flex items-center justify-between font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <span>Progres baca halaman</span>
              <span className="text-emerald-300">{scrollPct}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-200"
                style={{ width: `${Math.max(2, scrollPct)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ---------------------------------------------------------- main column */}
        <div className="space-y-4">
          {embed && (
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  <Play className="h-3.5 w-3.5 text-primary" /> Video pendukung
                </span>
                {material.videoUrl && (
                  <a
                    href={material.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline"
                  >
                    YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="aspect-video w-full bg-slate-950">
                <iframe
                  src={embed}
                  title={`Video: ${material.title}`}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <BookOpenText className="h-3.5 w-3.5" /> Materi inti
              </span>
              <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {material.skill.code} / {String(material.order).padStart(2, "0")}
              </span>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <ArticleBody content={material.content} />

              <div className="mt-9 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:p-5">
                {isRead ? (
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-bold">Materi ini sudah kamu baca</div>
                        <div className="text-[11px] text-muted-foreground">Lanjut ke praktik atau modul berikutnya.</div>
                      </div>
                    </div>
                    <Link
                      to="/repair"
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                    >
                      <Wrench className="h-3.5 w-3.5" /> Praktik di bengkel
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-sm font-bold">Sudah selesai membaca?</div>
                        <div className="text-[11px] text-muted-foreground">
                          Tandai selesai untuk menyimpan progres dan mengklaim XP.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void markRead()}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tandai selesai · +15 XP
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>

          {links.length > 0 && (
            <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" /> Referensi tambahan
              </div>
              <ul className="mt-3 space-y-2">
                {links.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-border/60">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-700 group-hover:text-primary">
                        {l.title || l.url}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(prev || next) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  to={`/materials/${prev.id}`}
                  className="group flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
                >
                  <span className="inline-flex items-center gap-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <ArrowLeft className="h-3 w-3" /> Sebelumnya
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12.5px] font-bold leading-snug group-hover:text-primary">
                    {prev.title}
                  </span>
                  <span className="mt-2 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {prev.skill.code} · Modul {String(prev.order).padStart(2, "0")}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link
                  to={`/materials/${next.id}`}
                  className="group flex flex-col rounded-2xl border border-border/70 bg-card p-4 text-right shadow-soft transition-colors hover:border-primary/40 sm:col-start-2"
                >
                  <span className="inline-flex items-center justify-end gap-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Berikutnya <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12.5px] font-bold leading-snug group-hover:text-primary">
                    {next.title}
                  </span>
                  <span className="mt-2 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {next.skill.code} · Modul {String(next.order).padStart(2, "0")}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------- aside */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Status baca
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold",
                  isRead ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}
              >
                {isRead ? "Selesai" : "Berjalan"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke={isRead ? "#10b981" : "#f59e0b"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - scrollPct / 100)}
                    className="transition-all duration-200"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-sm font-extrabold leading-none">{scrollPct}%</span>
                  <span className="font-mono-tech text-[7px] uppercase tracking-[0.12em] text-muted-foreground">baca</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <MetaRow label="Estimasi" value={`${readMinutes} menit`} />
                <MetaRow label="Panjang" value={`${words} kata`} />
                <MetaRow label="Reward" value="+15 XP" />
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-200",
                  isRead ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-orange-400"
                )}
                style={{ width: `${Math.max(2, scrollPct)}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              {isRead
                ? "Materi sudah tercatat. Lanjutkan ke modul berikutnya."
                : "Gulir sampai habis, lalu tandai selesai untuk mengklaim XP."}
            </p>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-[#0d1a2f] p-4 text-white shadow-soft">
            <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" aria-hidden />
            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Wrench className="h-4 w-4 text-emerald-300" />
              </span>
              <div className="mt-2.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Langkah berikutnya
              </div>
              <h2 className="mt-1 font-display text-sm font-extrabold leading-snug">Buktikan di bengkel</h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                Teori lebih cepat menempel kalau langsung dipraktikkan pada perangkat.
              </p>
              <Link
                to="/repair"
                className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 text-[11px] font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Masuk bengkel <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </section>

          {relatedCases.length > 0 && (
            <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Kasus terkait
                </div>
                <Link
                  to={`/cases?skill=${material.skill.code}`}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Semua
                </Link>
              </div>
              <ul className="mt-2.5 space-y-1.5">
                {relatedCases.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/cases/${c.id}`}
                      className="group flex items-start gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted/50"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-900 font-mono-tech text-[8px] font-bold text-emerald-300">
                        {c.targetSteps}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block line-clamp-2 text-[11px] font-semibold leading-snug group-hover:text-primary">
                          {c.title}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                            difficultyColor(c.difficulty)
                          )}
                        >
                          {difficultyLabel(c.difficulty)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Baca teorinya, lalu uji pemahaman di simulasi kasus.
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Modul ini
            </div>
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                <span className="text-[10.5px] font-semibold text-muted-foreground">Skill</span>
                <span className="font-mono-tech text-[10px] font-bold text-slate-700">{material.skill.code}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                <span className="text-[10.5px] font-semibold text-muted-foreground">Urutan</span>
                <span className="font-mono-tech text-[10px] font-bold text-slate-700">
                  {String(material.order).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                <span className="text-[10.5px] font-semibold text-muted-foreground">Kategori</span>
                <span className="max-w-[140px] truncate text-[10.5px] font-bold text-slate-700">
                  {material.skill.name}
                </span>
              </div>
            </div>
            {progress && progress.total > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[9.5px] font-semibold text-muted-foreground">
                  <span>Progres skill {material.skill.code}</span>
                  <span className="font-mono-tech font-bold text-slate-700">
                    {progress.read}/{progress.total}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.max(2, Math.round((progress.read / progress.total) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Link
              to="/materials"
              className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline"
            >
              Semua materi <ArrowRight className="h-3 w-3" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono-tech font-bold text-slate-700">{value}</span>
    </div>
  );
}
