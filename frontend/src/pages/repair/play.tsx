import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Cable,
  CheckCircle2,
  ChevronDown,
  CircuitBoard,
  Clock,
  Cpu,
  Eye,
  Flame,
  Gauge,
  HeartPulse,
  HelpCircle,
  Keyboard,
  Laptop,
  Lightbulb,
  ListChecks,
  MonitorCog,
  MousePointer2,
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
import { DeviceChassis } from "@/components/repair/device-chassis";
import { RepairTutorial, markRepairTutorialSeen } from "@/components/repair/repair-tutorial";
import { componentIcon } from "@/components/repair/component-icons";
import { cn, difficultyLabel } from "@/lib/utils";
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
  { key: "VISUAL", label: "Inspeksi Visual", short: "Inspeksi", desc: "Cek kondisi fisik", icon: Eye, hint: "1" },
  { key: "MULTIMETER", label: "Multimeter", short: "Multimeter", desc: "Ukur tegangan", icon: Gauge, hint: "2" },
  { key: "POST_CARD", label: "POST Card", short: "POST", desc: "Baca kode POST", icon: Cpu, hint: "3" },
  { key: "SOFTWARE", label: "Diagnostik Software", short: "Software", desc: "SMART / device", icon: Terminal, hint: "4" },
];

const SELECT_TOOL = { key: "SELECT" as const, label: "Pilih Komponen", short: "Pilih", desc: "Arahkan & pilih", icon: MousePointer2, hint: "0" };

const FIXES: { key: RepairFixType; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "REPLACE", label: "Ganti Komponen", desc: "Tukar dengan spare part", icon: RefreshCw },
  { key: "RESEAT", label: "Reseat", desc: "Lepas & pasang ulang", icon: Wrench },
  { key: "CLEAN", label: "Bersihkan", desc: "Bersihkan debu / korosi", icon: Sparkles },
  { key: "RECONNECT", label: "Sambung Ulang", desc: "Cabut & colok kabel", icon: Cable },
];

