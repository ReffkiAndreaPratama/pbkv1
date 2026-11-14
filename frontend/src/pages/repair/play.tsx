import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Battery,
  Cable,
  CheckCircle2,
  CircuitBoard,
  Clock,
  Cpu,
  Eye,
  Fan,
  Flame,
  Gauge,
  HardDrive,
  Heart,
  Keyboard,
  Lightbulb,
  MemoryStick,
  Monitor,
  Network,
  Play,
  Power,
  Printer,
  RefreshCw,
  Router,
  Sparkles,
  Star,
  Terminal,
  Trophy,
  Wrench,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLeaveGuard } from "@/lib/use-leave-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, difficultyColor, difficultyLabel } from "@/lib/utils";
import type {
  RepairActionResponse,
  RepairAttemptState,
  RepairComponentState,
  RepairEvent,
  RepairFixType,
  RepairResult,
  RepairTool,
} from "@/lib/types";

// ---------------------------------------------------------------- config
const TOOLS: { key: RepairTool; label: string; short: string; desc: string; icon: LucideIcon }[] = [
  { key: "VISUAL", label: "Inspeksi Visual", short: "Visual", desc: "Cek kondisi fisik komponen", icon: Eye },
  { key: "MULTIMETER", label: "Multimeter", short: "Multimeter", desc: "Ukur tegangan & kontinuitas", icon: Gauge },
  { key: "POST_CARD", label: "POST Card", short: "POST", desc: "Baca kode diagnostik POST", icon: Cpu },
  { key: "SOFTWARE", label: "Diagnostik Software", short: "Software", desc: "SMART / device manager", icon: Terminal },
];

const FIXES: { key: RepairFixType; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "REPLACE", label: "Ganti Komponen", desc: "Tukar dengan spare part", icon: RefreshCw },
  { key: "RESEAT", label: "Reseat", desc: "Lepas & pasang ulang", icon: Wrench },
  { key: "CLEAN", label: "Bersihkan", desc: "Bersihkan debu / korosi", icon: Sparkles },
  { key: "RECONNECT", label: "Sambung Ulang", desc: "Cabut & colok kabel", icon: Cable },
];

const COMPONENT_ICON: Record<string, LucideIcon> = {
  psu: Zap,
  mobo: CircuitBoard,
  cpu: Cpu,
  ram: MemoryStick,
  gpu: Monitor,
  hdd: HardDrive,
  fan: Fan,
  cmos: Battery,
  monitor: Monitor,
  keyboard: Keyboard,
  printer: Printer,
  nic: Network,
  router: Router,
  cable_power: Cable,
  cable_data: Cable,
  cable_lan: Cable,
  cable_display: Cable,
  cable_usb: Cable,
};

function iconFor(c: RepairComponentState): LucideIcon {
  return COMPONENT_ICON[c.key] ?? (c.category === "CABLE" ? Cable : c.category === "PERIPHERAL" ? Printer : Wrench);
}

