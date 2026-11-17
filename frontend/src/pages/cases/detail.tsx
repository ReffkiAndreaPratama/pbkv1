import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Lightbulb,
  ListOrdered,
  MonitorCog,
  Play,
  Route,
  ShieldAlert,
  Sparkles,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/ui/feedback";
import { difficultyColor, difficultyLabel, cn } from "@/lib/utils";
import { skillImageUrl } from "@/lib/skill-media";
import type { CaseDetail, CaseListItem, Difficulty } from "@/lib/types";

export function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [starting, setStarting] = useState(false);
  const [prev, setPrev] = useState<CaseListItem | null>(null);
  const [next, setNext] = useState<CaseListItem | null>(null);

  useEffect(() => {
    if (id) api.get<CaseDetail>(`/api/cases/${id}`).then(setCaseDetail).catch(() => setCaseDetail(null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const level: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
    api
      .get<CaseListItem[]>("/api/cases")
      .then((all) => {
        const ordered = [...all].sort(
          (a, b) =>
            a.skill.code.localeCompare(b.skill.code) ||
            level[a.difficulty] - level[b.difficulty] ||
            a.title.localeCompare(b.title)
        );
        const idx = ordered.findIndex((c) => c.id === id);
        if (idx > -1) {
          setPrev(idx > 0 ? ordered[idx - 1] : null);
          setNext(idx < ordered.length - 1 ? ordered[idx + 1] : null);
        }
      })
      .catch(() => {});
  }, [id]);

  const start = async () => {
    if (!id) return;
    setStarting(true);
    try {
      const res = await api.post<{ attemptId: string }>(`/api/cases/${id}/start`);
      navigate(`/simulation/${res.attemptId}`);
    } catch {
      setStarting(false);
    }
  };

  if (!caseDetail) return <PageLoader />;

  const bestPath = caseDetail.nodes.filter((n) => n.isOnBestPath);
  const active = user?.profile?.pretestDone;
  const minutes = Math.max(1, Math.round(caseDetail.expectedTimeSec / 60));

  return (
    <div className="animate-fade-in space-y-5">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <Link
            to="/cases"
            className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Antrean kasus
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-300/10 px-2.5 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-violet-200">
                  {caseDetail.skill.code}
                </span>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", difficultyColor(caseDetail.difficulty))}>
                  {difficultyLabel(caseDetail.difficulty)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                  {caseDetail.skill.name}
                </span>
              </div>

              <h1 className="mt-4 max-w-2xl font-display text-2xl font-extrabold leading-[1.15] tracking-tight sm:text-3xl">
                {caseDetail.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{caseDetail.scenario}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5 text-emerald-300" /> ~{caseDetail.targetSteps} langkah optimal
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-sky-300" /> ±{minutes} menit
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-300" /> pohon keputusan
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void start()}
                  disabled={starting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-70"
                >
                  <Play className="h-4 w-4" /> {starting ? "Menyiapkan…" : "Mulai simulasi"}
                </button>
                <Link
                  to="/cases"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Pilih kasus lain <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-lg">
              <img
                src={skillImageUrl(caseDetail.skill.code)}
                alt=""
                loading="lazy"
                className="h-40 w-full object-cover opacity-70 lg:h-52"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-[#0b1628]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  mission.brief
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div>
                    <div className="font-display text-lg font-extrabold text-white">{caseDetail.targetSteps} langkah</div>
                    <div className="text-[10px] text-slate-400">jalur paling efisien</div>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                    READY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!active && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[11.5px] font-bold">Belum mengerjakan pretest</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
              Kamu tetap bisa bermain, tapi disarankan menyelesaikan pretest agar jalur adaptifmu lebih akurat.{" "}
              <Link to="/quiz/pretest" className="font-bold underline underline-offset-2">
                Kerjakan pretest
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ---------------------------------------------------------- main column */}
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <MonitorCog className="h-3.5 w-3.5" /> Skenario kasus
              </span>
              <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {caseDetail.skill.code}
              </span>
            </div>
            <div className="px-5 py-5">
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">{caseDetail.scenario}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <ListOrdered className="h-3.5 w-3.5" /> Cara bermain
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                {caseDetail.targetSteps} STEP
              </span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <StepCard
                index={1}
                icon={Compass}
                title="Baca situasi"
                description="Setiap node memberi gejala baru. Pahami konteks sebelum memilih tindakan."
              />
              <StepCard
                index={2}
                icon={Target}
                title="Pilih langkah"
                description="Pilih diagnosis atau solusi paling aman dan efisien. Salah langkah mengurangi akurasi."
              />
              <StepCard
                index={3}
                icon={Lightbulb}
                title="Gunakan hint bijak"
                description="Buntu? Hint membantu, tapi setiap hint memotong sebagian skor akhir."
              />
              <StepCard
                index={4}
                icon={CheckCircle2}
                title="Tuntaskan misi"
                description="Temukan solusi dengan langkah minimal untuk skor dan XP maksimal."
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border/60 px-5 py-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                <Route className="h-3 w-3" /> Fokus ~{caseDetail.targetSteps} langkah optimal
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" /> Estimasi ±{minutes} menit
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                <Wrench className="h-3 w-3" /> XP sesuai performa
              </span>
            </div>
          </section>

          {(prev || next) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  to={`/cases/${prev.id}`}
                  className="group flex flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
                >
                  <span className="inline-flex items-center gap-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <ArrowLeft className="h-3 w-3" /> Kasus sebelumnya
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12.5px] font-bold leading-snug group-hover:text-primary">
                    {prev.title}
                  </span>
                  <span className="mt-2 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {prev.skill.code} · {difficultyLabel(prev.difficulty)}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next ? (
                <Link
                  to={`/cases/${next.id}`}
                  className="group flex flex-col rounded-2xl border border-border/70 bg-card p-4 text-right shadow-soft transition-colors hover:border-primary/40 sm:col-start-2"
                >
                  <span className="inline-flex items-center justify-end gap-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Kasus berikutnya <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12.5px] font-bold leading-snug group-hover:text-primary">
                    {next.title}
                  </span>
                  <span className="mt-2 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {next.skill.code} · {difficultyLabel(next.difficulty)}
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
            <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Skill yang dilatih
            </div>
            <div className="mt-3 flex items-center gap-3">
              <img
                src={skillImageUrl(caseDetail.skill.code)}
                alt=""
                loading="lazy"
                className="h-11 w-11 rounded-xl object-cover ring-1 ring-border/60"
              />
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-bold">{caseDetail.skill.name}</div>
                <div className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {caseDetail.skill.code} · kurikulum
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/40 px-3 py-2">
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">Langkah</div>
                <div className="mt-0.5 font-display text-base font-extrabold">{caseDetail.targetSteps}</div>
              </div>
              <div className="rounded-xl bg-muted/40 px-3 py-2">
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">Estimasi</div>
                <div className="mt-0.5 font-display text-base font-extrabold">{minutes}<span className="text-[9px] text-muted-foreground">m</span></div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-[#0d1a2f] p-4 text-white shadow-soft">
            <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  <Route className="h-3.5 w-3.5 text-emerald-300" /> Jalur terbaik
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {caseDetail.targetSteps} langkah
                </span>
              </div>

              {bestPath.length > 0 ? (
                <ol className="relative mt-3 space-y-2.5 border-l border-white/10 pl-4">
                  {bestPath.slice(0, 7).map((n, i) => (
                    <li key={n.nodeKey} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[21px] top-1 flex h-4 w-4 items-center justify-center rounded-full font-mono-tech text-[8px] font-bold",
                          i === bestPath.length - 1
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-white/10 text-slate-300"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={cn(
                          "line-clamp-1 text-[11px] leading-snug",
                          i === bestPath.length - 1 ? "font-bold text-emerald-300" : "text-slate-300"
                        )}
                      >
                        {n.text}
                      </span>
                    </li>
                  ))}
                  {bestPath.length > 7 && (
                    <li className="text-[10px] text-slate-500">… {bestPath.length - 7} langkah lainnya</li>
                  )}
                </ol>
              ) : (
                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  Jalur terbaik disembunyikan untuk menjaga tantangan. Temukan sendiri saat simulasi.
                </p>
              )}

              <div className="mt-3 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> pilih langkah dengan kepala dingin
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Sebelum mulai
            </div>
            <ul className="mt-2.5 space-y-2">
              {[
                "Baca gejala dengan teliti, jangan buru-buru.",
                "Pilih satu langkah per giliran.",
                "Hint menolong, tapi mengurangi skor.",
                "Skor & XP tersimpan otomatis saat selesai.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[11px] leading-snug text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void start()}
              disabled={starting}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-[11px] font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-70"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {starting ? "Menyiapkan…" : "Mulai sekarang"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StepCard({
  index,
  icon: Icon,
  title,
  description,
}: {
  index: number;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-border/60">
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-mono-tech text-[10px] font-bold text-muted-foreground">0{index}</span>
      </div>
      <div className="mt-2 text-[12px] font-bold">{title}</div>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
