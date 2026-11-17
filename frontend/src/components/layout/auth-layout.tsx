import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, MonitorCog, Sparkles, Trophy, Wrench } from "lucide-react";
import { Logo } from "./logo";

const highlights = [
  { icon: Wrench, text: "Bengkel PC & laptop dengan misi perbaikan interaktif" },
  { icon: Brain, text: "Kuis adaptif yang menyesuaikan kemampuanmu" },
  { icon: Trophy, text: "XP, level teknisi, streak, dan pencapaian" },
];

const stats = [
  { value: "18", label: "Misi bengkel" },
  { value: "24", label: "Modul materi" },
  { value: "6", label: "Skill inti" },
];

export function AuthLayout({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#07101d] text-white lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* ------------------------------------------------------------- brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-white/[0.07] lg:flex lg:flex-col lg:justify-between lg:p-10">
        <img src="/images/auth.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#07101d] via-[#07101d]/85 to-[#0b1b31]/80" />
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />

        <div className="relative">
          <Logo inverse onClick={() => navigate("/")} />

          <div className="mt-14 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              <Sparkles className="h-3 w-3" /> Platform belajar troubleshooting
            </div>
            <h2 className="mt-5 font-display text-[2.1rem] font-extrabold leading-[1.1] tracking-tight">
              Dari gejala
              <br />
              ke <span className="text-gradient">solusi nyata.</span>
            </h2>
            <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
              Bangun kemampuan diagnosis perangkat secara bertahap — baca, latih, bongkar, lalu ukur progresmu.
            </p>

            <ul className="mt-7 space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-emerald-300 ring-1 ring-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="pt-1.5 text-[11.5px] leading-snug text-slate-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#081322]/90 px-3 py-3">
                <div className="font-display text-xl font-extrabold leading-none">{s.value}</div>
                <div className="mt-1 font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between font-mono-tech text-[9px] uppercase tracking-[0.16em] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <MonitorCog className="h-3 w-3" /> TechTutor AI
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> sistem siap
            </span>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- form panel */}
      <main className="relative flex min-h-screen flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_-10%,rgba(59,130,246,0.10),transparent_55%)]" aria-hidden />

        <div className="relative flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Beranda
          </button>
          <div className="lg:hidden">
            <Logo inverse onClick={() => navigate("/")} />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-[23rem]">
            <div className="rounded-2xl border border-white/10 bg-[#0b1628]/80 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-7">
              {heading}
              <div className="mt-6">{children}</div>
            </div>
            <p className="mt-5 text-center font-mono-tech text-[9px] uppercase tracking-[0.16em] text-slate-600">
              Belajar · berlatih · perbaiki · naik level
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25">
        {icon}
      </span>
      <h1 className="mt-4 font-display text-xl font-extrabold leading-tight tracking-tight text-white">{title}</h1>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-400">{subtitle}</p>
    </div>
  );
}

/** Shared input shell for the auth forms. */
export function AuthField({
  id,
  label,
  icon,
  action,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          id={id}
          className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/40 pl-9 pr-3 text-[12.5px] font-medium text-white placeholder:text-slate-600 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-400/15 disabled:opacity-60"
          {...props}
        />
        {action && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{action}</span>}
      </span>
    </label>
  );
}
