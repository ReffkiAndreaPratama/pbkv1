import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { difficultyLabel, difficultyColor, cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";

interface QuizRunnerProps {
  title: string;
  subtitle: string;
  config: "PRETEST" | "POSTTEST" | "ADAPTIVE";
  skillId?: string | null;
  onBackHref: string;
}

interface StartRes { sessionId: string }
interface SubmitRes { score: number; correctCount: number; totalCount: number; passed?: boolean }

const CONFIG_META = {
  PRETEST: { start: "/api/quiz/pretest/start", submit: "/api/quiz/pretest/submit", desc: "10 soal pengukuran awal" },
  POSTTEST: { start: "/api/quiz/posttest/start", submit: "/api/quiz/posttest/submit", desc: "10 soal (4 mudah · 4 sedang · 2 sulit)", pass: 70 },
  ADAPTIVE: { start: "/api/quiz/adaptive/start", submit: "/api/quiz/adaptive/submit", desc: "5 soal mengikuti penguasaanmu" },
} as const;

export function QuizRunner({ title, subtitle, config, skillId, onBackHref }: QuizRunnerProps) {
  const navigate = useNavigate();
  const meta = CONFIG_META[config];

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selectedKeys: string[] }[]>([]);
  const [result, setResult] = useState<SubmitRes | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);

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
    return (
      <div className="animate-fade-in-up mx-auto max-w-lg pt-10">
        <Card className="overflow-hidden">
          <div className={cn("px-6 py-8 text-center", passed ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/10" : "bg-gradient-to-br from-rose-500/15 to-orange-500/10")}>
            <div className={cn("mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-lift", passed ? "text-emerald-500" : "text-rose-500")}>
              {passed ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <h1 className="font-display text-2xl font-extrabold">{passed ? "Kerja Bagus! 🎉" : "Tetap Semangat!"}</h1>
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
              <Button className="flex-1" onClick={() => navigate("/")}>Dashboard</Button>
            </div>
          </div>
        </Card>
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
    // Flash feedback without answer correctness known to client (server grades at end)
    setWrongFlash(null);
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
      toast.success("Kuis selesai!");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengirim jawaban.");
      setLocked(false);
    }
  };

  return (
    <div className="animate-fade-in">
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
        <div className="mb-4 flex gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < idx ? "bg-primary" : i === idx ? "bg-primary/70" : "bg-muted")} />
          ))}
        </div>

        <Card>
          <CardContent className="p-5 sm:p-7">
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
            <h2 className="font-display text-lg font-bold leading-snug sm:text-xl">{q.prompt}</h2>
            <div className="mt-2">
              <Badge className={difficultyColor(q.difficulty)}>{difficultyLabel(q.difficulty)}</Badge>
            </div>

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

            {wrongFlash && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{wrongFlash}</p>
            )}

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