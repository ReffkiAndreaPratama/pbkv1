import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./logo";

export function AuthLayout({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <img src="/images/auth.jpg" alt="" className="auth-brand-bg" loading="eager" />
        <div className="auth-brand-overlay" />
        <Logo inverse />
        <div className="auth-brand-copy">
          <h2>Belajar troubleshooting menjadi lebih mudah.</h2>
          <p>Bangun kemampuan diagnosis perangkat secara bertahap melalui pengalaman belajar yang interaktif.</p>
        </div>
        <small>Platform Pembelajaran Berbantuan Komputer</small>
      </div>
      <main className="auth-main">
        <button className="back-link" onClick={() => navigate("/")} type="button">
          <span>←</span> Kembali ke beranda
        </button>
        <div className="auth-card-wrap">
          {heading}
          {children}
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