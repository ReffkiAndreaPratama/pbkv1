import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cpu,
  Gauge,
  Laptop,
  MessageSquare,
  MonitorCog,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth";

const steps = [
  {
    icon: BookOpen,
    label: "Baca",
    title: "Pahami gejalanya",
    text: "Modul ringkas menjelaskan aliran daya, POST, dan komponen inti tanpa teori bertele-tele.",
  },
  {
    icon: ClipboardList,
    label: "Latih",
    title: "Uji pemahaman",
    text: "Kuis adaptif menyesuaikan tingkat kesulitan dengan penguasaanmu saat ini.",
  },
  {
    icon: Wrench,
    label: "Bongkar",
    title: "Perbaiki perangkat",
    text: "Simulasi bengkel interaktif: pasang, lepas, dan diagnosis komponen pada PC atau laptop.",
  },
  {
    icon: Gauge,
    label: "Ukur",
    title: "Lihat progresnya",
    text: "Mastery per skill, XP, level teknisi, dan laporan evaluasi yang bisa kamu pantau.",
  },
];

const features = [
  { icon: Wrench, title: "Bengkel interaktif", text: "Casing PC & laptop dengan hotspot komponen yang benar-benar bisa dipasang dan dilepas." },
  { icon: Brain, title: "Adaptive learning", text: "Materi, latihan, dan simulasi menyesuaikan kemampuanmu, bukan satu jalur untuk semua." },
  { icon: MessageSquare, title: "AI Tutor kontekstual", text: "Memandu dengan pertanyaan dan petunjuk, bukan langsung membocorkan jawaban." },
  { icon: Trophy, title: "Gamifikasi nyata", text: "XP, level teknisi, streak harian, pencapaian, dan papan peringkat." },
  { icon: ShieldCheck, title: "Umpan balik edukatif", text: "Setiap langkah salah dijelaskan sebabnya, jadi kamu belajar dari kesalahan." },
  { icon: Target, title: "Dua jalur perangkat", text: "Kurikulum PC desktop dan laptop dengan karakteristik diagnosis yang berbeda." },
];

const paths = [
  {
    type: "PC" as const,
    icon: Cpu,
    title: "Troubleshooting PC",
    text: "Komponen, power, RAM, storage, GPU, PSU, motherboard, hingga BIOS/UEFI.",
    topics: ["Komponen", "Power & PSU", "RAM", "Storage", "GPU", "BIOS/UEFI"],
    image: "/materials/power.jpg",
    accent: "text-emerald-300",
    chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  },
  {
    type: "LAPTOP" as const,
    icon: Laptop,
    title: "Troubleshooting Laptop",
    text: "Power & charging, baterai, RAM & storage, display, cooling, hingga konektivitas.",
    topics: ["Charging", "Baterai", "Display", "Cooling", "Wi-Fi", "Keyboard"],
    image: "/materials/boot.jpg",
    accent: "text-sky-300",
    chip: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  },
];

