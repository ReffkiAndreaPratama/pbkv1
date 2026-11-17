import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Flame,
  Lightbulb,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLeaveGuard } from "@/lib/use-leave-guard";
import { EmptyState, PageLoader } from "@/components/ui/feedback";
import { cn, difficultyColor, difficultyLabel } from "@/lib/utils";
import { ScoreDial } from "./score-dial";
import { ReviewList } from "./review-list";
import type { PracticeAnswerRes, PracticeResult, QuizQuestion } from "@/lib/types";

interface PracticeRunnerProps {
  skillId?: string | null;
  onBackHref: string;
}

interface StartRes {
  sessionId: string;
}

interface AnswerRecord {
  questionId: string;
  selectedKeys: string[];
  isCorrect: boolean;
  correctKeys: string[];
  explanation: string;
}

/**
 * Mode LATIHAN.
 * Berbeda dari ujian: tanpa timer, tanpa batas percobaan, umpan balik benar/salah
 * dan pembahasan muncul langsung setelah setiap jawaban, serta petunjuk bisa
 * mempersempit pilihan.
 */
export function PracticeRunner({ skillId, onBackHref }: PracticeRunnerProps) {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<PracticeAnswerRes | null>(null);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [finishing, setFinishing] = useState(false);

  useLeaveGuard(!result && !!sessionId);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const query = skillId ? `?skillId=${encodeURIComponent(skillId)}` : "";
        const [qs, s] = await Promise.all([
          api.get<QuizQuestion[]>(`/api/quiz/adaptive${query}`),
          api.post<StartRes>("/api/quiz/adaptive/start"),
        ]);
        if (!alive) return;
        setQuestions(qs);
        setSessionId(s.sessionId);
      } catch {
        if (alive) toast.error("Gagal memuat latihan.");
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [skillId]);

  const finish = useCallback(
    async (recordsToSend?: AnswerRecord[]) => {
      if (!sessionId) return;
      setFinishing(true);
      try {
        const res = await api.post<PracticeResult>("/api/quiz/adaptive/finish", { sessionId });
        // Gunakan rekaman lokal sebagai cadangan bila server belum punya jawaban.
        if (!res.review?.length && recordsToSend?.length) {
          res.review = recordsToSend.map((r) => {
            const q = questions?.find((x) => x.id === r.questionId);
            return {
              prompt: q?.prompt ?? "",
              options: q?.options ?? [],
              selectedKeys: r.selectedKeys,
              correctKeys: r.correctKeys,
              isCorrect: r.isCorrect,
              explanation: r.explanation,
            };
          });
        }
        setResult(res);
        toast.success("Latihan selesai — progresmu tersimpan.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Gagal menyelesaikan latihan.");
      } finally {
        setFinishing(false);
      }
    },
    [sessionId, questions]
  );

  /* ------------------------------------------------------------------ result */
  if (result) {
    const score = Math.round(result.score);
    const total = result.totalCount || result.review.length;
    const accuracy = total ? Math.round((result.correctCount / total) * 100) : 0;

    return (
      <div className="animate-fade-in space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                <ListChecks className="h-3 w-3" /> Latihan · selesai
              </div>
              <h1 className="mt-4 max-w-lg font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                Latihan tuntas,
                <br />
                <span className="text-gradient">lanjut poles skill-mu.</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
                Latihan tidak menentukan kelulusan. Setiap jawaban sudah memperbarui penguasaan skill dan XP-mu.
                Ulangi sesi kapan pun tanpa batas.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  <RotateCcw className="h-4 w-4" /> Latihan lagi
                </button>
                <Link
                  to="/exam"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Target className="h-4 w-4" /> Coba ujian
                </Link>
                <Link
                  to={onBackHref}
                  className="inline-flex h-9 items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
                >
                  Kembali <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative self-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    practice.summary
                  </span>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                    LATIHAN
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <ScoreDial value={score} from="#34d399" to="#14b8a6" label="akurasi" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
                      <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Benar</div>
                      <div className="font-mono-tech text-[11px] font-bold text-emerald-300">
                        {result.correctCount} / {total}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
                      <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Streak terbaik</div>
                      <div className="font-mono-tech text-[11px] font-bold text-amber-300">{bestStreak} benar beruntun</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                  <span className="font-mono-tech text-[10px] text-slate-400">Akurasi</span>
                  <span className="font-mono-tech text-[10px] font-bold text-emerald-300">{accuracy}%</span>
                </div>
                <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                  <span className="text-emerald-300">$</span> progres tersimpan otomatis
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {result.review.length > 0 && <ReviewList review={result.review} />}
      </div>
    );
  }

  /* ------------------------------------------------------------------ loading / empty */
  if (!questions || !sessionId) return <PageLoader />;
  if (questions.length === 0)
    return (
      <EmptyState
        icon={<BrainCircuit className="h-6 w-6" />}
        title="Belum ada soal latihan"
        description="Admin belum menambahkan soal untuk latihan ini."
        action={
          <Link
            to={onBackHref}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        }
      />
    );

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const options = q.options ?? [];
  const correctCount = records.filter((r) => r.isCorrect).length;
  const progress = Math.round(((idx + (feedback ? 1 : 0)) / questions.length) * 100);
  const optionState = (key: string) => {
    if (!feedback) return "idle" as const;
    if (feedback.correctKeys.includes(key)) return "correct" as const;
    if (selected.includes(key)) return "wrong" as const;
    return "idle" as const;
  };

  const toggle = (key: string) => {
    if (feedback || checking) return;
    if (eliminated.includes(key)) return;
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const requestHint = async () => {
    if (feedback || hintUsed || hintLoading) return;
    setHintLoading(true);
    try {
      const res = await api.post<{ eliminate: string[] }>("/api/quiz/adaptive/hint", { questionId: q.id });
      setEliminated((prev) => [...new Set([...prev, ...res.eliminate])]);
      setSelected((prev) => prev.filter((k) => !res.eliminate.includes(k)));
      setHintUsed(true);
      toast.info(`${res.eliminate.length} pilihan salah disingkirkan.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal mengambil petunjuk.");
    } finally {
      setHintLoading(false);
    }
  };

  const check = async () => {
    if (selected.length === 0 || feedback || checking) return;
    setChecking(true);
    try {
      const res = await api.post<PracticeAnswerRes>("/api/quiz/adaptive/answer", {
        sessionId,
        questionId: q.id,
        selectedKeys: selected,
        hintUsed,
      });
      setFeedback(res);
      const record: AnswerRecord = {
        questionId: q.id,
        selectedKeys: selected,
        isCorrect: res.isCorrect,
        correctKeys: res.correctKeys,
        explanation: res.explanation,
      };
      setRecords((prev) => [...prev, record]);
      if (res.isCorrect) {
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal memeriksa jawaban.");
    } finally {
      setChecking(false);
    }
  };

  const next = async () => {
    if (isLast) {
      await finish(records);
      return;
    }
    setIdx((i) => i + 1);
    setSelected([]);
    setFeedback(null);
    setEliminated([]);
    setHintUsed(false);
  };

  /* ------------------------------------------------------------------ question */
  return (
    <div className="animate-fade-in space-y-4">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" aria-hidden />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to={onBackHref}
              className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Keluar latihan
            </Link>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                <ListChecks className="h-3 w-3" /> Latihan
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[9.5px] font-bold text-slate-300">
                {idx + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                Kuis Adaptif
              </h1>
              <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">
                Tanpa timer, tanpa batas percobaan. Periksa tiap jawaban untuk melihat pembahasan langsung.
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> {correctCount} benar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flame className={cn("h-3.5 w-3.5", streak > 0 ? "text-amber-300" : "text-slate-500")} /> streak {streak}
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
                  i < idx ? "bg-emerald-400" : i === idx ? "bg-emerald-400/40" : "bg-white/10"
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
                Latihan soal
              </span>
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", difficultyColor(q.difficulty))}>
              {difficultyLabel(q.difficulty)}
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <h2 className="font-display text-[19px] font-extrabold leading-snug text-slate-900 sm:text-[21px]">{q.prompt}</h2>

            {q.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                <img src={q.imageUrl} alt="Ilustrasi pendukung soal" className="h-44 w-full object-cover sm:h-56" loading="lazy" />
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              {options.map((opt) => {
                const active = selected.includes(opt.key);
                const isEliminated = eliminated.includes(opt.key);
                const state = optionState(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={!!feedback || checking || isEliminated}
                    onClick={() => toggle(opt.key)}
                    aria-pressed={active}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all",
                      state === "correct" && "border-emerald-400 bg-emerald-50/80",
                      state === "wrong" && "border-rose-400 bg-rose-50/80",
                      state === "idle" && active && "border-slate-900 bg-slate-900/[0.03]",
                      state === "idle" && !active && "border-border/70 bg-card hover:border-slate-300 hover:bg-muted/30",
                      isEliminated && "opacity-45 line-through",
                      feedback && state === "idle" && "opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono-tech text-[11px] font-bold transition-colors",
                        state === "correct" && "border-emerald-500 bg-emerald-500 text-white",
                        state === "wrong" && "border-rose-500 bg-rose-500 text-white",
                        state === "idle" && active && "border-slate-900 bg-slate-900 text-white",
                        state === "idle" && !active && "border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {state === "correct" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : state === "wrong" ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        opt.key.toUpperCase()
                      )}
                    </span>
                    <span className="flex-1 text-[13px] font-medium leading-snug text-slate-700">{opt.text}</span>
                    {isEliminated && (
                      <span className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        tersingkir
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                className={cn(
                  "mt-4 rounded-xl border px-3.5 py-3",
                  feedback.isCorrect ? "border-emerald-200 bg-emerald-50/70" : "border-rose-200 bg-rose-50/70"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-bold",
                    feedback.isCorrect ? "text-emerald-700" : "text-rose-700"
                  )}
                >
                  {feedback.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {feedback.isCorrect ? "Tepat." : "Belum tepat."}
                  {feedback.isCorrect && streak > 1 && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      <Flame className="h-3 w-3" /> {streak} beruntun
                    </span>
                  )}
                </div>
                {!feedback.isCorrect && (
                  <p className="mt-1 text-[11.5px] font-medium text-rose-700">
                    Kunci: {feedback.correctKeys.map((k) => k.toUpperCase()).join(", ")}
                  </p>
                )}
                {feedback.explanation && (
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">{feedback.explanation}</p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={requestHint}
                  disabled={!!feedback || hintUsed || hintLoading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-300/70 bg-amber-50 px-3 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {hintUsed ? "Petunjuk dipakai" : hintLoading ? "Menyiapkan…" : "Minta petunjuk"}
                </button>
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {hintUsed ? "Pilihan salah sudah disingkirkan." : "Petunjuk menyingkirkan 2 pilihan salah."}
                </span>
              </div>

              {feedback ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={finishing}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isLast ? (finishing ? "Menyimpan…" : "Selesaikan latihan") : "Soal berikutnya"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={check}
                  disabled={selected.length === 0 || checking}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking ? "Memeriksa…" : "Periksa jawaban"}
                  <Target className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </article>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-soft">
          <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Umpan balik instan · tanpa timer
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono-tech text-[9.5px] font-bold text-muted-foreground">
              {questions.length - idx - 1} soal tersisa
            </span>
            {records.length > 0 && (
              <button
                type="button"
                onClick={() => void finish(records)}
                disabled={finishing}
                className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-rose-600 transition-colors hover:text-rose-500 disabled:opacity-50"
              >
                {finishing ? "Menyimpan…" : "Akhiri latihan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

