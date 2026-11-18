import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Lightbulb,
  LogOut,
  RotateCcw,
  Save,
  Star,
  Terminal,
  X,
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
  targetSteps?: number;
  expectedTimeSec?: number;
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
  const [targetSteps, setTargetSteps] = useState<number | null>(null);
  const [expectedTimeSec, setExpectedTimeSec] = useState<number | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

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
        setTargetSteps(debrief.targetSteps ?? null);
        setExpectedTimeSec(debrief.expectedTimeSec ?? null);
        return;
      }
      setNode(res.currentNode);
      setSignals(res.signalState ?? {});
      setCaseId(res.caseId ?? null);
      setCaseTitle(res.caseTitle ?? "Simulasi Kasus");
      setTargetSteps(res.targetSteps ?? null);
      setExpectedTimeSec(res.expectedTimeSec ?? null);
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

  useEffect(() => {
    if (!exitOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExitOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitOpen]);

  const submit = async (optionId: string) => {
    if (submitting || !node?.options) return;
    setSubmitting(true);
    setFeedback(null);
    setHint(null);
    try {
      const chosen = node.options.find((o) => o.optionId === optionId);
      const res = await api.post<SimSubmitResponse>(`/api/simulation/${attemptId}/submit`, {
        optionId,
        hintLevel: hint?.level ?? 0,
      });
      const wasCorrect = !!res.wasCorrect;
      const step: SimDebriefStep = {
        step: timeline.length + 1,
        nodeKey: node.nodeKey,
        nodeText: node.text,
        nodeType: node.type,
        optionLabel: chosen?.label ?? "",
        wasCorrect,
        hintLevel: hint?.level ?? 0,
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
      setHintCount(res.level);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat hint.");
    } finally {
      setHinting(false);
    }
  };

  const abandon = async () => {
    setLeaving(true);
    try {
      await api.post(`/api/simulation/${attemptId}/abandon`);
      navigate("/cases");
    } catch (e: any) {
      toast.error(e.message || "Gagal meninggalkan misi.");
      setLeaving(false);
    }
  };

  /** Keluar tanpa menutup misi: seluruh langkah sudah tersimpan di server. */
  const saveAndExit = () => {
    setExitOpen(false);
    navigate("/cases");
  };

  const startFresh = async () => {
    if (!caseId) {
      navigate("/cases");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ attemptId: string }>(`/api/cases/${caseId}/start`, { fresh: true });
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
  if (result) return (
    <ResultScreen
      result={result}
      moves={moves}
      elapsed={elapsed}
      targetSteps={targetSteps}
      expectedTimeSec={expectedTimeSec}
      onRestart={restart}
      onExit={() => navigate("/cases")}
    />
  );

  return (
    <div className="animate-fade-in">
      {/* Mission HUD */}
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setExitOpen(true)}>
            <ArrowLeft className="h-4 w-4" /> Keluar
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
            <HudCell label="Langkah" value={targetSteps ? `${moves}/${targetSteps}` : String(moves)} />
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

      {exitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="animate-fade-in-up w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-amber-600">
                  Keluar dari misi
                </div>
                <h2 className="mt-0.5 font-display text-lg font-extrabold">Simpan progresmu?</h2>
              </div>
              <button
                type="button"
                onClick={() => setExitOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 px-5 py-4">
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Semua langkah dan sinyal sudah tersimpan otomatis. Kamu bisa melanjutkan misi ini kapan saja dari
                halaman Kasus tanpa kehilangan progres.
              </p>
              <button
                type="button"
                onClick={saveAndExit}
                disabled={leaving}
                className="flex w-full items-center gap-3 rounded-xl border border-emerald-300/60 bg-emerald-50 p-3 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-100 disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <Save className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-bold text-emerald-900">Simpan &amp; keluar</span>
                  <span className="block text-[10.5px] text-emerald-800">
                    Misi tetap berjalan dan bisa dilanjutkan nanti.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => void abandon()}
                disabled={leaving}
                className="flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left transition-colors hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white">
                  <LogOut className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-bold text-rose-900">Tinggalkan misi</span>
                  <span className="block text-[10.5px] text-rose-800">
                    Akhiri misi ini dengan skor 0. Riwayatnya tetap tersimpan.
                  </span>
                </span>
              </button>
            </div>

            <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => setExitOpen(false)} disabled={leaving}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <span className="font-mono-tech font-bold">
                    {moves}
                    {targetSteps ? <span className="text-muted-foreground">/{targetSteps}</span> : null}
                  </span>
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
                  <span className="font-mono-tech font-bold">
                    {formatTime(elapsed)}
                    {expectedTimeSec ? <span className="text-muted-foreground"> / {formatTime(expectedTimeSec)}</span> : null}
                  </span>
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

function ResultScreen({ result, moves, elapsed, targetSteps, expectedTimeSec, onRestart, onExit }: {
  result: { success: boolean; score: SimResult; xpGained: number; debrief?: SimDebriefStep[] };
  moves: number;
  elapsed: number;
  targetSteps: number | null;
  expectedTimeSec: number | null;
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
          <MetricRow label="Langkah" value={targetSteps ? `${moves} / ${targetSteps} target` : `${moves}`} />
          <MetricRow label="Waktu" value={formatTime(elapsed)} />
          {expectedTimeSec ? <MetricRow label="Target waktu" value={formatTime(expectedTimeSec)} /> : null}
          <MetricRow label="Penalti hint" value={`-${s.hintPenalty} poin`} />
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
  const moves = data.totalMoves ?? data.timeline.length;
  const wrongMoves = data.wrongMoves ?? data.timeline.filter((s) => !s.wasCorrect).length;
  const targetSteps = data.targetSteps ?? null;
  const expectedTimeSec = data.expectedTimeSec ?? null;
  const hintsUsed = data.hintsUsed ?? 0;
  const extraSteps = targetSteps ? Math.max(0, moves - targetSteps) : null;
  const timeDelta = expectedTimeSec && data.timeSec !== null ? data.timeSec - expectedTimeSec : null;

  const verdict = abandoned
    ? "Misi dihentikan sebelum selesai. Langkah yang sudah diambil tetap tercatat sebagai bahan evaluasi."
    : success
      ? extraSteps === 0 && (timeDelta ?? 0) <= 0
        ? "Rute optimal: langkahmu seefisien solusi terbaik dan selesai di bawah target waktu."
        : extraSteps === 0
          ? `Rute sudah efisien, tetapi waktu ${formatTime(Math.abs(timeDelta ?? 0))} lebih lama dari target.`
          : `Misi berhasil, tetapi ${extraSteps} langkah di atas rute optimal. Pelajari timeline untuk memangkas langkah.`
      : "Misi belum berhasil. Bandingkan langkah berisiko di timeline dengan konsekuensi sinyal, lalu ulangi misi.";

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

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Skor</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{Math.round(data.score ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Akurasi</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{accuracy !== null ? `${accuracy}%` : "—"}</div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Langkah</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">
                {moves}
                {targetSteps ? <span className="text-[11px] font-bold text-muted-foreground">/{targetSteps}</span> : null}
              </div>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-muted-foreground">Waktu</div>
              <div className="mt-0.5 font-display text-xl font-extrabold text-slate-900">{data.timeSec !== null ? formatTime(data.timeSec) : "—"}</div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DebriefStat label="Hint dipakai" value={`${hintsUsed}`} tone={hintsUsed > 0 ? "warn" : "ok"} />
            <DebriefStat label="Langkah berisiko" value={`${wrongMoves}`} tone={wrongMoves > 0 ? "bad" : "ok"} />
            <DebriefStat label="Target langkah" value={targetSteps ? `${targetSteps}` : "—"} />
            <DebriefStat
              label="Target waktu"
              value={expectedTimeSec ? formatTime(expectedTimeSec) : "—"}
              tone={timeDelta !== null && timeDelta > 0 ? "warn" : undefined}
            />
          </div>

          <p className="mt-3 rounded-xl border border-white/60 bg-white/60 px-3 py-2 text-[11.5px] leading-relaxed text-slate-700 backdrop-blur-sm">
            {verdict}
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

function DebriefStat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className="rounded-lg border border-white/50 bg-white/50 px-2.5 py-1.5 backdrop-blur-sm">
      <div className="font-mono-tech text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono-tech text-[13px] font-extrabold",
          tone === "bad" ? "text-rose-600" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "text-slate-800"
        )}
      >
        {value}
      </div>
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