const stats = [
  { value: "18", label: "Simulasi bengkel" },
  { value: "24", label: "Modul materi" },
  { value: "6", label: "Kategori skill" },
  { value: "2", label: "Jalur perangkat" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const start = () => navigate(user ? "/dashboard" : "/login");

  return (
    <div className="min-h-screen bg-[#07101d] text-white">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#07101d]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo inverse onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <nav className="hidden items-center gap-6 md:flex">
            {[
              { label: "Cara belajar", href: "#cara-belajar" },
              { label: "Jalur", href: "#jalur" },
              { label: "Fitur", href: "#fitur" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(user ? "/profile" : "/login")}
              className="inline-flex h-8 items-center rounded-lg px-3 text-[11.5px] font-semibold text-slate-300 transition-colors hover:text-white"
            >
              {user ? "Profil" : "Masuk"}
            </button>
            <button
              type="button"
              onClick={start}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 text-[11.5px] font-bold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              Mulai belajar <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-blue-600/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              <Sparkles className="h-3 w-3" /> Platform belajar troubleshooting
            </div>

            <h1 className="mt-5 font-display text-[2.2rem] font-extrabold leading-[1.05] tracking-tight sm:text-[3rem] lg:text-[3.4rem]">
              Belajar bongkar
              <br />
              <span className="text-gradient">PC & laptop</span>
              <br />
              dari gejalanya.
            </h1>

            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-slate-400">
              TechTutor AI mengubah teori troubleshooting jadi praktik nyata — baca gejalanya, pilih langkah diagnosis, dan
              perbaiki perangkat di bengkel simulasi.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={start}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-[12.5px] font-bold text-slate-950 shadow-[0_12px_30px_-12px_rgba(16,185,129,0.9)] transition-colors hover:bg-emerald-400"
              >
                <Play className="h-4 w-4" /> Mulai belajar gratis
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 text-[12.5px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                Sudah punya akun <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> tanpa kartu kredit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> langsung praktik
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> progres tersimpan
              </span>
            </div>
          </div>

          {/* terminal / device visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1628] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-1.5 border-b border-white/[0.08] px-3.5 py-2.5">
                <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono-tech text-[9px] uppercase tracking-[0.18em] text-slate-500">bengkel.session</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-1.5 py-0.5 font-mono-tech text-[8px] font-bold text-emerald-300">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-300" /> LIVE
                </span>
              </div>

              <div className="relative h-40 overflow-hidden sm:h-48">
                <img src="/images/hero.jpg" alt="Teknisi memperbaiki komputer" loading="eager" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1628] via-[#0b1628]/40 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/60 px-2.5 py-1 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.16em] text-slate-300 backdrop-blur-sm">
                  <MonitorCog className="h-3 w-3" /> unit #PC-07
                </div>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                  <div>
                    <div className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.18em] text-emerald-300">diagnosis</div>
                    <div className="font-display text-lg font-extrabold leading-tight">Mati total, tanpa LED</div>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono-tech text-[8.5px] font-bold text-emerald-300">
                    READY
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 font-mono-tech text-[10px] leading-relaxed">
                <div className="flex items-center gap-2 text-slate-500">
                  <Terminal className="h-3 w-3 text-emerald-300" />
                  <span className="text-emerald-300">$</span> cek jalur daya
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <span className="text-slate-600">01</span>
                  <span>outlet → kabel → saklar PSU</span>
                  <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-400" />
                </div>
                <div className="flex items-start gap-2 text-slate-400">
                  <span className="text-slate-600">02</span>
                  <span>ukur rail 12V / 5V</span>
                  <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-400" />
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-600">03</span>
                  <span>ganti PSU · uji POST</span>
                  <span className="ml-auto inline-flex items-center gap-1 font-bold text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> OK
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                  <span className="text-emerald-300">$</span> skor 92 · +140 XP
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-xl border border-white/10 bg-[#0d1c31]/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">level teknisi</div>
                <div className="font-display text-sm font-extrabold leading-none">Naik 3 level</div>
              </div>
            </div>

            <div className="absolute -right-3 -top-4 hidden items-center gap-2.5 rounded-xl border border-white/10 bg-[#0d1c31]/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300 ring-1 ring-amber-300/25">
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.14em] text-slate-500">streak</div>
                <div className="font-display text-sm font-extrabold leading-none">7 hari</div>
              </div>
            </div>
          </div>
        </div>

        {/* stat strip */}
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#081322] px-4 py-4">
                <div className="font-display text-2xl font-extrabold tracking-tight text-white">{s.value}</div>
                <div className="mt-0.5 font-mono-tech text-[9px] uppercase tracking-[0.16em] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- steps */}
      <section id="cara-belajar" className="relative border-t border-white/[0.07] bg-[#081322]">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-300">Cara belajar</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                Satu siklus, empat kebiasaan.
              </h2>
            </div>
            <p className="max-w-sm text-[12px] leading-relaxed text-slate-400">
              Setiap aktivitas saling terhubung — materi yang kamu baca langsung terpakai di bengkel.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <article
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-emerald-300/30 hover:bg-white/[0.055]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300 ring-1 ring-white/10">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="font-mono-tech text-[10px] font-bold text-slate-600">0{i + 1}</span>
                </div>
                <div className="mt-3 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.18em] text-slate-500">{s.label}</div>
                <h3 className="mt-1 font-display text-[15px] font-extrabold leading-snug text-white">{s.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{s.text}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="pointer-events-none absolute -right-1 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/10 lg:block" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- paths */}
      <section id="jalur" className="relative overflow-hidden border-t border-white/[0.07]">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-sky-300">Jalur pembelajaran</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Pilih medan praktikmu.</h2>
            </div>
            <button
              type="button"
              onClick={start}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-[11.5px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              Bandingkan jalur <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {paths.map((p) => (
              <article
                key={p.type}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20"
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081322] via-[#081322]/30 to-transparent" />
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm ${p.chip}`}>
                    <p.icon className="h-3 w-3" /> jalur {p.type}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-display text-lg font-extrabold leading-tight">{p.title}</h3>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-[11.5px] leading-relaxed text-slate-400">{p.text}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.topics.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-950/40 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-400"
                      >
                        <Check className={`h-2.5 w-2.5 ${p.accent}`} /> {t}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={start}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] text-[11.5px] font-bold text-white transition-colors hover:bg-emerald-500 hover:text-slate-950"
                  >
                    Lihat jalur {p.type === "PC" ? "PC" : "Laptop"} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- features */}
      <section id="fitur" className="relative border-t border-white/[0.07] bg-[#081322]">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-violet-300">Di dalam bengkel</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Bukan sekadar kuis.</h2>
            </div>
            <p className="max-w-sm text-[12px] leading-relaxed text-slate-400">
              Semua yang kamu butuhkan untuk berpindah dari “tahu teorinya” ke “bisa memperbaikinya”.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300 ring-1 ring-white/10">
                  <f.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 font-display text-[14px] font-extrabold text-white">{f.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden border-t border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.12] via-transparent to-blue-500/10" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1628] p-6 sm:p-9">
            <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-60" aria-hidden />
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.2em] text-emerald-300">Siap mulai?</div>
                <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-[2rem]">
                  Buka casing pertamamu hari ini.
                </h2>
                <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-slate-400">
                  Gratis, tanpa instalasi. Mulai dari pretest singkat, lalu masuk ke bengkel simulasi sesuai jalurmu.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-[12.5px] font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  Mulai belajar <ArrowRight className="h-4 w-4" />
                </button>
                <span className="text-center font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  akun demo tersedia
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- footer */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-7 sm:flex-row sm:items-center sm:px-8">
          <Logo inverse onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <p className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-slate-600">
            Platform pembelajaran troubleshooting · PC & laptop
          </p>
          <small className="font-mono-tech text-[9.5px] uppercase tracking-[0.14em] text-slate-600">
            © {new Date().getFullYear()} TechTutor AI
          </small>
        </div>
      </footer>
    </div>
  );
}
