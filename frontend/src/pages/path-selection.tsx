import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  HardDrive,
  Info,
  Laptop,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth";
import { useJalur, type Jalur } from "@/lib/learning-path";
import { cn } from "@/lib/utils";

const pathData: Array<{
  type: Jalur;
  image: string;
  title: string;
  text: string;
  topics: string[];
  icon: typeof Cpu;
  accent: string;
  glow: string;
  stats: { label: string; value: string }[];
}> = [
  {
    type: "PC",
    image: "/images/hero.jpg",
    title: "Troubleshooting PC",
    text: "Kuasai perakitan dan diagnosis komputer desktop — dari pasokan daya sampai POST.",
    topics: ["Komponen", "Power & PSU", "RAM", "Storage", "GPU", "Motherboard", "BIOS/UEFI", "Perangkat Input"],
    icon: Cpu,
    accent: "text-emerald-300",
    glow: "bg-emerald-400/20",
    stats: [
      { label: "Simulasi", value: "12 kasus" },
      { label: "Fokus", value: "Hardware" },
    ],
  },
  {
    type: "Laptop",
    image: "/materials/boot.jpg",
    title: "Troubleshooting Laptop",
    text: "Pahami perangkat terintegrasi — baterai, sirkulasi panas, layar, dan konektivitas.",
    topics: ["Power & Charging", "Baterai", "RAM & Storage", "Display", "Cooling", "Keyboard & Touchpad", "Wi-Fi", "Konektivitas"],
    icon: Laptop,
    accent: "text-sky-300",
    glow: "bg-sky-400/20",
    stats: [
      { label: "Simulasi", value: "6 kasus" },
      { label: "Fokus", value: "Portable" },
    ],
  },
];

export function PathSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jalur, setJalur } = useJalur();
  const [selected, setSelected] = useState<Jalur>(jalur);

  const active = pathData.find((p) => p.type === selected) ?? pathData[0];

  const confirm = (target: Jalur = selected) => {
    setJalur(target);
    toast.success(`Jalur aktif: ${target === "PC" ? "Troubleshooting PC" : "Troubleshooting Laptop"}`);
    navigate(user?.profile?.pretestDone ? "/dashboard" : "/quiz/pretest", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07101d] text-white">
      <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:py-8">
        {/* ------------------------------------------------------------ header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Logo inverse onClick={() => navigate("/dashboard")} />
          <div className="flex items-center gap-2">
            <span className="hidden font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:inline">
              Setup jalur
            </span>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 text-[11.5px] font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MonitorCog className="h-3.5 w-3.5" /> Dashboard
            </button>
          </div>
        </header>

        <div className="grid flex-1 items-start gap-8 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10 lg:py-6">
          {/* -------------------------------------------------------- intro column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Langkah 2 dari 3
            </div>

            <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.6rem]">
              Pilih jalur
              <br />
              <span className="text-gradient">bengkelmu.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Tentukan perangkat yang ingin kamu kuasai. Semua materi dan simulasi akan disesuaikan dengan jalur ini — dan bisa
              diganti kapan saja lewat profil.
            </p>

            <ol className="mt-7 space-y-2.5">
              {[
                { label: "Buat akun", state: "done" as const },
                { label: "Pilih jalur perangkat", state: "active" as const },
                { label: "Kalibrasi lewat pretest", state: "next" as const },
              ].map((s, i) => (
                <li key={s.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono-tech text-[10px] font-bold",
                      s.state === "done" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-300",
                      s.state === "active" && "border-emerald-400 bg-emerald-400 text-slate-950",
                      s.state === "next" && "border-white/10 bg-white/5 text-slate-500"
                    )}
                  >
                    {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : `0${i + 1}`}
                  </span>
                  <span
                    className={cn(
                      "text-[12.5px] font-semibold",
                      s.state === "active" ? "text-white" : s.state === "done" ? "text-slate-300" : "text-slate-500"
                    )}
                  >
                    {s.label}
                  </span>
                  {s.state === "active" && (
                    <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                      sekarang
                    </span>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Jalur hanya memengaruhi urutan materi dan rekomendasi simulasi. Semua kategori skill tetap bisa kamu pelajari.
              </p>
            </div>
          </div>

          {/* -------------------------------------------------------- choice column */}
          <div className="space-y-3">
            {pathData.map((p) => {
              const isActive = selected === p.type;
              const Icon = p.icon;
              return (
                <article
                  key={p.type}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  onClick={() => setSelected(p.type)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(p.type);
                    }
                  }}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200",
                    isActive
                      ? "border-emerald-400/60 bg-[#0d1c31] shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_18px_50px_-20px_rgba(16,185,129,0.55)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.055]"
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-2xl transition-opacity",
                      p.glow,
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                    )}
                    aria-hidden
                  />

                  <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/50 sm:h-auto sm:w-36 lg:w-40">
                      <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-70" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-[#0b1628]/30 to-transparent sm:bg-gradient-to-r" />
                      <span
                        className={cn(
                          "absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm",
                          isActive
                            ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                            : "border-white/15 bg-slate-950/50 text-slate-300"
                        )}
                      >
                        <Icon className="h-3 w-3" /> {p.type}
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        jalur.device
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-display text-lg font-extrabold leading-tight tracking-tight">{p.title}</h2>
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isActive ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-white/20 bg-white/5"
                          )}
                          aria-hidden
                        >
                          {isActive && <Check className="h-3 w-3" />}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">{p.text}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.topics.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-950/40 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-400"
                          >
                            <Check className={cn("h-2.5 w-2.5", p.accent)} /> {t}
                          </span>
                        ))}
                        <span className="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono-tech text-[9px] font-bold text-slate-500">
                          +{p.topics.length - 6} lainnya
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3 border-t border-white/[0.07] pt-2.5">
                        {p.stats.map((s) => (
                          <span key={s.label} className="inline-flex items-baseline gap-1.5">
                            <span className="font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-slate-500">{s.label}</span>
                            <span className="font-mono-tech text-[10px] font-bold text-slate-300">{s.value}</span>
                          </span>
                        ))}
                        <span className="ml-auto inline-flex items-center gap-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          <HardDrive className="h-3 w-3" /> terintegrasi
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* confirm bar */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1628]/80 p-4 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Jalur dipilih
                    </div>
                    <div className="truncate text-[12.5px] font-bold text-white">{active.title}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => confirm()}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  Lanjutkan <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.07] pt-2.5 font-mono-tech text-[9px] uppercase tracking-[0.12em] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> bisa diganti kapan saja
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-sky-300" /> progres tersimpan otomatis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-300" /> lanjut ke pretest
                </span>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-slate-600">
          <span>TechTutor AI · bengkel belajar</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> sistem siap
          </span>
        </footer>
      </div>
    </div>
  );
}
