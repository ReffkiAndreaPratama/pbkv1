import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Compass,
  Gauge,
  Rocket,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const LEARNING_STYLES = [
  { value: "VISUAL", label: "Visual", desc: "Belajar lewat diagram, gambar, dan peta konsep", image: "/images/display.jpg", icon: Compass },
  { value: "TEKS", label: "Tekstual", desc: "Belajar lewat membaca dan catatan terstruktur", image: "/images/keyboard.jpg", icon: Target },
  { value: "PRAKTIK", label: "Praktik", desc: "Belajar paling cepat lewat mencoba langsung", image: "/images/mobo.jpg", icon: Rocket },
];

const TARGET_LEVELS = [
  { value: "DASAR", label: "Dasar", desc: "Baru mengenal troubleshooting komputer & jaringan", image: "/images/keyboard.jpg", icon: Sparkles },
  { value: "MENENGAH", label: "Menengah", desc: "Sudah bisa menangani masalah umum sendiri", image: "/images/router.jpg", icon: Gauge },
  { value: "MAHIR", label: "Mahir", desc: "Ingin menguasai diagnosis sistematis tingkat lanjut", image: "/images/mobo.jpg", icon: Target },
];

const STEP_META: { title: string; desc: string }[] = [
  { title: "Kenalan dulu", desc: "Gaya belajar menentukan format materi yang paling sering kami tampilkan." },
  { title: "Tentukan target", desc: "Target dan durasi sesi dipakai untuk menyusun ritme belajarmu." },
];

