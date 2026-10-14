import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ClipboardList,
  Cpu,
  Monitor,
  Sparkles,
  Target,
  MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth";

const features = [
  { icon: BookOpen, title: "Materi Interaktif", text: "Konsep dasar troubleshooting dengan penjelasan yang mudah dipahami." },
  { icon: ClipboardList, title: "Latihan", text: "Uji pemahaman melalui soal berbasis gejala dan penyebab." },
  { icon: Monitor, title: "Simulasi", text: "Berlatih mengambil langkah diagnosis yang tepat pada kasus nyata." },
  { icon: Brain, title: "Adaptive Learning", text: "Materi, latihan, dan simulasi menyesuaikan kemampuanmu." },
  { icon: MessageSquare, title: "AI Tutor", text: "Panduan kontekstual yang memandu tanpa langsung memberi jawaban." },
];

const paths = [
  {
    type: "PC",
    title: "Troubleshooting PC",
    text: "Pelajari komponen, power, RAM, storage, GPU, PSU, motherboard, hingga BIOS/UEFI.",
    topics: ["Komponen", "Power & PSU", "RAM", "Storage", "GPU", "Motherboard", "BIOS/UEFI", "Perangkat Input"],
  },
  {
    type: "LAPTOP",
    title: "Troubleshooting Laptop",
    text: "Pahami diagnosis masalah pada laptop dengan karakteristik perangkat terintegrasi.",
    topics: ["Power & Charging", "Baterai", "RAM & Storage", "Display", "Cooling", "Keyboard & Touchpad", "Wi-Fi", "Konektivitas"],
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const start = () => navigate(user ? "/dashboard" : "/login");

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo onClick={() => window.scrollTo({ top: 0 })} />
        <div className="landing-actions">
          <button className="btn btn-ghost" onClick={() => navigate(user ? "/profile" : "/login")} type="button">
            {user ? "Profil" : "Masuk"}
          </button>
          <button className="btn btn-primary" onClick={start} type="button">
            Mulai Belajar
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={16} /> Platform Belajar Troubleshooting
            </span>
            <h1>
              Belajar Troubleshooting PC dan Laptop dengan Cara yang <span>Lebih Interaktif</span>
            </h1>
            <p>
              Pelajari cara mengenali masalah, memahami penyebab, dan menentukan langkah troubleshooting melalui materi, latihan,
              simulasi, dan AI Tutor.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={start} type="button">
                Mulai Belajar <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/login")} type="button">
                Login
              </button>
            </div>
            <div className="hero-note">
              <Check size={16} /> Belajar sesuai kemampuanmu, selangkah demi selangkah.
            </div>
          </div>

          <div className="hero-visual" aria-label="Ilustrasi dashboard pembelajaran">
            <div className="visual-window">
              <div className="window-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="window-content photo">
                <img src="/images/hero.jpg" alt="Teknisi sedang memperbaiki komputer" loading="eager" />
                <div className="photo-caption">
                  <strong>Teknisi di bengkel komputer</strong>
                  <small>Mengenali gejala lebih penting daripada menghafal solusi.</small>
                </div>
              </div>
            </div>
            <div className="floating-card tutor">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <strong>AI Tutor</strong>
                <small>Siap membantu belajarmu</small>
              </div>
            </div>
            <div className="floating-card progress">
              <span>
                <Target size={18} />
              </span>
              <div>
                <strong>+22%</strong>
                <small>Peningkatan hasil</small>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-section">
          <div className="section-heading">
            <span className="kicker">CARA BELAJAR</span>
            <h2>Semua yang kamu butuhkan untuk belajar</h2>
            <p>Belajar lebih terarah dengan aktivitas yang saling terhubung.</p>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <div className="feature-card" key={f.title}>
                <span className="feature-icon">
                  <f.icon size={21} />
                </span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="learning-section">
          <div className="section-heading">
            <span className="kicker">JALUR PEMBELAJARAN</span>
            <h2>Pilih perangkat yang ingin kamu kuasai</h2>
          </div>
          <div className="learning-grid">
            {paths.map((p) => (
              <article className="learning-card" key={p.type}>
                <div className={p.type === "PC" ? "device-illustration pc-device" : "device-illustration laptop-device"}>
                  {p.type === "PC" ? (
                    <img src="/materials/power.jpg" alt="Komponen di dalam PC" loading="lazy" />
                  ) : (
                    <img src="/materials/boot.jpg" alt="Komponen di dalam laptop" loading="lazy" />
                  )}
                </div>
                <div className="learning-card-content">
                  <span>JALUR {p.type}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  <div className="topic-list">
                    {p.topics.map((t) => (
                      <span key={t}>
                        <Check size={15} />
                        {t}
                      </span>
                    ))}
                  </div>
                  <button onClick={start} type="button">
                    Lihat jalur <ArrowRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-section">
          <div className="section-heading">
            <span className="kicker">METODE BELAJAR</span>
            <h2>Belajar adaptif bersama TechTutor AI</h2>
            <p>Setiap aktivitas dibandingkan dengan kemampuanmu saat ini, lalu materi berikutnya disiapkan otomatis.</p>
          </div>
          <div className="feature-grid">
            {[
              { icon: ClipboardList, title: "20 Kasus Simulasi", text: "Pohon keputusan diagnosis lengkap dengan sinyal dan efek." },
              { icon: Cpu, title: "6 Kategori Skill", text: "Komponen, power, jaringan, storage, sistem, dan peripheral." },
              { icon: Brain, title: "Mastery Tracking", text: "Novice, Developing, sampai Proficient per kategori skill." },
              { icon: Target, title: "Gamifikasi", text: "XP, level, streak harian, achievement, dan papan peringkat." },
              { icon: Sparkles, title: "AI Tutor Mock", text: "Router intent deterministik yang tidak pernah memberi spoilers." },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <span className="feature-icon">
                  <f.icon size={21} />
                </span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <Logo />
        <span>Platform pembelajaran troubleshooting untuk semua.</span>
        <small>© {new Date().getFullYear()} TechTutor AI</small>
      </footer>
    </div>
  );
}