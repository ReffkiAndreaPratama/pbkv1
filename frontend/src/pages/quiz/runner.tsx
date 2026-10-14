import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, BrainCircuit, Play } from "lucide-react";
import { toast } from "sonner";
import { api, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface StartRes { sessionId: string }

const CONFIG_META = {
  PRETEST: { start: "/api/quiz/pretest/start", submit: "/api/quiz/pretest/submit", desc: "10 soal pengukuran awal" },
  POSTTEST: { start: "/api/quiz/posttest/start", submit: "/api/quiz/posttest/submit", desc: "10 soal (4 mudah · 4 sedang · 2 sulit)", pass: 70 },
  ADAPTIVE: { start: "/api/quiz/adaptive/start", submit: "/api/quiz/adaptive/submit", desc: "10 soal yang menyesuaikan penguasaanmu" },
} as const;

const MODE_META = {
  PRETEST: {
    label: "PRETEST · Pengukuran Awal",
    question: "Ukur titik awalmu dengan 10 soal. Tidak ada lulus/gagal — hasilnya dipakai menyusun jalur belajarmu.",
    finishTitle: "Pengukuran Selesai! 📊",
    accent: "#2563eb",
    accentDim: "#93b4f0",
    soft: "#eff6ff",
  },
  ADAPTIVE: {
    label: "LATIHAN · Kuis Adaptif",
    question: "Soal menyesuaikan penguasaanmu. Jawab dengan tenang — pembahasan muncul setelah selesai.",
    finishTitle: "Latihan Selesai! 🎯",
    accent: "#059669",
    accentDim: "#6ee7b7",
    soft: "#ecfdf5",
  },
  POSTTEST: {
    label: "POSTTEST · Uji Akhir",
    question: "Uji pemahamanmu setelah materi & simulasi. Minimal kelulusan 70.",
    finishTitle: "Kuis Selesai! 🏆",
    accent: "#7c3aed",
    accentDim: "#c4b5fd",
    soft: "#f5f3ff",
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

  if (result && result.score !== undefined) {
    const passed = result.passed ?? result.score >= 70;
    const review = result.review ?? [];
    return (
      <div className="animate-fade-in-up mx-auto max-w-2xl pt-10">
        <Card className="overflow-hidden">
          <div className={cn("px-6 py-8 text-center", passed ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/10" : "bg-gradient-to-br from-rose-500/15 to-orange-500/10")}>
            <div className={cn("mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-lift", passed ? "text-emerald-500" : "text-rose-500")}>
              {passed ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <h1 className="font-display text-2xl font-extrabold">{passed ? mode.finishTitle : "Tetap Semangat!"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {config === "PRETEST" && "Hasil pretest caloni jalur belajarmu."}
              {config === "POSTTEST" && (passed ? "Kamu lulus posttest! 🏆" : "Skor minimal kelulusan: 70.")}
              {config === "ADAPTIVE" && "Hasilnya diperhitungkan ke penguasaan skillmu."}
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Skor</span>
              <span className="font-display text-4xl font-extrabold text-primary">{Math.round(result.score)}</span>
            </div>
            <div className="mt-2 text-center text-sm text-muted-foreground">
              {result.correctCount} dari {result.totalCount} jawaban benar
            </div>
            <div className="mt-5 flex gap-2">
              <Button asChild variant="outline" className="flex-1"><Link to={onBackHref}>Kembali</Link></Button>
              <Button className="flex-1" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            </div>
          </div>
        </Card>

        {review.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-1 font-display text-base font-bold">Pembahasan Jawaban</h2>
            <p className="mb-4 text-xs text-muted-foreground">Pelajari dari tiap jawaban untuk naikkan penguasaanmu.</p>
            <div className="space-y-3">
              {review.map((r, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
                    <span className="text-xs font-bold text-muted-foreground">Soal {i + 1}</span>
                    {r.isCorrect ? (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Benar</Badge>
                    ) : (
                      <Badge variant="danger" className="gap-1"><XCircle className="h-3 w-3" /> Salah</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold leading-snug">{r.prompt}</p>
                    <div className="mt-3 space-y-2">
                      {r.options.map((opt) => {
                        const isSelected = r.selectedKeys.includes(opt.key);
                        const isKey = r.correctKeys.includes(opt.key);
                        return (
                          <div
                            key={opt.key}
                            className={cn(
                              "flex items-start gap-2.5 rounded-xl border p-3",
                              isKey ? "border-emerald-300 bg-emerald-50/70" : isSelected ? "border-rose-300 bg-rose-50/70" : "border-border/60 bg-muted/20"
                            )}
                          >
                            <span className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                              isKey ? "bg-emerald-500 text-white" : isSelected ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                            )}>
                              {opt.key.toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium leading-snug">{opt.text}</p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {isKey && <span className="text-[10px] font-bold text-emerald-700">✓ Kunci jawaban</span>}
                                {isSelected && !isKey && <span className="text-[10px] font-bold text-rose-700">✗ Jawabanmu</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {r.explanation && (
                      <div className="mt-3 rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/80">
                        <span className="font-bold text-primary">Penjelasan: </span>{r.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!questions || !sessionId) return <PageLoader />;
  if (questions.length === 0)
    return (
      <EmptyState
        icon={<BrainCircuit className="h-6 w-6" />}
        title="Belum ada soal"
        description="Admin belum menambahkan soal untuk mode ini."
        action={<Button asChild variant="outline"><Link to={onBackHref}>Kembali</Link></Button>}
      />
    );

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const options = (q.options ?? []) as { key: string; text: string }[];

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

  return (
    <div className="animate-fade-in" style={{ ["--quiz-accent" as any]: mode.accent, ["--quiz-accent-dim" as any]: mode.accentDim }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={onBackHref}>
            <ArrowLeft className="h-4 w-4" /> Keluar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono-tech">{config}</Badge>
          <Badge>{(idx + 1)}/{questions.length}</Badge>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ background: mode.soft, borderColor: mode.accentDim }}>
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: mode.accent }}>
            <BrainCircuit className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: mode.accent }}>{mode.label}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{mode.question}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < idx ? "bg-[var(--quiz-accent)]" : i === idx ? "bg-[var(--quiz-accent-dim)]" : "bg-muted")} />
          ))}
        </div>

        <Card>
          <CardContent className="p-5 sm:p-7">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--quiz-accent)" }}>{mode.label}</div>
            {subtitle && <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            <h2 className="font-display text-lg font-bold leading-snug sm:text-xl">{q.prompt}</h2>
            <div className="mt-2">
              <Badge className={difficultyColor(q.difficulty)}>{difficultyLabel(q.difficulty)}</Badge>
            </div>

            {(q.imageUrl || q.videoUrl) && (
              <div className="mt-4 space-y-3">
                {q.imageUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <img src={q.imageUrl} alt="Ilustrasi pendukung soal" className="h-44 w-full object-cover sm:h-56" loading="lazy" />
                  </div>
                )}
                {q.videoUrl && embedVideoUrl(q.videoUrl) && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setVideoOpen((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"
                    >
                      <Play size={15} className="text-primary" />
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
              {options.map((opt) => (
                <button
                  key={opt.key}
                  disabled={locked}
                  onClick={() => toggle(opt.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                    selected.includes(opt.key)
                      ? "border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]"
                      : "border-border/70 bg-card hover:border-primary/30",
                    locked && "opacity-70"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                    selected.includes(opt.key) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                  )}>
                    {opt.key.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium leading-snug">{opt.text}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={submitAnswer} disabled={selected.length === 0 || locked} className="gap-1.5">
                {isLast ? "Selesaikan Kuis" : "Jawaban Berikutnya"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-3 h-0.5" />
        <p className="mt-4 text-center text-xs text-muted-foreground">{meta.desc}</p>
      </div>
    </div>
  );
}