function formatClock(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
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
  const timeoutRef = useRef(false);
  const eventId = useRef(0);

  useLeaveGuard(!loading && !result && state?.status === "IN_PROGRESS");

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
          if (res.result.success) toast.success("PC berhasil diperbaiki! 🎉");
          else toast.error("Misi perbaikan gagal.");
        } else if (res.event.kind === "HEART_LOST") {
          toast.error(res.event.title);
        } else if (res.event.kind === "FIX") {
          toast.success(res.event.title);
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

  const selected = state.components.find((c) => c.key === selectedKey) ?? null;
  const done = state.status !== "IN_PROGRESS";
  const progressPct = state.faultsTotal ? Math.round((state.faultsFixed / state.faultsTotal) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => void exit()}>
          <ArrowLeft className="h-4 w-4" /> Keluar
        </Button>
        <span className="flex items-center gap-1.5 font-mono-tech text-[10px] font-bold tracking-widest text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden /> BENGKEL AKTIF
        </span>
      </div>

      {/* HUD */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-300" />
            <span className="font-mono-tech text-[10px] font-bold tracking-[0.2em] text-emerald-300">TIKET PERBAIKAN</span>
          </div>
          <span className="min-w-0 truncate font-display text-sm font-bold">{state.job.title}</span>
          <Badge className={cn(difficultyColor(state.job.difficulty), "shrink-0")}>{difficultyLabel(state.job.difficulty)}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <Heart className="h-3 w-3 text-rose-400" /> Nyawa
            </div>
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: state.job.maxHearts }).map((_, i) => (
                <Heart
                  key={i}
                  className={cn("h-4 w-4 transition-all", i < state.hearts ? "fill-rose-500 text-rose-500" : "text-slate-600")}
                />
              ))}
              <span className="ml-1 font-mono-tech text-xs font-bold text-slate-300">{state.hearts}/{state.job.maxHearts}</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <Clock className="h-3 w-3 text-sky-400" /> Waktu
            </div>
            <div className={cn("mt-0.5 font-mono-tech text-lg font-extrabold", timeLeft <= 30 ? "animate-pulse text-rose-400" : "text-white")}>
              {formatClock(timeLeft)}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <Flame className="h-3 w-3 text-amber-400" /> Combo
            </div>
            <div className={cn("mt-0.5 flex items-center gap-1 font-mono-tech text-lg font-extrabold", state.combo > 0 ? "text-amber-300" : "text-slate-500")}>
              ×{state.combo}
              {state.combo >= 2 && <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">on fire</span>}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span className="flex items-center gap-1.5"><Wrench className="h-3 w-3 text-emerald-400" /> Perbaikan</span>
              <span className="font-mono-tech text-emerald-300">{state.faultsFixed}/{state.faultsTotal}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2 text-[11px] text-slate-300">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span className="line-clamp-1">{state.job.symptom}</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* workbench */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <CircuitBoard className="h-4 w-4 text-primary" />
                <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-primary">Meja Kerja</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{state.components.length} komponen · klik untuk memeriksa</span>
            </div>
            <CardContent className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {state.components.map((c) => (
                  <ComponentCard
                    key={c.key}
                    component={c}
                    selected={c.key === selectedKey}
                    disabled={done}
                    onSelect={() => setSelectedKey(c.key)}
                  />
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Tips:</strong> inspeksi dulu, lalu gunakan alat yang relevan. Tindakan perbaikan yang salah
                akan mengurangi 1 nyawa. Tekan <strong>Tes Nyala</strong> setelah semua masalah diperbaiki.
              </div>
            </CardContent>
          </Card>

          {/* power test */}
          <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-teal-50/60">
            <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <div className="font-display text-sm font-bold text-emerald-900">Sudah yakin semua beres?</div>
                <p className="mt-0.5 text-xs text-emerald-800/80">Tekan tombol untuk menyalakan PC. Kalau masih ada kerusakan, nyawa berkurang.</p>
              </div>
              <Button
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void act({ type: "POWER_TEST" })}
                disabled={busy || done}
              >
                <Power className="h-4 w-4" /> Tes Nyala
              </Button>
            </CardContent>
          </Card>

          {/* log */}
          <Card>
            <div className="border-b border-border/60 px-5 py-3">
              <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-muted-foreground">Log Diagnosis</span>
            </div>
            <CardContent className="p-3">
              {events.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">Belum ada tindakan. Pilih komponen dan mulai inspeksi.</p>
              ) : (
                <ul className="space-y-1.5">
                  {events.map(({ id, event }) => (
                    <LogRow key={id} event={event} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* action panel */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-4">
            <Card className="overflow-hidden">
              <div className="border-b border-border/60 px-4 py-3">
                <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-muted-foreground">Panel Diagnosis</span>
              </div>
              {selected ? (
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      selected.fixed ? "bg-emerald-100 text-emerald-700" : selected.inspected ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground"
                    )}>
                      {(() => {
                        const Icon = iconFor(selected);
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold leading-snug">{selected.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-mono-tech text-[9px]">{selected.category}</Badge>
                        {selected.fixed ? (
                          <Badge variant="success" className="text-[9px]">Diperbaiki</Badge>
                        ) : selected.inspected ? (
                          <Badge variant="info" className="text-[9px]">Sudah diinspeksi</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px]">Belum dicek</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">
                    <div className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Hasil Inspeksi</div>
                    {selected.clue ? (
                      <p className="text-foreground/85">{selected.clue}</p>
                    ) : (
                      <p className="text-muted-foreground">Belum diinspeksi. Gunakan alat di bawah untuk mulai mendiagnosis.</p>
                    )}
                  </div>

                  {Object.keys(selected.readings).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-bold uppercase tracking-widest text-muted-foreground text-[10px]">Hasil Pengukuran</div>
                      {Object.entries(selected.readings).map(([tool, text]) => (
                        <div key={tool} className="rounded-lg border border-border/60 bg-card px-2.5 py-2">
                          <div className="font-mono-tech text-[9px] font-bold uppercase tracking-widest text-primary">{tool.replace("_", " ")}</div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/80">{text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Alat Diagnosis</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <ToolButton
                        label="Inspeksi"
                        icon={Eye}
                        tested={selected.inspected}
                        disabled={busy || done}
                        onClick={() => void act({ type: "INSPECT", componentKey: selected.key })}
                      />
                      {TOOLS.filter((t) => t.key !== "VISUAL").map((t) => (
                        <ToolButton
                          key={t.key}
                          label={t.short}
                          icon={t.icon}
                          tested={selected.testedTools.includes(t.key)}
                          disabled={busy || done}
                          title={t.desc}
                          onClick={() => void act({ type: "TEST", componentKey: selected.key, tool: t.key })}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tindakan Perbaikan</span>
                      <span className="text-[9px] font-semibold text-rose-600">salah = −1 nyawa</span>
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
                            "flex flex-col items-start gap-0.5 rounded-xl border border-border/70 bg-card px-2.5 py-2 text-left transition-all",
                            "hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <p className="text-[10px] text-muted-foreground">
                      Spare part tersedia: <span className="font-semibold text-foreground">{selected.replacementName}</span>
                    </p>
                  )}
                </CardContent>
              ) : (
                <CardContent className="p-6 text-center text-xs text-muted-foreground">
                  Pilih komponen di meja kerja untuk mulai mendiagnosis.
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      {result && (
        <ResultOverlay result={result} jobTitle={state.job.title} onRestart={() => void restart()} onExit={() => navigate("/repair")} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- pieces
function ComponentCard({
  component,
  selected,
  disabled,
  onSelect,
}: {
  component: RepairComponentState;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const Icon = iconFor(component);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        selected ? "border-primary bg-primary/5 ring-2 ring-primary/25" : "border-border/70 bg-card hover:border-primary/40 hover:shadow-soft",
        component.fixed && "border-emerald-300/70 bg-emerald-50/60",
        disabled && "cursor-default"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          component.fixed ? "bg-emerald-100 text-emerald-700" : component.inspected ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold leading-snug">{component.name}</span>
        <span className="mt-0.5 block text-[10px] text-muted-foreground">
          {component.fixed ? "Sudah diperbaiki" : component.inspected ? "Sudah diinspeksi" : "Belum dicek"}
        </span>
      </span>
      {component.fixed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : component.inspected ? (
        <Eye className="h-3.5 w-3.5 shrink-0 text-sky-500" />
      ) : (
        <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
      )}
    </button>
  );
}

function ToolButton({
  label,
  icon: Icon,
  tested,
  disabled,
  title,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
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
        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors",
        tested
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-border/70 bg-card text-foreground/80 hover:border-primary/40 hover:text-primary",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
      {tested && <CheckCircle2 className="h-3 w-3" />}
    </button>
  );
}

function LogRow({ event }: { event: RepairEvent }) {
  const meta =
    event.kind === "FIX" || event.kind === "WIN"
      ? { icon: CheckCircle2, cls: "text-emerald-600", bg: "bg-emerald-50/70 border-emerald-200/60" }
      : event.kind === "HEART_LOST" || event.kind === "LOSE" || event.kind === "TIMEOUT"
        ? { icon: XCircle, cls: "text-rose-600", bg: "bg-rose-50/70 border-rose-200/60" }
        : { icon: Lightbulb, cls: "text-sky-600", bg: "bg-sky-50/60 border-sky-200/50" };
  const Icon = meta.icon;
  return (
    <li className={cn("flex items-start gap-2 rounded-lg border px-2.5 py-2", meta.bg)}>
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.cls)} />
      <div className="min-w-0">
        <div className="text-[11px] font-bold leading-snug">{event.title}</div>
        <div className="text-[10px] leading-relaxed text-muted-foreground">{event.message}</div>
      </div>
    </li>
  );
}

function ResultOverlay({
  result,
  jobTitle,
  onRestart,
  onExit,
}: {
  result: RepairResult;
  jobTitle: string;
  onRestart: () => void;
  onExit: () => void;
}) {
  const success = result.success;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="animate-fade-in-up w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-lift">
        <div className={cn("px-6 py-7 text-center", success ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/10" : "bg-gradient-to-br from-rose-500/15 to-orange-500/10")}>
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 shadow-lift ring-4 ring-white/40">
            <span className="font-display text-4xl font-extrabold text-white">{result.grade}</span>
          </div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">{success ? "Misi Selesai" : "Misi Gagal"}</div>
          <h1 className="font-display text-2xl font-extrabold">{success ? "PC Kembali Normal! 🎉" : "Perbaikan Belum Berhasil"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{jobTitle}</p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={cn("h-7 w-7", i <= result.stars ? "fill-amber-400 text-amber-400" : "text-muted")} />
            ))}
          </div>
        </div>

        <div className="space-y-2.5 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Skor</span>
            <span className="font-display text-3xl font-extrabold text-primary">{result.score}</span>
          </div>
          <div className="h-px bg-border" />
          <MetricRow label="Akurasi tindakan" value={`${Math.round(result.accuracy * 100)}%`} />
          <MetricRow label="Bonus kecepatan" value={`${Math.round(result.speed * 100)}%`} />
          <MetricRow label="Bonus combo" value={`+${result.comboBonus}`} />
          <MetricRow label="Bonus nyawa" value={`+${result.heartBonus}`} />
          <MetricRow label="Waktu" value={formatClock(result.timeSec)} />
          <div className="mt-1 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Trophy className="h-4 w-4 text-primary" /> XP diperoleh</span>
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
