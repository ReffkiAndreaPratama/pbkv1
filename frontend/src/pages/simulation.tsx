import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Lightbulb,
  Terminal,
  CircleCheck,
  CircleX,
  Star,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLeaveGuard } from "@/lib/use-leave-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, difficultyColor, difficultyLabel, formatTime } from "@/lib/utils";
import type { SimNode, SimSubmitResponse, SimResult, CaseOption, SimDebriefStep, SimDebrief } from "@/lib/types";

interface AttemptLoad {
  status: string;
  caseId?: string;
  caseTitle?: string;
  elapsedSec?: number;
  currentNode: SimNode;
  signalState: Record<string, string | boolean | number>;
}

export function SimulationPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [node, setNode] = useState<SimNode | null>(null);
  const [signals, setSignals] = useState<Record<string, string | boolean | number>>({});
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [hint, setHint] = useState<{ level: number; text: string; fullAnswer: boolean } | null>(null);
  const [result, setResult] = useState<{ success: boolean; score: SimResult; xpGained: number; debrief?: SimDebriefStep[] } | null>(null);
  const [completed, setCompleted] = useState<SimDebrief | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeline, setTimeline] = useState<SimDebriefStep[]>([]);
  const [caseTitle, setCaseTitle] = useState("Simulasi Kasus");
  const [caseId, setCaseId] = useState<string | null>(null);

  useLeaveGuard(!loading && result === null && completed === null);

  const timerStart = useRef<number>(Date.now());

  // Load attempt
  const load = useCallback(async () => {
    setLoading(true);
    setCompleted(null);
    try {
      const res = await api.get<AttemptLoad>(`/api/simulation/${attemptId}`);
      if (res.status !== "IN_PROGRESS" || !res.currentNode) {
        // Misi sudah selesai/ditinggalkan: tampilkan debrief, bukan lempar ke daftar.
        const debrief = await api.get<SimDebrief>(`/api/simulation/${attemptId}/debrief`);
        setCompleted(debrief);
        setCaseId(debrief.caseId);
        setCaseTitle(debrief.caseTitle ?? "Simulasi Kasus");
        return;
      }
      setNode(res.currentNode);
      setSignals(res.signalState ?? {});
      setCaseId(res.caseId ?? null);
      setCaseTitle(res.caseTitle ?? "Simulasi Kasus");
      const elapsedSec = res.elapsedSec ?? 0;
      timerStart.current = Date.now() - elapsedSec * 1000;
      setElapsed(elapsedSec);
    } catch (e: any) {
      setError(e.message || "Gagal memuat simulasi.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (loading || result || completed) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - timerStart.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [loading, result, completed]);

  const submit = async (optionId: string) => {
    if (submitting || !node?.options) return;
    setSubmitting(true);
    setFeedback(null);
    setHint(null);
    try {
      const chosen = node.options.find((o) => o.optionId === optionId);
      const res = await api.post<SimSubmitResponse>(`/api/simulation/${attemptId}/submit`, { optionId });
      const wasCorrect = !!res.wasCorrect;
      const step: SimDebriefStep = {
        step: timeline.length + 1,
        nodeKey: node.nodeKey,
        nodeText: node.text,
        nodeType: node.type,
        optionLabel: chosen?.label ?? "",
        wasCorrect,
        hintLevel: hintCount,
        at: new Date().toISOString(),
      };
      setMoves((m) => m + 1);
      if (!wasCorrect) setWrongCount((c) => c + 1);

      if (!res.terminal && res.nextNode) {
        setTimeline((prev) => [...prev, step]);
        setNode(res.nextNode);
        setSignals(res.signalState ?? {});
        setFeedback(res.feedbackText ? { text: res.feedbackText, correct: wasCorrect } : null);
      } else {
        // terminal
        setTimeline((prev) => [...prev, step]);
        setResult({
          success: !!res.success,
          score: res.score!,
          xpGained: res.xpGained ?? 0,
          debrief: res.debrief ?? [...timeline, step],
        });
        setFeedback(res.feedbackText ? { text: res.feedbackText, correct: wasCorrect } : null);
      }
    } catch (e: any) {
      toast.error(e.message || "Pilihan tidak valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestHint = async () => {
    if (hinting) return;
    setHinting(true);
    try {
      const res = await api.post<{ level: number; text: string; fullAnswer: boolean }>(`/api/simulation/${attemptId}/hint`);
      setHint(res);
      setHintCount((c) => c + 1);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat hint.");
    } finally {
      setHinting(false);
    }
  };

  const abandon = async () => {
    await api.post(`/api/simulation/${attemptId}/abandon`);
    navigate("/cases");
  };

  const startFresh = async () => {
    if (!caseId) {
      navigate("/cases");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ attemptId: string }>(`/api/cases/${caseId}/start`);
      setNode(null);
      setResult(null);
      setCompleted(null);
      setHint(null);
      setFeedback(null);
      setMoves(0);
      setWrongCount(0);
      setHintCount(0);
      setTimeline([]);
      setElapsed(0);
      timerStart.current = Date.now();
      navigate(`/simulation/${res.attemptId}`);
    } catch (e: any) {
      toast.error(e.message || "Gagal memulai misi baru.");
      setLoading(false);
    }
  };

  const restart = () => {
    void startFresh();
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoaderText /></div>;
  if (error)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button variant="outline" asChild><Link to="/cases">Kembali ke kasus</Link></Button>
      </div>
    );

  if (completed) {
    return <CompletedDebrief data={completed} onRestart={restart} onExit={() => navigate("/cases")} />;
  }

  if (!node) return null;

  const signalEntries = Object.entries(signals);
  const riskySignals = signalEntries.filter(
    ([, v]) => v === false || /fail|error|dead|burnt|short|missing|bad|off|rusak/i.test(String(v))
  ).length;
  const risk = signalEntries.length ? Math.round((riskySignals / signalEntries.length) * 100) : 0;
  const riskLabel = !signalEntries.length ? "BELUM ADA DATA" : risk >= 60 ? "KRITIS" : risk >= 30 ? "WASPADA" : "STABIL";
  const riskTone = !signalEntries.length ? "text-slate-300" : risk >= 60 ? "text-rose-300" : risk >= 30 ? "text-amber-300" : "text-emerald-300";

  // Terminal result screen
  if (result) return <ResultScreen result={result} moves={moves} elapsed={elapsed} onRestart={restart} onExit={() => navigate("/cases")} />;

  return (
    <div className="animate-fade-in">
      {/* Mission HUD */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" onClick={() => { void abandon(); }}>
            <Link to="/cases">
              <ArrowLeft className="h-4 w-4" /> Keluar
            </Link>
          </Button>
          <span className="flex items-center gap-1.5 font-mono-tech text-[10px] font-bold tracking-widest text-emerald-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden /> SIMULASI BERJALAN
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-lift">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/50 px-4 py-2.5">
            <span className="flex items-center gap-2 font-mono-tech text-[10px] font-bold tracking-[0.2em] text-sky-300">
              <Terminal className="h-3.5 w-3.5" /> MISI
            </span>
            <span className="truncate font-mono-tech text-sm font-bold">{caseTitle}</span>
            <span className="shrink-0 font-mono-tech text-[10px] text-slate-400">{node.type === "ACTION" ? "AKSI" : "DIAGNOSIS"}</span>
          </div>
          <div className="grid grid-cols-5 divide-x divide-white/10 text-center">
            <HudCell label="Langkah" value={String(moves)} />
            <HudCell label="Time" value={formatTime(elapsed)} />
            <HudCell label="Sinyal" value={String(signalEntries.length)} />
            <div className="px-2 py-2.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Risiko</div>
              <div className={cn("mt-0.5 font-mono-tech text-sm font-extrabold", riskTone)}>{risk}%</div>
            </div>
            <HudCell label="Hint" value={`${hintCount}/4`} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Node content */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-primary">Mode: {node.type === "ACTION" ? "Tindakan" : "Diagnosis"}</span>
              </div>
              <h2 className="font-display text-lg font-bold leading-snug">{node.text}</h2>
              {node.detail && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{node.detail}</p>}
            </CardContent>
          </Card>

          {/* Options */}
          <div className="space-y-2.5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Pilih langkahmu</div>
            {(node.options ?? []).map((o) => <OptionCard key={o.optionId} option={o} disabled={submitting} onPick={() => void submit(o.optionId)} />)}
            {(node.options ?? []).length === 0 && (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Tidak ada opsi — lanjutkan ke langkah berikutnya.</p>
            )}
          </div>

          {/* Hint */}
          <div className="flex items-center justify-between rounded-2xl border border-amber-300/40 bg-amber-50/70 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-amber-800">Buntu? Gunakan hint bertahap.</span>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => void requestHint()} disabled={hinting}>
              💡 Petunjuk
            </Button>
          </div>

          {hint && (
            <div className="animate-fade-in rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Hint level {hint.level}/4</Badge>
                {hint.fullAnswer && <Badge variant="warning" className="text-[10px]">Jawaban ditampilkan</Badge>}
              </div>
              <p className="text-sm leading-relaxed">{hint.text}</p>
            </div>
          )}

          {feedback && (
            <div className={cn("animate-fade-in flex items-start gap-2 rounded-2xl border p-4 text-sm",
              feedback.correct ? "border-emerald-300/40 bg-emerald-50 text-emerald-800" : "border-rose-300/40 bg-rose-50 text-rose-800")}>
              {feedback.correct ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] opacity-70">
                  Konsekuensi · {feedback.correct ? "sinyal membaik" : "sinyal memburuk"}
                </div>
                <span>{feedback.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* Side panel: signals */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status Sistem</div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-[9.5px] font-semibold text-muted-foreground">
                  <span>Risiko sistem</span>
                  <span className={cn("font-mono-tech font-bold", risk >= 60 ? "text-rose-600" : risk >= 30 ? "text-amber-600" : "text-emerald-600")}>
                    {riskLabel}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", risk >= 60 ? "bg-rose-500" : risk >= 30 ? "bg-amber-400" : "bg-emerald-500")}
                    style={{ width: `${signalEntries.length ? Math.max(3, risk) : 3}%` }}
                  />
                </div>
              </div>
              {Object.keys(signals).length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada sinyal terpantau.</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(signals).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-lg bg-muted px-2.5 py-1.5 font-mono-tech text-xs">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={cn("font-bold", String(v).toLowerCase() === "ok" || v === true ? "text-emerald-600" : "text-amber-600")}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Telemetri Misi</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Langkah diambil</span>
                  <span className="font-mono-tech font-bold">{moves}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Akurasi langkah</span>
                  <span className={cn("font-mono-tech font-bold", moves && wrongCount / moves > 0.4 ? "text-rose-600" : "text-emerald-600")}>
                    {moves ? Math.round((1 - wrongCount / moves) * 100) : 100}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hint dipakai</span>
                  <span className="font-mono-tech font-bold">{hintCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Waktu</span>
                  <span className="font-mono-tech font-bold">{formatTime(elapsed)}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Skor akhir dihitung dari akurasi, efisiensi langkah, waktu, dan penalti hint (skor dasar 50).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HudCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-0.5 font-mono-tech text-sm font-extrabold text-white">{value}</div>
    </div>
  );
}

function OptionCard({ option, disabled, onPick }: { option: CaseOption; disabled: boolean; onPick: () => void }) {
  const locked = option.available === false;
  return (
    <button
      disabled={disabled || locked}
      onClick={onPick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-soft disabled:opacity-60",
        locked && "cursor-not-allowed border-dashed bg-muted/30 hover:border-border/70 hover:shadow-none"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono-tech text-sm font-bold text-foreground/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {option.label.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug group-hover:text-primary">{option.label}</div>
        {locked && (
          <div className="mt-0.5 text-[10.5px] font-semibold text-muted-foreground">
            Terkunci — sinyal perangkat belum mendukung langkah ini.
          </div>
        )}
      </div>
    </button>
  );
}

const GRADE_META: Record<string, { label: string; head: string }> = {
  S: { label: "Misi Sempurna", head: "Diagnosis Presisi! 🏆" },
  A: { label: "Diagnosis Presisi", head: "Simulasi Berhasil! 🎉" },
  B: { label: "Solusi Akurat", head: "Simulasi Berhasil! 🎉" },
  C: { label: "Cukup Baik", head: "Misi Berhasil! ✅" },
  D: { label: "Perlu Latihan Lagi", head: "Misi Belum Sempurna" },
};

function ResultScreen({ result, moves, elapsed, onRestart, onExit }: {
  result: { success: boolean; score: SimResult; xpGained: number; debrief?: SimDebriefStep[] };
  moves: number;
  elapsed: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const s = result.score;
  const grade = GRADE_META[s.grade] ?? GRADE_META.D;
  const debrief = result.debrief ?? [];
  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl pt-6">
      <Card className="overflow-hidden">
        <div className={cn("px-6 py-8 text-center", result.success ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/10" : "bg-gradient-to-br from-rose-500/15 to-orange-500/10")}>
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 shadow-lift ring-4 ring-white/40">
            <span className="font-display text-4xl font-extrabold text-white">{s.grade}</span>
          </div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{grade.label}</div>
          <h1 className="font-display text-2xl font-extrabold">
            {result.success ? grade.head : "Simulasi Belum Berhasil"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.success ? "Langkahmu mengarah ke solusi yang benar. Kerja bagus!" : "Tenang — kegagalan adalah bagian dari diagnosis. Coba lagi!"}
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className={cn("h-6 w-6", i <= s.stars ? "fill-amber-400 text-amber-400" : "text-muted")} />
            ))}
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Skor</span>
            <span className="font-display text-3xl font-extrabold text-primary">{s.score}</span>
          </div>
          <div className="h-px bg-border" />
          <MetricRow label="Akurasi" value={`${Math.round(s.accuracy * 100)}%`} />
          <MetricRow label="Efisiensi" value={`${Math.round(s.efficiency * 100)}%`} />
          <MetricRow label="Waktu" value={formatTime(elapsed)} />
          <MetricRow label="Penalti hint" value={`-${s.hintPenalty} poin`} />
          <MetricRow label="Total langkah" value={`${moves}`} />
          <div className="mt-1 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2.5">
            <span className="text-sm font-semibold">XP diperoleh</span>
            <span className="font-display text-lg font-extrabold text-primary">+{result.xpGained} XP</span>
          </div>
        </div>

        <DebriefTimeline steps={debrief} />

        <div className="flex gap-2 px-6 pb-6">
          <Button className="flex-1" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> Coba Lagi
          </Button>
          <Button variant="outline" className="flex-1" onClick={onExit}>
            Kembali ke Kasus
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Timeline langkah yang dipakai ulang di layar hasil dan riwayat misi. */
function DebriefTimeline({ steps }: { steps: SimDebriefStep[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="border-t border-border px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Debrief misi
          </div>
          <h2 className="mt-0.5 font-display text-base font-extrabold">Timeline langkahmu</h2>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono-tech text-[9px] font-bold text-muted-foreground">
          {steps.length} langkah
        </span>
      </div>

      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.step} className="flex gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-2.5">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono-tech text-[9px] font-bold",
                step.wasCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}
            >
              {step.step}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {step.nodeText}
              </div>
              <div className="text-[11.5px] font-semibold leading-snug text-slate-700">{step.optionLabel}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9.5px] text-muted-foreground">
                <span className={step.wasCorrect ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>
                  {step.wasCorrect ? "Langkah tepat" : "Langkah berisiko"}
                </span>
                {step.hintLevel > 0 && <span>· hint level {step.hintLevel}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Layar debrief untuk misi yang sudah selesai dan dibuka kembali dari riwayat. */
function CompletedDebrief({ data, onRestart, onExit }: { data: SimDebrief; onRestart: () => void; onExit: () => void }) {
  const success = data.success === true;
  const abandoned = data.status === "ABANDONED";
  const accuracy = data.accuracy !== null ? Math.round(data.accuracy * 100) : null;

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl pt-6">
      <Card className="overflow-hidden">
        <div
          className={cn(
            "px-6 py-7",
            success ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/10" : "bg-gradient-to-br from-slate-500/15 to-slate-400/10"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lift ring-4 ring-white/50",
                success ? "bg-emerald-500 text-white" : "bg-slate-700 text-white"
              )}
            >
              {success ? <CircleCheck className="h-7 w-7" /> : <CircleX className="h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {abandoned ? "Misi ditinggalkan" : success ? "Misi selesai" : "Misi belum berhasil"}
              </div>
              <h1 className="mt-1 font-display text-xl font-extrabold leading-snug">{data.caseTitle}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-mono-tech font-bold text-violet-600">{data.skill.code}</span>
                <span>·</span>
                <span>{data.skill.name}</span>
                <span>·</span>
                <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", difficultyColor(data.difficulty))}>
                  {difficultyLabel(data.difficulty)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Skor</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{Math.round(data.score ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Akurasi</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{accuracy !== null ? `${accuracy}%` : "—"}</div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Waktu</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{data.timeSec !== null ? formatTime(data.timeSec) : "—"}</div>
            </div>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            Debrief ini tersimpan permanen. Bandingkan langkahmu dengan solusi paling efisien, lalu ulangi misi untuk
            memperbaiki akurasi dan waktu.
          </p>
        </div>

        <DebriefTimeline steps={data.timeline} />

        <div className="flex gap-2 px-6 py-5">
          <Button className="flex-1" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> Ulangi misi
          </Button>
          <Button variant="outline" className="flex-1" onClick={onExit}>
            Kembali ke Kasus
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function LoaderText() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Memuat simulasi…
    </div>
  );
}