const DIFF_TONE: Record<string, string> = {
  EASY: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  MEDIUM: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  HARD: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

function formatClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function deviceLabel(deviceType: RepairDeviceType): string {
  return deviceType === "LAPTOP" ? "Laptop" : "PC";
}

function nowStamp(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
    d.getSeconds()
  ).padStart(2, "0")}`;
}

// ---------------------------------------------------------------- page
export function RepairPlayPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<RepairAttemptState | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: number; event: RepairEvent; at: string }[]>([]);
  const [result, setResult] = useState<RepairResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [muted, setMuted] = useState(() => isSoundMuted());
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<RepairTool | "SELECT">("SELECT");
  const [probes, setProbes] = useState<Record<string, Record<string, string>>>({});
  const [booting, setBooting] = useState(false);
  const [shake, setShake] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [manifestOpen, setManifestOpen] = useState(true);
  const timeoutRef = useRef(false);
  const shakeTimer = useRef<number | null>(null);
  const eventId = useRef(0);

  const selected = state?.components.find((c) => c.key === selectedKey) ?? null;
  const selectedReadings = selected ? { ...selected.readings, ...(probes[selected.key] ?? {}) } : {};
  const done = state ? state.status !== "IN_PROGRESS" : false;

  useLeaveGuard(!loading && !result && state?.status === "IN_PROGRESS");

  useEffect(() => {
    return () => {
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    };
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
    setProbes({});
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
        setEvents((prev) => [{ id: eventId.current, event: res.event, at: nowStamp() }, ...prev].slice(0, 30));
        if (res.event.kind === "TEST" && res.event.componentKey) {
          const toolKey = String(payload.tool ?? "TEST").toUpperCase();
          const reading = res.event.reading ?? res.event.message;
          setProbes((prev) => ({
            ...prev,
            [res.event.componentKey!]: { ...(prev[res.event.componentKey!] ?? {}), [toolKey]: reading },
          }));
        }
        if (res.result) {
          setResult(res.result);
          playSound(res.result.success ? "win" : "lose");
          if (res.result.success) toast.success(`${deviceLabel(res.state.job.deviceType)} berhasil diperbaiki! 🎉`);
          else toast.error("Misi perbaikan gagal.");
        } else if (res.event.kind === "HEART_LOST") {
          playSound("wrong");
          setShake(true);
          if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
          shakeTimer.current = window.setTimeout(() => setShake(false), 460);
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

  /** Terapkan alat aktif ke komponen tertentu — inti interaksi simulator. */
  const applyTool = useCallback(
    (tool: RepairTool | "SELECT", componentKey: string) => {
      const comp = state?.components.find((c) => c.key === componentKey);
      if (!comp || tool === "SELECT" || busy || result || state?.status !== "IN_PROGRESS") return;
      if (comp.fixed) return;
      if (tool === "VISUAL") {
        if (comp.inspected) return;
        void act({ type: "INSPECT", componentKey });
      } else {
        if (comp.testedTools.includes(tool)) return;
        void act({ type: "TEST", componentKey, tool });
      }
    },
    [state, busy, result, act]
  );

  const handleSelect = useCallback(
    (key: string) => {
      setSelectedKey(key);
      playSound("select");
      if (activeTool !== "SELECT") applyTool(activeTool, key);
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
        window.setTimeout(() => {
          document.getElementById("diagnosis-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    },
    [activeTool, applyTool]
  );

  const runPowerTest = useCallback(() => {
    if (busy || done || !state) return;
    setBooting(true);
    const started = Date.now();
    void act({ type: "POWER_TEST" }).finally(() => {
      const wait = Math.max(0, 1100 - (Date.now() - started));
      window.setTimeout(() => setBooting(false), wait);
    });
  }, [act, busy, done, state]);

  // auto timeout
  useEffect(() => {
    if (!state || state.status !== "IN_PROGRESS" || result || timeLeft > 0) return;
    if (timeoutRef.current) return;
    timeoutRef.current = true;
    void act({ type: "TIMEOUT" });
  }, [timeLeft, state, result, act]);

  // keyboard shortcuts: 1-4 alat, 0 pilih, P tes nyala
  useEffect(() => {
    if (!state || state.status !== "IN_PROGRESS" || result || busy || tutorialOpen || !selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = e.key.toLowerCase();
      if (key === "p") {
        e.preventDefault();
        runPowerTest();
        return;
      }
      if (key === "0") {
        e.preventDefault();
        setActiveTool("SELECT");
        return;
      }
      const tool = TOOLS.find((t) => t.hint === key);
      if (!tool) return;
      e.preventDefault();
      setActiveTool(tool.key);
      if (tool.key === "VISUAL") {
        if (!selected.inspected) void act({ type: "INSPECT", componentKey: selected.key });
      } else if (!selected.testedTools.includes(tool.key)) {
        void act({ type: "TEST", componentKey: selected.key, tool: tool.key });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, result, busy, tutorialOpen, selected, act, runPowerTest]);

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
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Menyiapkan meja kerja…
          </span>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
          <XCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-rose-600">{error ?? "Sesi tidak ditemukan."}</p>
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
  const handled = state.components.filter((c) => c.fixed).length;
  const integrityPct = state.job.maxHearts > 0 ? state.hearts / state.job.maxHearts : 0;
  const activeToolInfo = activeTool === "SELECT" ? SELECT_TOOL : TOOLS.find((t) => t.key === activeTool) ?? SELECT_TOOL;
  const activeToolHint = done
    ? "Sesi selesai — buka laporan servis untuk melihat hasil."
    : {
        SELECT: "Klik komponen pada perangkat untuk membuka panel diagnosis.",
        VISUAL: "Klik komponen untuk melihat kondisi fisiknya.",
        MULTIMETER: "Klik komponen untuk mengukur tegangan dan kontinuitas.",
        POST_CARD: "Klik komponen untuk membaca kode POST.",
        SOFTWARE: "Klik komponen untuk menjalankan diagnosa software.",
      }[activeTool];

  return (
    <div className="-mx-[14px] -mb-[92px] -mt-[18px] bg-[#050b14] px-[14px] pb-[92px] pt-[18px] text-slate-200 sm:-mx-[18px] sm:-mt-[22px] sm:px-[18px] sm:pt-[22px] lg:-mx-[34px] lg:-mb-[56px] lg:-mt-[30px] lg:px-[34px] lg:pb-[56px] lg:pt-[30px]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#050b14]"
        style={{
          backgroundImage:
            "radial-gradient(900px 460px at 8% -6%, rgba(37,99,235,0.16), transparent 62%), radial-gradient(760px 420px at 100% 4%, rgba(16,185,129,0.12), transparent 62%)",
        }}
        aria-hidden
      />
      <div className="relative space-y-3.5">
        {/* ---------------------------------------------------------- command deck */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#081422]/95 shadow-[0_28px_70px_-34px_rgba(0,0,0,0.95)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" aria-hidden />
          <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
            <button
              type="button"
              onClick={() => void exit()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Bengkel</span>
            </button>

            <span className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />

            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                isLaptop ? "bg-sky-400/10 text-sky-300 ring-sky-300/25" : "bg-emerald-400/10 text-emerald-300 ring-emerald-300/25"
              )}
            >
              {isLaptop ? <Laptop className="h-5 w-5" /> : <MonitorCog className="h-5 w-5" />}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-500">
                <span className="text-emerald-300">{state.job.skill.code}</span>
                <span className="text-slate-700">/</span>
                <span>{deviceLabel(state.job.deviceType)}</span>
                <span className="text-slate-700">/</span>
                <span className="text-slate-400">TIKET #{state.id.slice(-6).toUpperCase()}</span>
              </div>
              <h1 className="truncate font-display text-sm font-extrabold leading-tight text-white sm:text-base">
                {state.job.title}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden /> Live session
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-1 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.12em]",
                  DIFF_TONE[state.job.difficulty] ?? "border-white/15 bg-white/5 text-slate-300"
                )}
              >
                {difficultyLabel(state.job.difficulty)}
              </span>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono-tech text-[8.5px] font-bold text-slate-300 md:inline-flex">
                {state.actions} aksi
              </span>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Nyalakan efek suara" : "Matikan efek suara"}
                title={muted ? "Nyalakan efek suara" : "Matikan efek suara"}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-white/20 hover:text-white"
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                aria-label="Buka cara main"
                title="Cara main"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* HUD metrics */}
          <div className="relative grid grid-cols-2 gap-px border-t border-white/10 bg-white/[0.07] sm:grid-cols-4">
            <HudCell
              icon={Clock}
              label="Waktu"
              tone={lowTime ? "rose" : timePct < 0.5 ? "amber" : "sky"}
              value={formatClock(timeLeft)}
              sub={`dari ${formatClock(state.job.timeLimitSec)}`}
              bar={timePct}
              pulse={lowTime}
            />
            <HudCell
              icon={HeartPulse}
              label="Integritas"
              tone={integrityPct <= 0.34 ? "rose" : integrityPct <= 0.67 ? "amber" : "emerald"}
              value={`${state.hearts}/${state.job.maxHearts}`}
              sub="nyawa sistem"
              segments={{ total: state.job.maxHearts, filled: state.hearts }}
            />
            <HudCell
              icon={Flame}
              label="Combo"
              tone="amber"
              value={`×${state.combo}`}
              sub={`maks ×${state.maxCombo}`}
              bar={Math.min(1, state.combo / 5)}
            />
            <HudCell
              icon={Wrench}
              label="Perbaikan"
              tone="emerald"
              value={`${progressPct}%`}
              sub={`${state.faultsFixed}/${state.faultsTotal} fault`}
              bar={progressPct / 100}
            />
          </div>

          <div className="relative flex items-start gap-2 border-t border-white/10 px-3 py-2.5 text-[11px] leading-relaxed text-slate-300 sm:px-4">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span>
              <span className="mr-1 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
                Gejala
              </span>
              {state.job.symptom}
            </span>
          </div>
        </section>

        {/* ---------------------------------------------------------- cockpit grid */}
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* -------------------------------------------------- workbench column */}
          <div className="min-w-0 space-y-3.5">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#081422] shadow-[0_24px_60px_-34px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/20">
                    <CircuitBoard className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">
                      Meja kerja · workbench 01
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {state.components.length} komponen · {handled} beres
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="hidden items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono-tech text-[8.5px] uppercase tracking-[0.1em] text-slate-400 sm:inline-flex">
                    <Keyboard className="h-3 w-3" /> 0–4 alat · P tes nyala
                  </span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                      style={{ width: `${Math.max(2, progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/10 bg-[#060f1b] px-3.5 py-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.14em]",
                    done
                      ? "border-white/10 bg-white/5 text-slate-500"
                      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                  )}
                >
                  <activeToolInfo.icon className="h-3 w-3" />
                  {activeToolInfo.short}
                </span>
                <span className="text-[10.5px] leading-snug text-slate-400">{activeToolHint}</span>
                <span className="ml-auto hidden items-center gap-1.5 font-mono-tech text-[8px] uppercase tracking-[0.1em] text-slate-600 sm:inline-flex">
                  <MousePointer2 className="h-3 w-3" />
                  {selected ? `target · ${selected.name}` : "belum ada target"}
                </span>
              </div>

              <div className="relative p-2.5 sm:p-3">
                <div className={cn(shake && "sim-shake")}>
                  <DeviceChassis
                    deviceType={state.job.deviceType}
                    components={state.components}
                    selectedKey={selectedKey}
                    disabled={done}
                    onSelect={handleSelect}
                  />
                </div>
                {booting && <BootOverlay />}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 px-3.5 py-2">
                <span className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.16em] text-slate-600">Legenda</span>
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[8px] uppercase tracking-[0.08em] text-slate-500">
                  <i className="h-1.5 w-1.5 rounded-full bg-slate-500" /> belum dicek
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[8px] uppercase tracking-[0.08em] text-sky-300/80">
                  <i className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" /> diinspeksi
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono-tech text-[8px] uppercase tracking-[0.08em] text-emerald-300/80">
                  <i className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" /> beres
                </span>
                <span className="ml-auto hidden items-center gap-1.5 font-mono-tech text-[8px] uppercase tracking-[0.08em] text-amber-300/80 md:inline-flex">
                  <i className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" /> terpilih
                </span>
              </div>

              {/* tool dock */}
              <div className="bg-[#070f1b] px-2.5 py-2.5 sm:px-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    <Wrench className="h-3 w-3 text-emerald-300" /> Tool dock
                  </span>
                  <span className="font-mono-tech text-[8.5px] uppercase tracking-[0.08em] text-slate-600">
                    pilih alat → klik komponen
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                  {[SELECT_TOOL, ...TOOLS].map((tool) => {
                    const active = activeTool === tool.key;
                    const tested =
                      selected &&
                      (tool.key === "VISUAL"
                        ? selected.inspected
                        : tool.key !== "SELECT" && selected.testedTools.includes(tool.key));
                    return (
                      <button
                        key={tool.key}
                        type="button"
                        onClick={() => setActiveTool(tool.key as RepairTool | "SELECT")}
                        aria-pressed={active}
                        disabled={done}
                        title={`${tool.label} (${tool.hint})`}
                        className={cn(
                          "group relative flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition-all",
                          active
                            ? "border-emerald-400/60 bg-emerald-400/10 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
                          done && "cursor-not-allowed opacity-45"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
                            active
                              ? "bg-emerald-400/15 text-emerald-300 ring-emerald-300/30"
                              : "bg-white/[0.05] text-slate-400 ring-white/10"
                          )}
                        >
                          <tool.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-[10.5px] font-bold",
                              active ? "text-emerald-200" : "text-slate-200"
                            )}
                          >
                            {tool.short}
                          </span>
                          <span className="hidden truncate font-mono-tech text-[7.5px] uppercase tracking-[0.08em] text-slate-500 lg:block">
                            {tool.desc}
                          </span>
                        </span>
                        {tested ? (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                        ) : (
                          <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/[0.06] px-1 font-mono-tech text-[8px] font-bold text-slate-500 sm:block">
                            {tool.hint}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={runPowerTest}
                  disabled={busy || done}
                  className="group mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/10 px-3 py-2 transition-all hover:border-emerald-400/60 hover:from-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-[0_0_22px_rgba(16,185,129,0.45)]">
                      <Power className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-[11.5px] font-bold text-emerald-100">Uji nyala perangkat</span>
                      <span className="block truncate text-[10px] text-emerald-200/60">
                        Jalankan POST lengkap · salah diagnosis = −1 integritas
                      </span>
                    </span>
                  </span>
                  <kbd className="hidden shrink-0 rounded border border-emerald-300/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-200 sm:block">
                    P
                  </kbd>
                </button>
              </div>
            </section>

            {/* console */}
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#050d18]">
              <button
                type="button"
                onClick={() => setConsoleOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5 text-left"
                aria-expanded={consoleOpen}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" aria-hidden />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" aria-hidden />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" aria-hidden />
                  <span className="ml-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    diagnostic.log
                  </span>
                </span>
                <span className="flex items-center gap-2 font-mono-tech text-[9px] text-slate-500">
                  {events.length} entri
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", consoleOpen && "rotate-180")} />
                </span>
              </button>
              {consoleOpen && (
                <div className="max-h-56 overflow-y-auto p-2.5">
                  {events.length === 0 ? (
                    <p className="px-1 py-5 text-center font-mono-tech text-[10.5px] text-slate-500">
                      <span className="text-emerald-400">$</span> menunggu tindakan
                      <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-emerald-400 align-middle" />
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {events.map(({ id, event, at }) => (
                        <LogRow key={id} event={event} at={at} />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* -------------------------------------------------- diagnostics column */}
          <aside id="diagnosis-panel" className="scroll-mt-4 space-y-3.5 xl:sticky xl:top-4 xl:self-start">
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#081422] shadow-[0_24px_60px_-34px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-emerald-300 ring-1 ring-white/10">
                    <Gauge className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Panel diagnosis
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {selected ? "Komponen terpilih" : "Belum ada komponen"}
                    </div>
                  </div>
                </div>
                {selected && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 font-mono-tech text-[8px] font-bold uppercase tracking-[0.1em]",
                      selected.fixed
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : selected.inspected
                          ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
                          : "border-white/10 bg-white/5 text-slate-400"
                    )}
                  >
                    {selected.fixed ? "Beres" : selected.inspected ? "Diinspeksi" : "Belum dicek"}
                  </span>
                )}
              </div>

              {selected ? (
                <div className="space-y-3 p-3.5">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
                        selected.fixed
                          ? "bg-emerald-400/10 text-emerald-300 ring-emerald-300/25"
                          : selected.inspected
                            ? "bg-sky-400/10 text-sky-300 ring-sky-300/25"
                            : "bg-white/[0.05] text-slate-400 ring-white/10"
                      )}
                    >
                      {(() => {
                        const Icon = componentIcon(selected);
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-extrabold leading-snug text-white">{selected.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono-tech text-[8px] uppercase tracking-[0.1em] text-slate-400">
                          {selected.category}
                        </span>
                        <span className="font-mono-tech text-[8.5px] text-slate-600">{selected.slot}</span>
                      </div>
                    </div>
                  </div>

                  {/* clue */}
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed",
                      selected.clue
                        ? "border-sky-400/25 bg-sky-400/[0.07] text-sky-100"
                        : "border-dashed border-white/10 bg-white/[0.02] text-slate-500"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-1.5 font-mono-tech text-[8px] font-bold uppercase tracking-[0.16em] text-sky-300/80">
                      <Eye className="h-3 w-3" /> Hasil inspeksi
                    </div>
                    {selected.clue ?? "Belum diinspeksi. Pilih alat Inspeksi lalu klik komponen ini."}
                  </div>

                  {/* readings */}
                  {Object.keys(selectedReadings).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Hasil pengukuran
                      </div>
                      {Object.entries(selectedReadings).map(([tool, text]) => (
                        <div key={tool} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                          <div className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-300/80">
                            {tool.replace("_", " ")}
                          </div>
                          <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-300">{text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* tools */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Alat diagnosis
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono-tech text-[8px] text-slate-600">
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
                          active={activeTool === t.key}
                          tested={t.key === "VISUAL" ? selected.inspected : selected.testedTools.includes(t.key)}
                          disabled={busy || done || selected.fixed}
                          title={t.desc}
                          onClick={() => {
                            setActiveTool(t.key);
                            if (t.key === "VISUAL") void act({ type: "INSPECT", componentKey: selected.key });
                            else void act({ type: "TEST", componentKey: selected.key, tool: t.key });
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* fixes */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Tindakan perbaikan
                      </span>
                      <span className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.08em] text-rose-400/80">
                        salah = −1 integritas
                      </span>
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
                            "group flex flex-col items-start gap-0.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left transition-all",
                            "hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-emerald-400/[0.07]",
                            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                          )}
                        >
                          <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-200">
                            <f.icon className="h-3.5 w-3.5 text-emerald-300" /> {f.label}
                          </span>
                          <span className="text-[8.5px] leading-tight text-slate-500">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selected.replacementName && (
                    <p className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[9.5px] text-slate-400">
                      Spare part tersedia: <span className="font-bold text-slate-200">{selected.replacementName}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <Wrench className="mx-auto h-7 w-7 text-slate-600" />
                  <p className="mt-2 text-[11px] text-slate-500">Pilih komponen di meja kerja untuk mulai mendiagnosis.</p>
                </div>
              )}
            </section>

            {/* manifest */}
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#081422]">
              <button
                type="button"
                onClick={() => setManifestOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5 text-left"
                aria-expanded={manifestOpen}
              >
                <span className="flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  <ListChecks className="h-3.5 w-3.5 text-emerald-300" /> Manifest komponen
                </span>
                <span className="flex items-center gap-2 font-mono-tech text-[9px] text-slate-500">
                  {handled}/{state.components.length}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", manifestOpen && "rotate-180")} />
                </span>
              </button>
              {manifestOpen && (
                <div className="max-h-72 overflow-y-auto p-1.5">
                  {state.components.map((component) => {
                    const Icon = componentIcon(component);
                    const isSelected = component.key === selectedKey;
                    return (
                      <button
                        key={component.key}
                        type="button"
                        onClick={() => handleSelect(component.key)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                          isSelected ? "bg-amber-400/10 ring-1 ring-amber-400/30" : "hover:bg-white/[0.05]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1",
                            component.fixed
                              ? "bg-emerald-400/10 text-emerald-300 ring-emerald-300/20"
                              : component.inspected
                                ? "bg-sky-400/10 text-sky-300 ring-sky-300/20"
                                : "bg-white/[0.04] text-slate-500 ring-white/10"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[10.5px] font-semibold text-slate-200">{component.name}</span>
                          <span className="block truncate font-mono-tech text-[8px] uppercase tracking-[0.08em] text-slate-600">
                            {component.slot}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 font-mono-tech text-[7.5px] font-bold uppercase tracking-[0.08em]",
                            component.fixed
                              ? "bg-emerald-400/10 text-emerald-300"
                              : component.inspected
                                ? "bg-sky-400/10 text-sky-300"
                                : "bg-white/[0.04] text-slate-600"
                          )}
                        >
                          {component.fixed ? "Beres" : component.inspected ? "Dicek" : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
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

function HudCell({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  bar,
  segments,
  pulse,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "amber" | "rose" | "sky";
  bar?: number;
  segments?: { total: number; filled: number };
  pulse?: boolean;
}) {
  const tones = {
    emerald: { text: "text-emerald-300", bar: "bg-emerald-400", icon: "text-emerald-400" },
    amber: { text: "text-amber-300", bar: "bg-amber-400", icon: "text-amber-400" },
    rose: { text: "text-rose-300", bar: "bg-rose-400", icon: "text-rose-400" },
    sky: { text: "text-sky-300", bar: "bg-sky-400", icon: "text-sky-400" },
  }[tone];

  return (
    <div className="bg-[#081422] px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3 w-3 shrink-0", tones.icon)} />
        <span className="truncate font-mono-tech text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </span>
        <span
          className={cn(
            "ml-auto h-1 w-1 shrink-0 rounded-full",
            pulse ? "animate-pulse bg-rose-400" : "bg-white/15"
          )}
          aria-hidden
        />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className={cn("font-display text-xl font-extrabold leading-none tabular-nums", pulse ? "text-rose-300" : "text-white")}>
          {value}
        </span>
        <span className="truncate font-mono-tech text-[8px] uppercase tracking-[0.06em] text-slate-600">{sub}</span>
      </div>
      {segments ? (
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: segments.total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-sm transition-colors",
                i < segments.filled ? tones.bar : "bg-white/10"
              )}
            />
          ))}
        </div>
      ) : (
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
          <span
            className={cn("block h-full rounded-full transition-all duration-500", tones.bar)}
            style={{ width: `${Math.max(2, Math.min(100, (bar ?? 0) * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  hint,
  active,
  tested,
  disabled,
  title,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  hint: string;
  active: boolean;
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
        "group relative flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10.5px] font-semibold transition-colors",
        tested
          ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
          : active
            ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
            : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-emerald-400/40 hover:text-emerald-200",
        disabled && "cursor-not-allowed opacity-45"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      {tested ? (
        <CheckCircle2 className="ml-auto h-3 w-3 shrink-0" />
      ) : (
        <kbd className="ml-auto hidden shrink-0 rounded border border-white/10 bg-white/[0.06] px-1 font-mono-tech text-[8px] font-bold text-slate-500 sm:block">
          {hint}
        </kbd>
      )}
    </button>
  );
}

function BootOverlay() {
  return (
    <div className="sim-boot-scan" role="status" aria-live="polite">
      <span className="relative font-mono-tech text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-300">
        POST · power on self test
      </span>
      <div className="relative space-y-1 font-mono-tech text-[9.5px] leading-relaxed text-slate-300">
        <div>
          <span className="text-emerald-400">✓</span> power rail 12V / 5V
        </div>
        <div>
          <span className="text-emerald-400">✓</span> memory training
        </div>
        <div>
          <span className="text-emerald-400">✓</span> storage detect
        </div>
        <div className="text-slate-500">menunggu hasil…</div>
      </div>
      <div className="sim-boot-bar">
        <span />
      </div>
    </div>
  );
}

function LogRow({ event, at }: { event: RepairEvent; at: string }) {
  const meta =
    event.kind === "FIX" || event.kind === "WIN"
      ? { icon: CheckCircle2, cls: "text-emerald-400", line: "border-emerald-400/20 bg-emerald-400/[0.05]", tag: "bg-emerald-400/10 text-emerald-300" }
      : event.kind === "HEART_LOST" || event.kind === "LOSE" || event.kind === "TIMEOUT"
        ? { icon: XCircle, cls: "text-rose-400", line: "border-rose-400/20 bg-rose-400/[0.05]", tag: "bg-rose-400/10 text-rose-300" }
        : { icon: Lightbulb, cls: "text-sky-300", line: "border-sky-400/15 bg-sky-400/[0.04]", tag: "bg-sky-400/10 text-sky-300" };
  const Icon = meta.icon;
  return (
    <li className={cn("flex items-start gap-2 rounded-lg border px-2 py-1.5", meta.line)}>
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.cls)} />
      <span className="shrink-0 font-mono-tech text-[8.5px] leading-4 text-slate-600">{at}</span>
      <span className={cn("shrink-0 rounded px-1 py-0.5 font-mono-tech text-[7.5px] font-bold uppercase leading-3 tracking-[0.06em]", meta.tag)}>
        {event.kind.replace("_", " ")}
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold leading-snug text-slate-100">{event.title}</div>
        <div className="text-[9.5px] leading-relaxed text-slate-400">{event.message}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03070e]/85 p-4 backdrop-blur-sm">
      <div className="animate-fade-in-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#081422] text-slate-200 shadow-[0_40px_120px_-40px_rgba(0,0,0,1)]">
        {/* report header */}
        <div className="relative overflow-hidden border-b border-white/10 px-5 py-5">
          <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div
            className={cn(
              "pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full blur-3xl",
              success ? "bg-emerald-400/25" : "bg-rose-400/20"
            )}
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div
                className={cn(
                  "flex items-center gap-1.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.22em]",
                  success ? "text-emerald-300" : "text-rose-300"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> Laporan servis · {success ? "selesai" : "gagal"}
              </div>
              <h1 className="mt-1.5 font-display text-xl font-extrabold leading-tight text-white">
                {success ? `${device} kembali normal` : "Perbaikan belum tuntas"}
              </h1>
              <p className="mt-1 truncate text-[11px] text-slate-400">{jobTitle}</p>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-6 w-6 transition-transform",
                      i <= result.stars ? "scale-105 fill-amber-400 text-amber-400" : "text-slate-700"
                    )}
                  />
                ))}
                <span className="ml-2 font-mono-tech text-[9px] uppercase tracking-[0.12em] text-slate-500">
                  {result.stars}/3 bintang
                </span>
              </div>
            </div>
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border",
                success ? "border-emerald-400/40 bg-emerald-400/10" : "border-rose-400/40 bg-rose-400/10"
              )}
            >
              <span className="font-display text-3xl font-extrabold leading-none text-white">{result.grade}</span>
              <span className="mt-0.5 font-mono-tech text-[7px] uppercase tracking-[0.16em] text-slate-500">grade</span>
            </div>
          </div>
        </div>

        {/* report body */}
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-end justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div>
              <div className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500">Skor akhir</div>
              <div className="font-display text-4xl font-extrabold leading-none text-white">
                {result.score}
                <span className="ml-1 text-sm font-bold text-slate-500">/100</span>
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono-tech text-[9px] font-bold text-slate-300">
              {formatClock(result.timeSec)} · {faultsFixed}/{faultsTotal} fault · {result.stars}★
            </span>
          </div>

          <div className="space-y-2">
            <ScoreBar label="Akurasi tindakan" value={result.accuracy} tone="emerald" suffix={`${Math.round(result.accuracy * 100)}%`} />
            <ScoreBar label="Bonus kecepatan" value={result.speed} tone="sky" suffix={`${Math.round(result.speed * 100)}%`} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <BonusChip label="Bonus combo" value={`+${result.comboBonus}`} tone="amber" />
            <BonusChip label="Bonus integritas" value={`+${result.heartBonus}`} tone="rose" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-100">
              <Trophy className="h-4 w-4 text-emerald-300" /> XP diperoleh
            </span>
            <span className="font-display text-lg font-extrabold text-emerald-300">
              {result.xpGained > 0 ? `+${result.xpGained} XP` : "Sudah tercatat"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/10 px-5 py-3.5">
          <Button className="flex-1" onClick={onRestart}>
            <RefreshCw className="h-4 w-4" /> Coba lagi
          </Button>
          <Button variant="outline" className="flex-1 border-white/15 bg-white/5 text-slate-200 hover:bg-white/10" onClick={onExit}>
            <Zap className="h-4 w-4" /> Ke bengkel
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
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono-tech font-bold text-slate-300">{suffix}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full", tone === "emerald" ? "bg-emerald-400" : "bg-sky-400")}
          style={{ width: `${Math.max(2, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}

function BonusChip({ label, value, tone }: { label: string; value: string; tone: "amber" | "rose" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <div className="font-mono-tech text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={cn("mt-0.5 font-display text-base font-extrabold", tone === "amber" ? "text-amber-300" : "text-rose-300")}>
        {value}
      </div>
    </div>
  );
}
