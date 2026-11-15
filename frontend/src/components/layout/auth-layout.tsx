import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, Trophy, Wrench } from "lucide-react";
import { Logo } from "./logo";

const highlights = [
  { icon: Wrench, text: "Bengkel PC: 12 misi perbaikan interaktif" },
  { icon: Brain, text: "Kuis adaptif yang menyesuaikan kemampuanmu" },
  { icon: Trophy, text: "XP, level, streak, dan 15 achievement" },
];

export function AuthLayout({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <img src="/images/auth.jpg" alt="" className="auth-brand-bg" loading="eager" />
        <div className="auth-brand-overlay" />
        <Logo inverse onClick={() => navigate("/")} />
        <div className="auth-brand-copy">
          <span className="auth-eyebrow">
            <Sparkles size={14} /> Platform Belajar Troubleshooting
          </span>
          <h2>Belajar troubleshooting menjadi lebih mudah.</h2>
          <p>Bangun kemampuan diagnosis perangkat secara bertahap melalui pengalaman belajar yang interaktif.</p>
          <ul className="auth-highlights">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="auth-highlight-icon">
                  <Icon size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-brand-foot">
          <div className="auth-stat">
            <strong>12</strong>
            <span>Misi bengkel</span>
          </div>
          <div className="auth-stat">
            <strong>32</strong>
            <span>Kasus simulasi</span>
          </div>
          <div className="auth-stat">
            <strong>15</strong>
            <span>Achievement</span>
          </div>
        </div>
        <small>Platform Pembelajaran Berbantuan Komputer</small>
      </aside>
      <main className="auth-main">
        <div className="auth-topbar">
          <button className="back-link" onClick={() => navigate("/")} type="button">
            <span aria-hidden>←</span> Kembali ke beranda
          </button>
          <div className="auth-mobile-brand">
            <Logo onClick={() => navigate("/")} />
            <span>Belajar troubleshooting, level demi level.</span>
          </div>
        </div>
        <div className="auth-stack">
          <div className="auth-card-wrap">
            {heading}
            {children}
          </div>
          <p className="auth-footnote">TechTutor AI · Belajar, berlatih, perbaiki, lalu naik level.</p>
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <>
      <span className="auth-icon">{icon}</span>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{subtitle}</p>
    </>
  );
}
