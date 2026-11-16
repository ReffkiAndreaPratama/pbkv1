import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Cable,
  CheckCircle2,
  CircuitBoard,
  Clock,
  Cpu,
  Eye,
  Flame,
  Gauge,
  Heart,
  HelpCircle,
  Keyboard,
  Laptop,
  Lightbulb,
  MonitorCog,
  Play,
  Power,
  RefreshCw,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { playSound, isSoundMuted, toggleSoundMuted } from "@/lib/sound";
import { useLeaveGuard } from "@/lib/use-leave-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeviceChassis } from "@/components/repair/device-chassis";
import { RepairTutorial, markRepairTutorialSeen } from "@/components/repair/repair-tutorial";
import { componentIcon } from "@/components/repair/component-icons";
import { cn, difficultyColor, difficultyLabel } from "@/lib/utils";
import type {
  RepairActionResponse,
  RepairAttemptState,
  RepairDeviceType,
  RepairEvent,
  RepairFixType,
  RepairResult,
  RepairTool,
} from "@/lib/types";

// ---------------------------------------------------------------- config
const TOOLS: { key: RepairTool; label: string; short: string; desc: string; icon: LucideIcon; hint: string }[] = [
  { key: "VISUAL", label: "Inspeksi Visual", short: "Inspeksi", desc: "Cek kondisi fisik komponen", icon: Eye, hint: "1" },
  { key: "MULTIMETER", label: "Multimeter", short: "Multimeter", desc: "Ukur tegangan & kontinuitas", icon: Gauge, hint: "2" },
  { key: "POST_CARD", label: "POST Card", short: "POST", desc: "Baca kode diagnostik POST", icon: Cpu, hint: "3" },
  { key: "SOFTWARE", label: "Diagnostik Software", short: "Software", desc: "SMART / device manager", icon: Terminal, hint: "4" },
];

const FIXES: { key: RepairFixType; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "REPLACE", label: "Ganti Komponen", desc: "Tukar dengan spare part", icon: RefreshCw },
  { key: "RESEAT", label: "Reseat", desc: "Lepas & pasang ulang", icon: Wrench },
  { key: "CLEAN", label: "Bersihkan", desc: "Bersihkan debu / korosi", icon: Sparkles },
  { key: "RECONNECT", label: "Sambung Ulang", desc: "Cabut & colok kabel", icon: Cable },
];

function formatClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function deviceLabel(deviceType: RepairDeviceType): string {
  return deviceType === "LAPTOP" ? "Laptop" : "PC";
}

