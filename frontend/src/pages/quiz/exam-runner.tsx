import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LayoutDashboard,
  ListChecks,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { api, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLeaveGuard } from "@/lib/use-leave-guard";
import { PageLoader } from "@/components/ui/feedback";
import { cn, difficultyColor, difficultyLabel } from "@/lib/utils";
import { ScoreDial } from "./score-dial";
import { ReviewList } from "./review-list";
import type { ExamInfo, ExamResult, ExamStateRes } from "@/lib/types";

interface ExamRunnerProps {
  onBackHref: string;
}

function clock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Mode UJIAN.
 * Berbeda dari latihan: soal terikat satu sesi, countdown berjalan, tidak ada
 * petunjuk, tidak ada umpan balik sebelum dikumpulkan, jawaban tersimpan
 * otomatis, kelulusan memakai KKM, dan percobaan dibatasi.
 */
export function ExamRunner({ onBackHref }: ExamRunnerProps) {
  const { setUser } = useAuth();

  const [info, setInfo] = useState<ExamInfo | null>(null);
  const [phase, setPhase] = useState<"rules" | "running">("rules");
  const [exam, setExam] = useState<ExamStateRes | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [starting, setStarting] = useState(false);
  const submittedRef = useRef(false);

  useLeaveGuard(phase === "running" && !result);

  const loadInfo = useCallback(async () => {
    try {
      setInfo(await api.get<ExamInfo>("/api/quiz/exam/info"));
    } catch {
      toast.error("Gagal memuat status ujian.");
    }
  }, []);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  const startExam = useCallback(
    async (resume = false) => {
      if (starting) return;
      setStarting(true);
      try {
        const payload = resume && info?.activeSessionId ? { sessionId: info.activeSessionId } : {};
        const res = await api.post<ExamStateRes>("/api/quiz/exam/start", payload);
        if (res.completed && res.result) {
          setResult(res.result);
          setPhase("rules");
          void loadInfo();
          return;
        }
        const saved: Record<string, string[]> = {};
        for (const a of res.savedAnswers ?? []) saved[a.questionId] = a.selectedKeys;
        submittedRef.current = false;
        setResult(null);
        setExam(res);
        setAnswers(saved);
        setFlagged([]);
        setIdx(0);
        setRemaining(res.remainingSec ?? res.durationSec ?? 0);
        setSaving("idle");
        setPhase("running");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Gagal memulai ujian.");
        void loadInfo();
      } finally {
        setStarting(false);
      }
    },
    [info?.activeSessionId, starting, loadInfo]
  );

  const submit = useCallback(
    async (auto = false) => {
      if (!exam?.sessionId || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      try {
        const res = await api.post<ExamResult>(`/api/quiz/exam/${exam.sessionId}/submit`, {
          answers: Object.entries(answers).map(([questionId, selectedKeys]) => ({ questionId, selectedKeys })),
        });
        setResult(res);
        setPhase("rules");
        try {
          setUser(await api.get<SessionUser>("/api/auth/me"));
        } catch {
          /* re-hydrate best effort */
        }
        toast[auto ? "info" : "success"](
          auto ? "Waktu habis — ujian dikumpulkan otomatis." : "Ujian berhasil dikumpulkan."
        );
        void loadInfo();
      } catch (e: unknown) {
        submittedRef.current = false;
        toast.error(e instanceof Error ? e.message : "Gagal mengumpulkan ujian.");
      } finally {
        setSubmitting(false);
      }
    },
    [exam?.sessionId, answers, loadInfo, setUser]
  );

  // Hitung sisa waktu dari deadline server, bukan dari counter lokal.
  useEffect(() => {
    if (phase !== "running" || !exam?.deadlineAt) return;
    const deadline = new Date(exam.deadlineAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [phase, exam?.deadlineAt]);

  // Auto-submit saat waktu habis.
  useEffect(() => {
    if (phase === "running" && remaining === 0 && exam && !result) void submit(true);
  }, [phase, remaining, exam, result, submit]);

  const saveAnswer = async (questionId: string, selectedKeys: string[]) => {
    if (!exam?.sessionId) return;
    setSaving("saving");
    try {
      await api.post(`/api/quiz/exam/${exam.sessionId}/answer`, { questionId, selectedKeys });
      setSaving("saved");
    } catch {
      setSaving("idle");
      toast.error("Gagal menyimpan jawaban. Periksa koneksi lalu coba lagi.");
    }
  };

  const selectOption = (questionId: string, key: string) => {
    if (submitting || result) return;
    const current = answers[questionId] ?? [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setAnswers((prev) => ({ ...prev, [questionId]: next }));
    void saveAnswer(questionId, next);
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => (prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]));
  };

  /* ------------------------------------------------------------------ result */
  if (result) {
    const passed = result.passed;
    const attemptsLeft = info?.remainingAttempts ?? 0;
    const answered = result.review.filter((r) => r.selectedKeys.length > 0).length;

    return (
      <div className="animate-fade-in space-y-5">
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div
            className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full blur-3xl"
            style={{ background: passed ? "rgba(52,211,153,0.22)" : "rgba(244,63,94,0.2)" }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
            <div>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em]",
                  passed
                    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                    : "border-rose-300/25 bg-rose-300/10 text-rose-200"
                )}
              >
                <ShieldCheck className="h-3 w-3" /> Ujian akhir · hasil resmi
              </div>

              <h1 className="mt-4 max-w-lg font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                {passed ? "Selamat, kamu" : "Belum lulus,"}
                <br />
                <span className="text-gradient">{passed ? "lulus ujian." : "masih ada kesempatan."}</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
                {result.timedOut
                  ? "Waktu habis sebelum kamu mengumpulkan. Jawaban yang tersimpan tetap dinilai."
                  : passed
                    ? `Skor ${result.score} memenuhi KKM ${result.passScore}. Hasil ini tercatat sebagai capaian akhir jalurmu.`
                    : `Skor ${result.score} belum mencapai KKM ${result.passScore}. Tinjau pembahasan, lalu gunakan sisa percobaan untuk remedial.`}
              </p>

              {result.timedOut && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
                  <Clock className="h-3.5 w-3.5" /> Dikumpulkan otomatis karena waktu habis
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {!passed && attemptsLeft > 0 && (
                  <button
                    type="button"
                    onClick={() => void startExam(false)}
                    disabled={starting}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" /> {starting ? "Menyiapkan…" : `Remedial (${attemptsLeft} sisa)`}
                  </button>
                )}
                <Link
                  to="/practice"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ListChecks className="h-4 w-4" /> Latihan dulu
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
                    exam.report
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono-tech text-[9px] font-bold",
                      passed ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                    )}
                  >
                    {passed ? "LULUS" : "BELUM LULUS"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <ScoreDial value={result.score} from={passed ? "#34d399" : "#fb7185"} to={passed ? "#14b8a6" : "#e11d48"} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
                      <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Benar</div>
                      <div className="font-mono-tech text-[11px] font-bold text-emerald-300">
                        {result.correctCount} / {result.totalCount}
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/30 px-2.5 py-1.5">
                      <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">Dijawab</div>
                      <div className="font-mono-tech text-[11px] font-bold text-sky-300">
                        {answered} / {result.totalCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                  <span className="font-mono-tech text-[10px] text-slate-400">KKM</span>
                  <span className="font-mono-tech text-[10px] font-bold text-slate-200">{result.passScore}</span>
                </div>
                <div className="mt-2 font-mono-tech text-[10px] text-slate-500">
                  <span className="text-emerald-300">$</span> hasil final tersimpan
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {result.perSkill.length > 0 && (
          <section className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-extrabold">Rincian per skill</h2>
            </div>
            <div className="mt-3 space-y-2.5">
              {result.perSkill.map((s) => {
                const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={s.code}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">{s.name}</span>
                      <span className="font-mono-tech text-[10px] font-bold text-muted-foreground">
                        {s.correct}/{s.total} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <ReviewList
          review={result.review}
          description="Pembahasan lengkap baru dibuka setelah ujian dikumpulkan."
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------ loading */
  if (!info) return <PageLoader />;

  /* ------------------------------------------------------------------ rules */
  if (phase === "rules") {
    const blocked = info.remainingAttempts <= 0 && !info.activeSessionId;
    const active = !!info.activeSessionId;

    return (
      <div className="animate-fade-in space-y-4">
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-violet-200">
                <ShieldCheck className="h-3 w-3" /> Ujian akhir · mode formal
              </div>
              <h1 className="mt-4 max-w-lg font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                Ujian Akhir
                <br />
                <span className="text-gradient">Bengkel PC &amp; Laptop.</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
                Ini bukan latihan. Timer berjalan sejak ujian dimulai, tidak ada petunjuk, dan umpan balik baru
                terbuka setelah kamu mengumpulkan jawaban.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <RuleStat icon={ListChecks} label="Soal" value={`${info.questionCount}`} />
                <RuleStat icon={Timer} label="Durasi" value={`${Math.round(info.durationSec / 60)} mnt`} />
                <RuleStat icon={Target} label="KKM" value={`${info.passScore}`} />
                <RuleStat icon={RotateCcw} label="Percobaan" value={`${info.attemptsUsed}/${info.maxAttempts}`} />
              </div>
            </div>

            <div className="relative self-center">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">
                    exam.rules
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono-tech text-[9px] font-bold",
                      blocked ? "bg-rose-400/15 text-rose-300" : active ? "bg-amber-300/15 text-amber-300" : "bg-violet-300/15 text-violet-200"
                    )}
                  >
                    {blocked ? "TERKUNCI" : active ? "SESI AKTIF" : "SIAP"}
                  </span>
                </div>

                <ul className="mt-3 space-y-2 text-[11.5px] leading-snug text-slate-300">
                  <RuleLine>Timer tidak berhenti walau kamu keluar dari halaman.</RuleLine>
                  <RuleLine>Tidak ada petunjuk dan tidak ada umpan balik sebelum submit.</RuleLine>
                  <RuleLine>Jawaban tersimpan otomatis setiap kali dipilih.</RuleLine>
                  <RuleLine>Waktu habis = ujian dikumpulkan otomatis.</RuleLine>
                  <RuleLine>Pembahasan lengkap hanya muncul setelah ujian selesai.</RuleLine>
                </ul>

                {active && (
                  <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
                    Ada sesi ujian yang masih berjalan — sisa {clock(info.activeRemainingSec)}.
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                  <span className="font-mono-tech text-[10px] text-slate-400">Skor terbaik</span>
                  <span className="font-mono-tech text-[10px] font-bold text-slate-200">
                    {info.bestScore ?? "—"}
                  </span>
                </div>

                <div className="mt-3">
                  {blocked ? (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-[11px] text-rose-200">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Batas {info.maxAttempts} percobaan sudah tercapai. Hubungi instruktur untuk reset.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startExam(active)}
                      disabled={starting}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-xs font-bold text-white transition-colors hover:bg-violet-400 disabled:opacity-60"
                    >
                      {starting ? "Menyiapkan…" : active ? "Lanjutkan ujian" : "Mulai ujian"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <h2 className="font-display text-sm font-extrabold">Sebelum mulai</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Pastikan koneksi stabil dan kamu punya waktu ±{Math.round(info.durationSec / 60)} menit tanpa
                gangguan. Ujian tidak bisa dijeda. Jika belum siap, kembali ke{" "}
                <Link to="/practice" className="font-semibold text-primary hover:underline">
                  latihan
                </Link>{" "}
                atau{" "}
                <Link to="/materials" className="font-semibold text-primary hover:underline">
                  materi
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <Link
            to={onBackHref}
            className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ running */
  const questions = exam?.questions ?? [];
  const q = questions[idx];
  if (!exam || !q) return <PageLoader />;

  const selected = answers[q.id] ?? [];
  const isLast = idx === questions.length - 1;
  const answeredCount = questions.filter((item) => (answers[item.id]?.length ?? 0) > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const isFlagged = flagged.includes(q.id);
  const timerTone = remaining <= 60 ? "text-rose-300" : remaining <= 300 ? "text-amber-300" : "text-emerald-300";
  const progress = Math.round((answeredCount / questions.length) * 100);

  const go = (next: number) => setIdx(Math.min(questions.length - 1, Math.max(0, next)));

  return (
    <div className="animate-fade-in space-y-4">
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-10 top-0 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" /> Sesi ujian berlangsung
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-300/10 px-2.5 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] text-violet-200">
                <Lock className="h-3 w-3" /> Tanpa petunjuk
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono-tech text-[9.5px] font-bold text-slate-300">
                {idx + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">Ujian Akhir</h1>
              <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-400">
                Pilih jawaban, tandai soal ragu, lalu kumpulkan sebelum waktu habis.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> {answeredCount} dijawab
              </div>
              <div className={cn("flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-1.5", remaining <= 60 && "animate-pulse")}>
                <Clock className={cn("h-4 w-4", timerTone)} />
                <span className={cn("font-mono-tech text-base font-bold tabular-nums", timerTone)}>{clock(remaining)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 font-mono-tech text-[9px] font-bold text-violet-300">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Soal ujian
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", difficultyColor(q.difficulty))}>
                {difficultyLabel(q.difficulty)}
              </span>
              <button
                type="button"
                onClick={() => toggleFlag(q.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold transition-colors",
                  isFlagged
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-border bg-card text-muted-foreground hover:border-amber-300 hover:text-amber-700"
                )}
              >
                <Flag className={cn("h-3 w-3", isFlagged && "fill-amber-500")} />
                {isFlagged ? "Ditandai" : "Tandai"}
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <h2 className="font-display text-[19px] font-extrabold leading-snug text-slate-900 sm:text-[21px]">{q.prompt}</h2>

            {q.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                <img src={q.imageUrl} alt="Ilustrasi pendukung soal" className="h-44 w-full object-cover sm:h-56" loading="lazy" />
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              {q.options.map((opt) => {
                const active = selected.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => selectOption(q.id, opt.key)}
                    aria-pressed={active}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3.5 text-left transition-all",
                      active
                        ? "border-violet-500 bg-violet-50/60 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
                        : "border-border/70 bg-card hover:border-slate-300 hover:bg-muted/30"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono-tech text-[11px] font-bold transition-colors",
                        active
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-border bg-muted/40 text-muted-foreground group-hover:border-slate-300"
                      )}
                    >
                      {active ? <CheckCircle2 className="h-4 w-4" /> : opt.key.toUpperCase()}
                    </span>
                    <span className="flex-1 text-[13px] font-medium leading-snug text-slate-700">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => go(idx - 1)}
                  disabled={idx === 0}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-[11px] font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </button>
                <span className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  {saving === "saving" ? "menyimpan…" : saving === "saved" ? "tersimpan" : "autosave aktif"}
                </span>
              </div>

              {isLast ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-violet-600 px-5 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Kumpulkan ujian
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => go(idx + 1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Berikutnya <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </article>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Navigasi soal
              </h2>
              <span className="font-mono-tech text-[9.5px] font-bold text-muted-foreground">{answeredCount}/{questions.length}</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {questions.map((item, i) => {
                const answered = (answers[item.id]?.length ?? 0) > 0;
                const flaggedItem = flagged.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={cn(
                      "relative flex h-8 items-center justify-center rounded-lg border font-mono-tech text-[10px] font-bold transition-colors",
                      i === idx
                        ? "border-violet-600 bg-violet-600 text-white"
                        : answered
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-border bg-card text-muted-foreground hover:border-slate-300"
                    )}
                    aria-label={`Soal ${i + 1}${answered ? " dijawab" : " belum dijawab"}${flaggedItem ? " ditandai" : ""}`}
                  >
                    {i + 1}
                    {flaggedItem && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
              <Legend className="bg-emerald-50 border-emerald-300" label={`${answeredCount} dijawab`} />
              <Legend className="bg-card border-border" label={`${unansweredCount} belum dijawab`} />
              <Legend className="bg-amber-50 border-amber-300" label={`${flagged.length} ditandai`} />
            </div>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 text-[11px] font-bold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Kumpulkan sekarang
            </button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <div className="flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> Aturan ujian
            </div>
            <ul className="mt-2 space-y-1.5 text-[10.5px] leading-snug text-muted-foreground">
              <li>• KKM {exam.passScore} · percobaan {exam.attemptsUsed ?? info.attemptsUsed}/{exam.maxAttempts ?? info.maxAttempts}</li>
              <li>• Tidak ada petunjuk atau koreksi sebelum submit.</li>
              <li>• Soal boleh dilewati dan dikembalikan nanti.</li>
              <li>• Jawaban tersimpan otomatis.</li>
            </ul>
          </div>
        </aside>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
            aria-label="Tutup konfirmasi"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lift">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-violet-600" />
              <h2 className="font-display text-lg font-extrabold">Kumpulkan ujian?</h2>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Setelah dikumpulkan, jawaban tidak bisa diubah dan pembahasan langsung terbuka.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Dijawab</div>
                <div className="font-mono-tech text-sm font-bold text-emerald-600">{answeredCount}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Kosong</div>
                <div className={cn("font-mono-tech text-sm font-bold", unansweredCount > 0 ? "text-rose-600" : "text-emerald-600")}>
                  {unansweredCount}
                </div>
              </div>
            </div>

            {flagged.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                <Flag className="h-3.5 w-3.5" /> {flagged.length} soal ditandai untuk ditinjau.
              </div>
            )}
            {unansweredCount > 0 && (
              <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Masih ada {unansweredCount} soal kosong.
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="inline-flex h-9 items-center rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                Periksa lagi
              </button>
              <button
                type="button"
                onClick={() => void submit(false)}
                disabled={submitting}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> {submitting ? "Mengirim…" : "Ya, kumpulkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-2.5 shadow-soft">
        <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <LayoutDashboard className="h-3.5 w-3.5 text-violet-500" /> Sesi resmi · autosave aktif
        </span>
        <span className="font-mono-tech text-[9.5px] font-bold text-muted-foreground">
          Sisa {clock(remaining)}
        </span>
      </div>
    </div>
  );
}

function RuleStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListChecks;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
      <div className="flex items-center gap-1.5 font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-400">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 font-display text-lg font-extrabold leading-none text-white">{value}</div>
    </div>
  );
}

function RuleLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
      <span>{children}</span>
    </li>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded border", className)} />
      <span>{label}</span>
    </div>
  );
}
