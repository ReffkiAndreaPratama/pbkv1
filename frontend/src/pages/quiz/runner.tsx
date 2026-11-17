import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Play,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { difficultyLabel, difficultyColor, cn } from "@/lib/utils";
import { embedVideoUrl } from "@/lib/media";
import { useLeaveGuard } from "@/lib/use-leave-guard";
import type { QuizQuestion, SubmitRes } from "@/lib/types";

interface QuizRunnerProps {
  title: string;
  subtitle: string;
  config: "PRETEST" | "POSTTEST" | "ADAPTIVE";
  skillId?: string | null;
  onBackHref: string;
}

interface StartRes {
  sessionId: string;
}

const CONFIG_META = {
  PRETEST: { start: "/api/quiz/pretest/start", submit: "/api/quiz/pretest/submit", desc: "10 soal pengukuran awal" },
  POSTTEST: { start: "/api/quiz/posttest/start", submit: "/api/quiz/posttest/submit", desc: "10 soal (4 mudah · 4 sedang · 2 sulit)", pass: 70 },
  ADAPTIVE: { start: "/api/quiz/adaptive/start", submit: "/api/quiz/adaptive/submit", desc: "10 soal yang menyesuaikan penguasaanmu" },
} as const;

const MODE_META = {
  PRETEST: {
    label: "PRETEST · Pengukuran Awal",
    short: "Pretest",
    question: "Ukur titik awalmu dengan 10 soal. Tidak ada lulus/gagal — hasilnya dipakai menyusun jalur belajarmu.",
    finishTitle: "Pengukuran selesai",
    finishBody: "Hasil pretest membentuk jalur belajar dan rekomendasi latihanmu.",
    chip: "border-sky-300/25 bg-sky-300/10 text-sky-200",
    dot: "bg-sky-300",
    bar: "bg-sky-400",
    barSoft: "bg-sky-400/35",
    text: "text-sky-300",
    soft: "bg-sky-50 text-sky-700 ring-sky-100",
    from: "#38bdf8",
    to: "#3b82f6",
  },
  ADAPTIVE: {
    label: "LATIHAN · Kuis Adaptif",
    short: "Kuis Adaptif",
    question: "Soal menyesuaikan penguasaanmu. Jawab dengan tenang — pembahasan muncul setelah selesai.",
    finishTitle: "Latihan selesai",
    finishBody: "Hasilnya langsung diperhitungkan ke penguasaan skill-mu.",
    chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    dot: "bg-emerald-300",
    bar: "bg-emerald-400",
    barSoft: "bg-emerald-400/35",
    text: "text-emerald-300",
    soft: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    from: "#34d399",
    to: "#14b8a6",
  },
  POSTTEST: {
    label: "POSTTEST · Uji Akhir",
    short: "Posttest",
    question: "Uji pemahamanmu setelah materi & simulasi. Minimal kelulusan 70.",
    finishTitle: "Posttest selesai",
    finishBody: "Skor akhir menentukan kelulusanmu dari jalur ini.",
    chip: "border-violet-300/25 bg-violet-300/10 text-violet-200",
    dot: "bg-violet-300",
    bar: "bg-violet-400",
    barSoft: "bg-violet-400/35",
    text: "text-violet-300",
    soft: "bg-violet-50 text-violet-700 ring-violet-100",
    from: "#a78bfa",
    to: "#7c3aed",
  },
} as const;

