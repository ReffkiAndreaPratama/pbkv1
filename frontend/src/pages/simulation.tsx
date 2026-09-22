import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Lightbulb,
  Terminal,
  CircleCheck,
  CircleX,
  XCircle,
  Clock,
  Star,
  Signal,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatTime } from "@/lib/utils";
import type { SimNode, SimSubmitResponse, SimResult, CaseOption } from "@/lib/types";

interface AttemptLoad {
  status: string;
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
  const [result, setResult] = useState<{ success: boolean; score: SimResult; xpGained: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [moves, setMoves] = useState(0);

  const timerStart = useRef<number>(Date.now());

  // Load attempt
  const load = useCallback(async () => {
    try {
      const res = await api.get<AttemptLoad>(`/api/simulation/${attemptId}`);
      if (res.status !== "IN_PROGRESS" || !res.currentNode) {
        navigate("/cases");
        return;
      }
      setNode(res.currentNode);
      setSignals(res.signalState ?? {});
      timerStart.current = Date.now();
    } catch (e: any) {
      setError(e.message || "Gagal memuat simulasi.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (loading || result) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - timerStart.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [loading, result]);

  const submit = async (optionId: string) => {
    if (submitting || !node?.options) return;
    setSubmitting(true);
    setFeedback(null);
    setHint(null);
    try {
      const res = await api.post<SimSubmitResponse>(`/api/simulation/${attemptId}/submit`, { optionId });
      setMoves((m) => m + 1);
      if (!res.terminal && res.nextNode) {
        setNode(res.nextNode);
        setSignals(res.signalState ?? {});
        setFeedback(res.feedbackText ? { text: res.feedbackText, correct: !!node.options?.find((o) => o.optionId === optionId)?.isCorrect } : null);
      } else {
        // terminal
        setResult({ success: !!res.success, score: res.score!, xpGained: res.xpGained ?? 0 });
        setFeedback(res.feedbackText ? { text: res.feedbackText, correct: !!res.success } : null);
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

  const restart = () => {
    setNode(null);
    setResult(null);
    setHint(null);
    setFeedback(null);
    setMoves(0);
    setWrongCount(0);
    setHintCount(0);
    setLoading(true);
    void load();
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoaderText /></div>;
  if (error)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button variant="outline" asChild><Link to="/cases">Kembali ke kasus</Link></Button>
      </div>
    );

  if (!node) return null;

  // Terminal result screen
  if (result) return <ResultScreen result={result} moves={moves} elapsed={elapsed} onRestart={restart} onExit={() => navigate("/cases")} />;

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" onClick={() => { void abandon(); }}>
          <Link to="/cases">
            <ArrowLeft className="h-4 w-4" /> Keluar
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> {formatTime(elapsed)}</Badge>
          <Badge variant="info" className="gap-1"><Signal className="h-3 w-3" /> {moves} langkah</Badge>
          <Badge variant="warning" className="gap-1"><Lightbulb className="h-3 w-3" /> {hintCount} hint</Badge>
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
              <span>{feedback.text}</span>
            </div>
          )}
        </div>

        {/* Side panel: signals */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status Sistem</div>
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
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Skor saat ini</div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="font-display text-2xl font-extrabold">{Math.max(0, Math.round(50 + Math.max(0, (1 - wrongCount / Math.max(1, moves))) * 0 * moves))}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Skor akhir dihitung dari akurasi, efisiensi langkah, waktu, dan pengurangan hint (skor dasar 50).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function OptionCard({ option, disabled, onPick }: { option: CaseOption; disabled: boolean; onPick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onPick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-soft disabled:opacity-60"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono-tech text-sm font-bold text-foreground/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {option.label.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-snug group-hover:text-primary">{option.label}</div>
        {option.feedbackText && <div className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">Hmm… reaksi sistem akan terlihat</div>}
      </div>
    </button>
  );
}

function ResultScreen({ result, moves, elapsed, onRestart, onExit }: {
  result: { success: boolean; score: SimResult; xpGained: number };
  moves: number;
  elapsed: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const s = result.score;
  return (
    <div className="animate-fade-in-up mx-auto max-w-lg pt-10">
      <Card className="overflow-hidden">
        <div className={cn("px-6 py-8 text-center", result.success ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/10" : "bg-gradient-to-br from-rose-500/15 to-orange-500/10")}>
          <div className={cn("mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-lift",
            result.success ? "text-emerald-500" : "text-rose-500")}>
            {result.success ? <CircleCheck className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            {result.success ? "Simulasi Berhasil! 🎉" : "Simulasi Belum Berhasil"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.success ? "Langkahmu mengarah ke solusi yang benar. Kerja bagus!" : "Tenang — kegagalan adalah bagian dari diagnosis. Coba lagi!"}
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className={cn("h-6 w-6", i <= s.stars ? "fill-amber-400 text-amber-400" : "text-muted")} />
            ))}
          </div>
          <div className="mt-2 text-xs font-semibold text-muted-foreground">Nilai: {s.grade}</div>
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