// ---------------------------------------------------------------- page
export function RepairPlayPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<RepairAttemptState | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: number; event: RepairEvent }[]>([]);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(() => isSoundMuted());
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const timeoutRef = useRef(false);
  const eventId = useRef(0);

  const selected = state?.components.find((c) => c.key === selectedKey) ?? null;
  const done = state ? state.status !== "IN_PROGRESS" : false;

  useLeaveGuard(!loading && !result && state?.status === "IN_PROGRESS");

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key);
    playSound("select");
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      window.setTimeout(() => {
        document.getElementById("diagnosis-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, []);

  const toggleMute = () => {
    const next = toggleSoundMuted();
    setMuted(next);
    if (!next) playSound("select");
  };

  // load attempt
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    setEvents([]);
    setSelectedKey(null);
    timeoutRef.current = false;
    api
      .get<{ state: RepairAttemptState; result?: RepairResult }>(`/api/repair/attempts/${attemptId}`)
      .then((res) => {
        if (cancelled) return;
        setState(res.state);
        setTimeLeft(res.state.timeLeftSec);
        if (res.result) setResult(res.result);
        const first = res.state.components.find((c) => !c.fixed);
        if (first) setSelectedKey(first.key);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || "Gagal memuat sesi perbaikan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  // resync countdown when server state changes
  const stateId = state?.id ?? null;
  const stateStatus = state?.status ?? null;
  const stateTimeLeft = state?.timeLeftSec ?? null;

  useEffect(() => {
    if (stateTimeLeft !== null) setTimeLeft(stateTimeLeft);
  }, [stateTimeLeft, stateId]);

  // tick
  useEffect(() => {
    if (stateStatus !== "IN_PROGRESS" || result) return;
    const t = setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [stateId, stateStatus, result]);

  const act = useCallback(
    async (payload: Record<string, unknown>) => {
      if (busy || !state || result || state.status !== "IN_PROGRESS") return;
      setBusy(true);
      try {
        const res = await api.post<RepairActionResponse>(`/api/repair/attempts/${state.id}/action`, payload);
        setState(res.state);
        setTimeLeft(res.state.timeLeftSec);
        eventId.current += 1;
        setEvents((prev) => [{ id: eventId.current, event: res.event }, ...prev].slice(0, 24));
        if (res.result) {
          setResult(res.result);
          playSound(res.result.success ? "win" : "lose");
          if (res.result.success) toast.success(`${deviceLabel(res.state.job.deviceType)} berhasil diperbaiki! 🎉`);
          else toast.error("Misi perbaikan gagal.");
        } else if (res.event.kind === "HEART_LOST") {
          playSound("wrong");
          toast.error(res.event.title, { description: res.event.message, duration: 6000 });
        } else if (res.event.kind === "FIX") {
          playSound("fix");
          toast.success(res.event.title, { description: res.event.message });
        } else if (res.event.kind === "INSPECT" || res.event.kind === "TEST") {
          playSound("inspect");
        } else if (res.event.kind === "INFO") {
          toast.info(res.event.title, { description: res.event.message });
        }
      } catch (e: any) {
        toast.error(e.message || "Aksi gagal diproses.");
      } finally {
        setBusy(false);
      }
    },
    [busy, state, result]
  );

  // auto timeout
  useEffect(() => {
    if (!state || state.status !== "IN_PROGRESS" || result || timeLeft > 0) return;
    if (timeoutRef.current) return;
    timeoutRef.current = true;
    void act({ type: "TIMEOUT" });
  }, [timeLeft, state, result, act]);

  // keyboard shortcuts: 1-4 alat, P tes nyala
  useEffect(() => {
    if (!state || state.status !== "IN_PROGRESS" || result || busy || tutorialOpen || !selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = e.key.toLowerCase();
      if (key === "p") {
        e.preventDefault();
        void act({ type: "POWER_TEST" });
        return;
      }
      const tool = TOOLS.find((t) => t.hint === key);
      if (!tool) return;
      e.preventDefault();
      if (tool.key === "VISUAL") void act({ type: "INSPECT", componentKey: selected.key });
      else void act({ type: "TEST", componentKey: selected.key, tool: tool.key });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, result, busy, tutorialOpen, selected, act]);

  const restart = async () => {
    if (!state) return;
    try {
      const res = await api.post<{ state: RepairAttemptState }>(`/api/repair/jobs/${state.job.id}/start`);
      navigate(`/repair/${res.state.id}`, { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Gagal mengulang misi.");
    }
  };

  const exit = async () => {
    if (!state) return;
    if (state.status === "IN_PROGRESS" && !result) {
      const ok = window.confirm("Keluar dari misi? Progres perbaikan akan hilang.");
      if (!ok) return;
      try {
        await api.post(`/api/repair/attempts/${state.id}/abandon`);
      } catch {
        /* ignore */
      }
    }
    navigate("/repair");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Menyiapkan meja kerja…
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-destructive">{error ?? "Sesi tidak ditemukan."}</p>
        <Button variant="outline" asChild>
          <Link to="/repair">Kembali ke Bengkel</Link>
        </Button>
      </div>
    );
  }

  const progressPct = state.faultsTotal ? Math.round((state.faultsFixed / state.faultsTotal) * 100) : 0;
  const timePct = state.job.timeLimitSec > 0 ? Math.max(0, Math.min(1, timeLeft / state.job.timeLimitSec)) : 0;
  const lowTime = timeLeft <= 30;
  const isLaptop = state.job.deviceType === "LAPTOP";

  return (
    <div className="animate-fade-in space-y-4">
      {/* ---------------------------------------------------------- top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => void exit()} className="-ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Keluar bengkel
        </Button>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-emerald-700 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden /> Sesi aktif
          </span>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Nyalakan efek suara" : "Matikan efek suara"}
            title={muted ? "Nyalakan efek suara" : "Matikan efek suara"}
            className="rounded-lg border border-border/70 bg-card p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            aria-label="Buka cara main"
            title="Cara main"
            className="rounded-lg border border-border/70 bg-card p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- HUD control deck */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        {/* header */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] ring-1 ring-white/10">
              {isLaptop ? <Laptop className="h-5 w-5 text-sky-300" /> : <MonitorCog className="h-5 w-5 text-emerald-300" />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <Wrench className="h-3 w-3 text-emerald-300" /> Tiket perbaikan
                <span className="text-slate-600">·</span>
                <span className="text-emerald-300">{state.job.skill.code}</span>
                <span className="text-slate-600">·</span>
                <span>{deviceLabel(state.job.deviceType)}</span>
              </div>
              <h1 className="truncate font-display text-sm font-extrabold leading-tight sm:text-base">{state.job.title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge className={cn(difficultyColor(state.job.difficulty), "border-0 text-[10px]")}>
              {difficultyLabel(state.job.difficulty)}
            </Badge>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-slate-300">
              {state.actions} aksi
            </span>
          </div>
        </div>

        {/* metrics */}
        <div className="relative grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[auto_1fr]">
          {/* timer ring */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <div className="relative h-[74px] w-[74px] shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={201}
                  strokeDashoffset={201 - 201 * timePct}
                  className={cn(
                    "transition-all duration-700 ease-linear",
                    lowTime ? "text-rose-400" : timePct < 0.5 ? "text-amber-300" : "text-emerald-400"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "font-mono-tech text-base font-extrabold tabular-nums leading-none",
                    lowTime ? "animate-pulse text-rose-400" : "text-white"
                  )}
                >
                  {formatClock(timeLeft)}
                </span>
                <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">sisa</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <Clock className="h-3 w-3 text-sky-400" /> Waktu
              </div>
              <div className="mt-1 font-mono-tech text-[10px] text-slate-400">
                {state.elapsedSec > 0 ? `${formatClock(state.elapsedSec)} terpakai` : "baru dimulai"}
              </div>
              <div className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", lowTime ? "bg-rose-400" : "bg-sky-400")}
                  style={{ width: `${Math.max(2, timePct * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* hearts */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-rose-400" /> Nyawa
                </span>
                <span className="font-mono-tech text-rose-200">
                  {state.hearts}/{state.job.maxHearts}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: state.job.maxHearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      i < state.hearts ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" : "text-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* combo */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-amber-400" /> Combo
                </span>
                <span className="font-mono-tech text-slate-500">maks ×{state.maxCombo}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={cn(
                    "font-mono-tech text-xl font-extrabold leading-none",
                    state.combo > 0 ? "text-amber-300" : "text-slate-600"
                  )}
                >
                  ×{state.combo}
                </span>
                {state.combo >= 2 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-amber-300">
                    <Zap className="h-2.5 w-2.5" /> on fire
                  </span>
                )}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, state.combo * 20)}%` }}
                />
              </div>
            </div>

            {/* repair progress */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Wrench className="h-3 w-3 text-emerald-400" /> Perbaikan
                </span>
                <span className="font-mono-tech text-emerald-300">
                  {state.faultsFixed}/{state.faultsTotal}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-xl font-extrabold leading-none">{progressPct}</span>
                <span className="text-[10px] font-bold text-slate-500">%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                  style={{ width: `${Math.max(2, progressPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* symptom */}
        <div className="relative flex items-start gap-2 border-t border-white/10 px-4 py-2.5 text-[11px] leading-relaxed text-slate-300 sm:px-5">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>
            <span className="font-bold uppercase tracking-widest text-slate-500">Gejala: </span>
            {state.job.symptom}
          </span>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        {/* ---------------------------------------------------------- workbench */}
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CircuitBoard className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Meja kerja</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {deviceLabel(state.job.deviceType)} · {state.components.length} komponen
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                <Keyboard className="h-3 w-3" /> 1–4 alat · P tes nyala
              </span>
            </div>
            <div className="p-3 sm:p-4">
              <DeviceChassis
                deviceType={state.job.deviceType}
                components={state.components}
                selectedKey={selectedKey}
                disabled={done}
                onSelect={handleSelect}
              />
            </div>
          </div>

          {/* power test */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white shadow-soft">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-300/30 blur-2xl" aria-hidden />
            <div className="relative flex flex-col items-center gap-3 p-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-[0_8px_18px_-8px_rgba(5,150,105,0.9)]">
                  <Power className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-sm font-extrabold text-emerald-950">Sudah yakin semua beres?</div>
                  <p className="mt-0.5 max-w-md text-[11.5px] leading-relaxed text-emerald-900/70">
                    Nyalakan {isLaptop ? "laptop" : "PC"} untuk menguji hasil kerja. Kalau masih ada kerusakan, nyawa berkurang.
                  </p>
                </div>
              </div>
              <Button
                className="w-full shrink-0 bg-emerald-600 shadow-none hover:bg-emerald-700 sm:w-auto"
                onClick={() => void act({ type: "POWER_TEST" })}
                disabled={busy || done}
              >
                <Power className="h-4 w-4" /> Tes Nyala
                <kbd className="ml-1 rounded border border-white/30 bg-white/15 px-1 font-mono-tech text-[9px]">P</kbd>
              </Button>
            </div>
          </div>

          {/* console log */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1424] shadow-soft">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  diagnostic.log
                </span>
              </div>
              <span className="font-mono-tech text-[9.5px] text-slate-500">{events.length} entri</span>
            </div>
            <div className="max-h-72 overflow-y-auto p-3">
              {events.length === 0 ? (
                <p className="px-1 py-5 text-center font-mono-tech text-[11px] text-slate-500">
                  <span className="text-emerald-400">$</span> menunggu tindakan
                  <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-emerald-400 align-middle" />
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {events.map(({ id, event }) => (
                    <LogRow key={id} event={event} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- diagnosis */}
        <div id="diagnosis-panel" className="scroll-mt-4 xl:sticky xl:top-20 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-emerald-300">
                  <Gauge className="h-4 w-4" />
                </span>
                <div>
                  <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Panel diagnosis
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {selected ? "Komponen terpilih" : "Belum ada komponen"}
                  </div>
                </div>
              </div>
              {selected && (
                <Badge
                  variant={selected.fixed ? "success" : selected.inspected ? "info" : "secondary"}
                  className="text-[9px]"
                >
                  {selected.fixed ? "Beres" : selected.inspected ? "Diinspeksi" : "Belum dicek"}
                </Badge>
              )}
            </div>

            {selected ? (
              <div className="space-y-3.5 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                      selected.fixed
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : selected.inspected
                          ? "bg-sky-50 text-sky-700 ring-sky-200"
                          : "bg-muted text-muted-foreground ring-border"
                    )}
                  >
                    {(() => {
                      const Icon = componentIcon(selected);
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-extrabold leading-snug">{selected.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="font-mono-tech text-[9px]">
                        {selected.category}
                      </Badge>
                      <span className="text-[9.5px] text-muted-foreground">{selected.slot}</span>
                    </div>
                  </div>
                </div>

                {/* clue */}
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-[11.5px] leading-relaxed",
                    selected.clue
                      ? "border-sky-200/70 bg-sky-50/70 text-sky-950"
                      : "border-dashed border-border bg-muted/30 text-muted-foreground"
                  )}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em]">
                    <Eye className="h-3 w-3" /> Hasil inspeksi
                  </div>
                  {selected.clue ?? "Belum diinspeksi. Tekan Inspeksi (1) untuk melihat kondisi fisik."}
                </div>

                {/* readings */}
                {Object.keys(selected.readings).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Hasil pengukuran
                    </div>
                    {Object.entries(selected.readings).map(([tool, text]) => (
                      <div key={tool} className="rounded-lg border border-border/60 bg-muted/25 px-2.5 py-2">
                        <div className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                          {tool.replace("_", " ")}
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">{text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* tools */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Alat diagnosis
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Keyboard className="h-2.5 w-2.5" /> 1–4
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TOOLS.map((t) => (
                      <ToolButton
                        key={t.key}
                        label={t.short}
                        icon={t.icon}
                        hint={t.hint}
                        tested={t.key === "VISUAL" ? selected.inspected : selected.testedTools.includes(t.key)}
                        disabled={busy || done}
                        title={t.desc}
                        onClick={() =>
                          t.key === "VISUAL"
                            ? void act({ type: "INSPECT", componentKey: selected.key })
                            : void act({ type: "TEST", componentKey: selected.key, tool: t.key })
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* fixes */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Tindakan perbaikan
                    </span>
                    <span className="text-[9px] font-bold text-rose-600">salah = −1 nyawa</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FIXES.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        title={f.desc}
                        disabled={busy || done || selected.fixed}
                        onClick={() => void act({ type: "FIX", componentKey: selected.key, fixType: f.key })}
                        className={cn(
                          "group flex flex-col items-start gap-0.5 rounded-xl border border-border/70 bg-card px-2.5 py-2 text-left transition-all",
                          "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
                          "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-[11px] font-bold">
                          <f.icon className="h-3.5 w-3.5 text-primary" /> {f.label}
                        </span>
                        <span className="text-[9px] leading-tight text-muted-foreground">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selected.replacementName && (
                  <p className="rounded-lg bg-muted/50 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                    Spare part tersedia: <span className="font-bold text-foreground">{selected.replacementName}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <Wrench className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">Pilih komponen di meja kerja untuk mulai mendiagnosis.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <RepairTutorial
        open={tutorialOpen}
        onClose={() => {
          markRepairTutorialSeen();
          setTutorialOpen(false);
        }}
      />

      {result && (
        <ResultOverlay
          result={result}
          jobTitle={state.job.title}
          deviceType={state.job.deviceType}
          faultsFixed={state.faultsFixed}
          faultsTotal={state.faultsTotal}
          onRestart={() => void restart()}
          onExit={() => navigate("/repair")}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- pieces
function ToolButton({
  label,
  icon: Icon,
  hint,
  tested,
  disabled,
  title,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  hint: string;
  tested: boolean;
  disabled: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors",
        tested
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-border/70 bg-card text-foreground/80 hover:border-primary/40 hover:text-primary",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
      {tested ? (
        <CheckCircle2 className="ml-auto h-3 w-3 shrink-0" />
      ) : (
        <kbd className="ml-auto hidden shrink-0 rounded border border-border/70 bg-muted px-1 font-mono-tech text-[8.5px] font-bold text-muted-foreground sm:block">
          {hint}
        </kbd>
      )}
    </button>
  );
}

function LogRow({ event }: { event: RepairEvent }) {
  const meta =
    event.kind === "FIX" || event.kind === "WIN"
      ? { icon: CheckCircle2, cls: "text-emerald-400", line: "border-emerald-400/20 bg-emerald-400/[0.06]" }
      : event.kind === "HEART_LOST" || event.kind === "LOSE" || event.kind === "TIMEOUT"
        ? { icon: XCircle, cls: "text-rose-400", line: "border-rose-400/20 bg-rose-400/[0.06]" }
        : { icon: Lightbulb, cls: "text-sky-300", line: "border-sky-400/15 bg-sky-400/[0.05]" };
  const Icon = meta.icon;
  return (
    <li className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-1.5", meta.line)}>
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.cls)} />
      <div className="min-w-0">
        <div className="font-mono-tech text-[10.5px] font-bold leading-snug text-slate-100">{event.title}</div>
        <div className="font-mono-tech text-[10px] leading-relaxed text-slate-400">{event.message}</div>
      </div>
    </li>
  );
}

function ResultOverlay({
  result,
  jobTitle,
  deviceType,
  faultsFixed,
  faultsTotal,
  onRestart,
  onExit,
}: {
  result: RepairResult;
  jobTitle: string;
  deviceType: RepairDeviceType;
  faultsFixed: number;
  faultsTotal: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const success = result.success;
  const device = deviceLabel(deviceType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="animate-fade-in-up max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card shadow-lift">
        {/* header */}
        <div className="relative overflow-hidden bg-[#0b1628] px-6 pb-6 pt-7 text-center text-white">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl",
              success ? "bg-emerald-400/25" : "bg-rose-400/20"
            )}
            aria-hidden
          />
          <div className="relative">
            <div
              className={cn(
                "mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.06] ring-1",
                success ? "ring-emerald-400/40" : "ring-rose-400/40"
              )}
            >
              <span className="font-display text-4xl font-extrabold">{result.grade}</span>
            </div>
            <div
              className={cn(
                "mt-3 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.28em]",
                success ? "text-emerald-300" : "text-rose-300"
              )}
            >
              {success ? "Misi selesai" : "Misi gagal"}
            </div>
            <h1 className="mt-1 font-display text-xl font-extrabold leading-snug">
              {success ? `${device} kembali normal! 🎉` : "Perbaikan belum berhasil"}
            </h1>
            <p className="mt-1 truncate text-[11px] text-slate-400">{jobTitle}</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-7 w-7 transition-transform",
                    i <= result.stars ? "scale-105 fill-amber-400 text-amber-400" : "text-slate-700"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* score */}
        <div className="space-y-3 px-6 py-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Skor akhir</div>
              <div className="font-display text-4xl font-extrabold leading-none text-primary">{result.score}</div>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 font-mono-tech text-[10px] font-bold text-muted-foreground">
              {formatClock(result.timeSec)} · {faultsFixed}/{faultsTotal} fault · {result.stars}★
            </span>
          </div>

          <div className="space-y-2">
            <ScoreBar label="Akurasi tindakan" value={result.accuracy} tone="emerald" suffix={`${Math.round(result.accuracy * 100)}%`} />
            <ScoreBar label="Bonus kecepatan" value={result.speed} tone="sky" suffix={`${Math.round(result.speed * 100)}%`} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BonusChip label="Bonus combo" value={`+${result.comboBonus}`} tone="amber" />
            <BonusChip label="Bonus nyawa" value={`+${result.heartBonus}`} tone="rose" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-primary" /> XP diperoleh
            </span>
            <span className="font-display text-lg font-extrabold text-primary">
              {result.xpGained > 0 ? `+${result.xpGained} XP` : "Sudah tercatat"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <Button className="flex-1" onClick={onRestart}>
            <RefreshCw className="h-4 w-4" /> Coba Lagi
          </Button>
          <Button variant="outline" className="flex-1" onClick={onExit}>
            <Play className="h-4 w-4" /> Bengkel
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone: "emerald" | "sky";
  suffix: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div>
      <div className="flex items-center justify-between text-[10.5px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono-tech font-bold text-foreground/80">{suffix}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone === "emerald" ? "bg-emerald-500" : "bg-sky-500")}
          style={{ width: `${Math.max(2, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}

function BonusChip({ label, value, tone }: { label: string; value: string; tone: "amber" | "rose" }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 px-2.5 py-2">
      <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 font-display text-base font-extrabold", tone === "amber" ? "text-amber-600" : "text-rose-600")}>
        {value}
      </div>
    </div>
  );
}