export function QuizRunner({ subtitle, config, skillId, onBackHref }: QuizRunnerProps) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const meta = CONFIG_META[config];
  const mode = MODE_META[config];

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selectedKeys: string[] }[]>([]);
  const [result, setResult] = useState<SubmitRes | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  useLeaveGuard(result === null && !!sessionId);

  useEffect(() => {
    setVideoOpen(false);
  }, [idx]);

  useEffect(() => {
    const load = async () => {
      try {
        const qs = skillId
          ? await api.get<QuizQuestion[]>(`/api/quiz/${config.toLowerCase() === "adaptive" ? "adaptive" : config.toLowerCase()}?skillId=${skillId}`)
          : await api.get<QuizQuestion[]>(`/api/quiz/${config.toLowerCase()}`);
        setQuestions(qs);
        const s = await api.post<StartRes>(meta.start);
        setSessionId(s.sessionId);
      } catch {
        toast.error("Gagal memuat kuis.");
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, skillId]);

  /* ------------------------------------------------------------------ result */
  if (result && result.score !== undefined) {
    const passed = result.passed ?? result.score >= 70;
    const review = result.review ?? [];
    const score = Math.round(result.score);

    return (
      <div className="animate-fade-in space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div
            className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full blur-3xl"
            style={{ background: passed ? "rgba(52,211,153,0.22)" : "rgba(244,63,94,0.18)" }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em]", mode.chip)}>
                <BrainCircuit className="h-3 w-3" /> {mode.short} · hasil
              </div>

              <h1 className="mt-4 max-w-lg font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                {passed ? mode.finishTitle : "Belum tuntas,"}
                <br />
                <span className="text-gradient">{passed ? "kerja bagus." : "tapi masih bisa naik."}</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
                {config === "PRETEST" ? mode.finishBody : passed ? mode.finishBody : "Skor minimal kelulusan posttest adalah 70. Tinjau pembahasan lalu ulangi."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link
                  to={onBackHref}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </Link>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </button>
                <Link
                  to="/achievements"
                  className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
                >
                  Lihat pencapaian <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* score terminal */}
            <div className="relative self-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                    <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                      quiz.result
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono-tech text-[9px] font-bold",
                      passed ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                    )}
                  >
                    {passed ? "PASSED" : "REVIEW"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <ScoreDial value={score} from={mode.from} to={mode.to} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
                      <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Benar</div>
                      <div className="font-mono-tech text-[11px] font-bold text-emerald-300">
                        {result.correctCount} / {result.totalCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
                      <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Salah</div>
                      <div className="font-mono-tech text-[11px] font-bold text-rose-300">
                        {Math.max(0, result.totalCount - result.correctCount)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                  <span className="font-mono-tech text-[10px] text-slate-400">Status</span>
                  <span className={cn("font-mono-tech text-[10px] font-bold", passed ? "text-emerald-300" : "text-rose-300")}>
                    {passed ? "LULUS" : config === "POSTTEST" ? "REMEDIAL" : "SELESAI"}
                  </span>
                </div>
                <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                  <span className="text-emerald-300">$</span> hasil tersimpan otomatis
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {review.length > 0 && (
          <section className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Pembahasan
                </div>
                <h2 className="mt-0.5 font-display text-xl font-extrabold">Tinjau jawabanmu</h2>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{review.length} soal</span>
            </div>

            <div className="mt-4 space-y-3">
              {review.map((r, i) => (
                <article key={i} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 font-mono-tech text-[9px] font-bold text-emerald-300">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Soal {i + 1}
                      </span>
                    </span>
                    {r.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Benar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                        <XCircle className="h-3 w-3" /> Salah
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-[13.5px] font-bold leading-snug text-slate-800">{r.prompt}</p>
                    <div className="mt-3 space-y-2">
                      {r.options.map((opt) => {
                        const isSelected = r.selectedKeys.includes(opt.key);
                        const isKey = r.correctKeys.includes(opt.key);
                        return (
                          <div
                            key={opt.key}
                            className={cn(
                              "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                              isKey
                                ? "border-emerald-300 bg-emerald-50/70"
                                : isSelected
                                  ? "border-rose-300 bg-rose-50/70"
                                  : "border-border/60 bg-muted/20"
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono-tech text-[10px] font-bold",
                                isKey ? "bg-emerald-500 text-white" : isSelected ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {opt.key.toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-medium leading-snug text-slate-700">{opt.text}</p>
                              {(isKey || isSelected) && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {isKey && <span className="text-[9.5px] font-bold text-emerald-700">✓ Kunci jawaban</span>}
                                  {isSelected && !isKey && <span className="text-[9.5px] font-bold text-rose-700">✗ Jawabanmu</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation && (
                      <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-slate-700">
                        <span className="font-bold text-primary">Penjelasan: </span>
                        {r.explanation}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------ loading / empty */
  if (!questions || !sessionId) return <PageLoader />;
  if (questions.length === 0)
    return (
      <EmptyState
        icon={<BrainCircuit className="h-6 w-6" />}
        title="Belum ada soal"
        description="Admin belum menambahkan soal untuk mode ini."
        action={
          <Button asChild variant="outline">
            <Link to={onBackHref}>Kembali</Link>
          </Button>
        }
      />
    );

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const options = (q.options ?? []) as { key: string; text: string }[];
  const answered = idx;
  const progress = Math.round(((idx + 1) / questions.length) * 100);

  const toggle = (key: string) => {
    if (locked) return;
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const submitAnswer = () => {
    if (selected.length === 0 || locked) return;
    setLocked(true);
    setAnswers((a) => [...a, { questionId: q.id, selectedKeys: selected }]);
    setTimeout(() => {
      if (isLast) void finish();
      else {
        setIdx((i) => i + 1);
        setSelected([]);
        setLocked(false);
      }
    }, 350);
  };

  const finish = async () => {
    if (!sessionId) return;
    try {
      const payload = [...answers];
      if (!payload.some((a) => a.questionId === q.id)) payload.push({ questionId: q.id, selectedKeys: selected });
      const res = await api.post<SubmitRes>(meta.submit, { sessionId, answers: payload });
      setResult(res);
      try {
        const me = await api.get<SessionUser>("/api/auth/me");
        setUser(me);
      } catch {
        /* re-hydrate best effort */
      }
      toast.success("Kuis selesai!");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengirim jawaban.");
      setLocked(false);
    }
  };

  /* ------------------------------------------------------------------ question */
  return (
    <div className="animate-fade-in space-y-4">
      {/* HUD */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={onBackHref}
              className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Keluar sesi
            </Link>
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em]", mode.chip)}>
                <BrainCircuit className="h-3 w-3" /> {mode.short}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[9.5px] font-bold text-slate-300">
                {idx + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                {mode.label.split(" · ")[1] ?? mode.label}
              </h1>
              <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">{mode.question}</p>
            </div>
            <div className="flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Target className={cn("h-3.5 w-3.5", mode.text)} /> {answered} dijawab
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-300" /> {progress}%
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-1">
            {questions.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < idx ? mode.bar : i === idx ? mode.barSoft : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-4">
        <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 font-mono-tech text-[9px] font-bold text-emerald-300">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Pertanyaan
              </span>
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", difficultyColor(q.difficulty))}>
              {difficultyLabel(q.difficulty)}
            </span>
          </div>

          <div className="p-5 sm:p-7">
            {subtitle && (
              <p className="mb-2 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {subtitle}
              </p>
            )}
            <h2 className="font-display text-[19px] font-extrabold leading-snug text-slate-900 sm:text-[21px]">{q.prompt}</h2>

            {(q.imageUrl || q.videoUrl) && (
              <div className="mt-4 space-y-3">
                {q.imageUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                    <img
                      src={q.imageUrl}
                      alt="Ilustrasi pendukung soal"
                      className="h-44 w-full object-cover sm:h-56"
                      loading="lazy"
                    />
                  </div>
                )}
                {q.videoUrl && embedVideoUrl(q.videoUrl) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setVideoOpen((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-2 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40"
                    >
                      <Play size={14} className="text-primary" />
                      {videoOpen ? "Sembunyikan video penjelasan" : "Tonton video penjelasan"}
                    </button>
                    {videoOpen && (
                      <div className="mt-2 aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-black">
                        <iframe
                          src={embedVideoUrl(q.videoUrl)!}
                          title="Video penjelasan soal"
                          className="h-full w-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              {options.map((opt) => {
                const active = selected.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={locked}
                    onClick={() => toggle(opt.key)}
                    aria-pressed={active}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all",
                      active
                        ? "border-slate-900 bg-slate-900/[0.03] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)]"
                        : "border-border/70 bg-card hover:border-slate-300 hover:bg-muted/30",
                      locked && "opacity-70"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono-tech text-[11px] font-bold transition-colors",
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-border bg-muted/40 text-muted-foreground group-hover:border-slate-300"
                      )}
                    >
                      {opt.key.toUpperCase()}
                    </span>
                    <span className="flex-1 text-[13px] font-medium leading-snug text-slate-700">{opt.text}</span>
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                        active ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"
                      )}
                      aria-hidden
                    >
                      {active && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <span className="text-[10.5px] text-muted-foreground">
                {selected.length === 0
                  ? "Pilih satu jawaban untuk melanjutkan."
                  : `${selected.length} pilihan dipilih · jawaban tersimpan saat lanjut.`}
              </span>
              <button
                type="button"
                onClick={submitAnswer}
                disabled={selected.length === 0 || locked}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLast ? "Selesaikan kuis" : "Jawaban berikutnya"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-soft">
          <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> {meta.desc}
          </span>
          <span className="font-mono-tech text-[9.5px] font-bold text-muted-foreground">
            {questions.length - idx - 1} soal tersisa
          </span>
        </div>
      </div>
    </div>
  );
}

function ScoreDial({ value, from, to }: { value: number; from: string; to: string }) {
  const size = 104;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, value));
  const id = `quizDial-${from.replace("#", "")}-${to.replace("#", "")}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - safe / 100)}
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold leading-none text-white">{safe}</span>
        <span className="mt-0.5 font-mono-tech text-[8px] uppercase tracking-[0.18em] text-slate-500">skor</span>
      </div>
    </div>
  );
}