export function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [learningStyle, setLearningStyle] = useState<string | null>(null);
  const [targetLevel, setTargetLevel] = useState<string | null>(null);
  const [waktuPerSesiMin, setWaktuPerSesiMin] = useState(30);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await api.put("/api/profile", { learningStyle, targetLevel, waktuPerSesiMin });
      try {
        const me = await api.get<SessionUser>("/api/auth/me");
        setUser(me);
      } catch {
        if (user)
          setUser({
            ...user,
            profile: {
              ...user.profile,
              level: user.profile?.level ?? 1,
              totalXp: user.profile?.totalXp ?? 0,
              pretestDone: user.profile?.pretestDone ?? false,
              posttestDone: user.profile?.posttestDone ?? false,
              posttestScore: user.profile?.posttestScore ?? null,
              streakDays: user.profile?.streakDays ?? 0,
              learningStyle,
              targetLevel,
            },
          });
      }
      toast.success("Profil belajar disimpan!");
      navigate("/path", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] ?? "Teknisi";
  const styleLabel = LEARNING_STYLES.find((s) => s.value === learningStyle)?.label;
  const levelLabel = TARGET_LEVELS.find((t) => t.value === targetLevel)?.label;
  const options = step === 0 ? LEARNING_STYLES : TARGET_LEVELS;
  const selectedValue = step === 0 ? learningStyle : targetLevel;
  const canNext = step === 0 ? !!learningStyle : !!targetLevel;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07101d] text-white">
      <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Logo inverse onClick={() => navigate("/dashboard")} />
          <div className="flex items-center gap-2">
            <span className="hidden font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:inline">
              Halo, {firstName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200">
              Langkah 1 dari 3
            </span>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          {/* -------------------------------------------------------- intro column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-slate-300">
              <Sparkles className="h-3 w-3 text-emerald-300" /> Kenalan singkat
            </div>

            <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.5rem]">
              Biar belajarnya
              <br />
              <span className="text-gradient">pas untukmu.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Dua pertanyaan singkat. Kami pakai jawabanmu untuk menyesuaikan format materi, ritme, dan rekomendasi latihan.
            </p>

            <ol className="mt-7 space-y-2.5">
              {STEP_META.map((s, i) => {
                const state = i < step ? "done" : i === step ? "active" : "next";
                return (
                  <li key={s.title} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono-tech text-[10px] font-bold",
                        state === "done" && "border-emerald-300/30 bg-emerald-300/10 text-emerald-300",
                        state === "active" && "border-emerald-400 bg-emerald-400 text-slate-950",
                        state === "next" && "border-white/10 bg-white/5 text-slate-500"
                      )}
                    >
                      {state === "done" ? <Check className="h-3.5 w-3.5" /> : `0${i + 1}`}
                    </span>
                    <div className="min-w-0">
                      <div className={cn("text-[12.5px] font-bold", state === "next" ? "text-slate-500" : "text-white")}>
                        {s.title}
                      </div>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{s.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {[
                { icon: Clock, label: `${waktuPerSesiMin} menit / sesi` },
                { icon: Compass, label: styleLabel ?? "Gaya belum dipilih" },
                { icon: Target, label: levelLabel ?? "Target belum dipilih" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono-tech text-[8.5px] uppercase tracking-[0.1em] text-slate-400"
                >
                  <c.icon className="h-3 w-3 text-emerald-300" /> {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* -------------------------------------------------------- step card */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1628]/85 p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                pertanyaan {String(step + 1).padStart(2, "0")} / 02
              </span>
              <div className="flex gap-1">
                {STEP_META.map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1 w-8 rounded-full transition-colors", i <= step ? "bg-emerald-400" : "bg-white/10")}
                  />
                ))}
              </div>
            </div>

            <h2 className="mt-3 font-display text-lg font-extrabold leading-snug tracking-tight">
              {step === 0 ? "Bagaimana kamu paling nyaman belajar?" : "Seberapa mahir targetmu?"}
            </h2>

            <div className="mt-3.5 space-y-2">
              {options.map((o) => {
                const Icon = (o as { icon?: LucideIcon }).icon ?? Compass;
                const active = selectedValue === o.value;
                return (
                  <button
                    key={o.value}
                    aria-pressed={active}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                      active
                        ? "border-emerald-400/60 bg-emerald-400/[0.08] shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.055]"
                    )}
                    onClick={() => (step === 0 ? setLearningStyle(o.value) : setTargetLevel(o.value))}
                    type="button"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950/50">
                      <img src={o.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-70" />
                      <span className="absolute inset-0 bg-gradient-to-t from-[#0b1628]/80 to-transparent" />
                      <Icon className="absolute bottom-1 right-1 h-3 w-3 text-emerald-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-bold text-white">{o.label}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-400">{o.desc}</span>
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        active ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-white/20 bg-white/5"
                      )}
                      aria-hidden
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {step === 1 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    <Clock className="h-3 w-3 text-emerald-300" /> Durasi per sesi
                  </span>
                  <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 font-mono-tech text-[10px] font-bold text-emerald-300">
                    {waktuPerSesiMin} menit
                  </span>
                </div>
                <input
                  className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
                  max={120}
                  min={10}
                  onChange={(e) => setWaktuPerSesiMin(Number(e.target.value))}
                  step={10}
                  type="range"
                  value={waktuPerSesiMin}
                />
                <div className="mt-1 flex justify-between font-mono-tech text-[8px] uppercase tracking-[0.1em] text-slate-600">
                  <span>10 mnt</span>
                  <span>60 mnt</span>
                  <span>120 mnt</span>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              {step === 1 && (
                <button
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 text-[11.5px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => setStep(0)}
                  type="button"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Kembali
                </button>
              )}
              <button
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-[12px] font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canNext || loading}
                onClick={() => (step === 0 ? setStep(1) : void save())}
                type="button"
              >
                {step === 0 ? (
                  <>
                    Lanjut <ArrowRight className="h-4 w-4" />
                  </>
                ) : loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" /> Menyimpan…
                  </>
                ) : (
                  <>
                    Simpan & pilih jalur <Rocket className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <p className="mt-2.5 text-center font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-slate-600">
              jawaban bisa diubah kapan saja lewat profil
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-slate-600">
          <span>TechTutor AI · kalibrasi belajar</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> data tersimpan lokal & server
          </span>
        </footer>
      </div>
    </div>
  );
}
