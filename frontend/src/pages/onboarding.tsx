import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check as CheckIcon, Rocket } from "lucide-react";
import { toast } from "sonner";
import { api, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const LEARNING_STYLES = [
  { value: "VISUAL", label: "Visual", desc: "Belajar lewat diagram, gambar, dan peta konsep", image: "/images/display.jpg" },
  { value: "TEKS", label: "Tekstual", desc: "Belajar lewat membaca dan catatan terstruktur", image: "/images/keyboard.jpg" },
  { value: "PRAKTIK", label: "Praktik", desc: "Belajar paling cepat lewat mencoba langsung", image: "/images/mobo.jpg" },
];

const TARGET_LEVELS = [
  { value: "DASAR", label: "Dasar", desc: "Baru mengenal troubleshooting komputer & jaringan", image: "/images/keyboard.jpg" },
  { value: "MENENGAH", label: "Menengah", desc: "Sudah bisa menangani masalah umum sendiri", image: "/images/router.jpg" },
  { value: "MAHIR", label: "Mahir", desc: "Ingin menguasai diagnosis sistematis tingkat lanjut", image: "/images/mobo.jpg" },
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

  return (
    <div className="path-page">
      <header className="simple-header">
        <Logo onClick={() => navigate("/dashboard")} />
        <div>
          <span>Halo, {user?.name?.split(" ")[0]} ðŸ‘‹</span>
          <span className="kicker">Langkah 1 dari 2</span>
        </div>
      </header>
      <main>
        <div className="path-heading">
          <span className="step-badge">KENALAN SINGKAT</span>
          <h1>Kenalan dulu, {user?.name?.split(" ")[0]}</h1>
          <p>Kami sesuaikan pengalaman belajarmu berdasarkan pilihan di bawah ini.</p>
        </div>

        <div className="onboarding-progress">
          {[0, 1].map((i) => (
            <div className="progress-track" key={i}>
              <span style={{ width: i <= step ? "100%" : "0%" }} />
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div className="onboarding-block">
            <h2 className="onboarding-question">Bagaimana kamu paling nyaman belajar?</h2>
            <div className="onboarding-options">
              {LEARNING_STYLES.map((s) => (
                <button
                  className={cn("onboarding-option", learningStyle === s.value && "selected")}
                  key={s.value}
                  onClick={() => setLearningStyle(s.value)}
                  type="button"
                >
                  <span className="option-icon"><img src={s.image} alt="" /></span>
                  <div>
                    <strong>{s.label}</strong>
                    <p>{s.desc}</p>
                  </div>
                  {learningStyle === s.value && (
                    <span className="selected-check">
                      <CheckIcon size={15} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button className="btn btn-primary full-button" disabled={!learningStyle} onClick={() => setStep(1)} type="button">
              Lanjut <Rocket size={18} />
            </button>
          </div>
        ) : (
          <div className="onboarding-block">
            <h2 className="onboarding-question">Seberapa mahir targetmu?</h2>
            <div className="onboarding-options">
              {TARGET_LEVELS.map((t) => (
                <button
                  className={cn("onboarding-option", targetLevel === t.value && "selected")}
                  key={t.value}
                  onClick={() => setTargetLevel(t.value)}
                  type="button"
                >
<span className="option-icon"><img src={t.image} alt="" /></span>
                  <div>
                    <strong>{t.label}</strong>
                    <p>{t.desc}</p>
                  </div>
                  {targetLevel === t.value && (
                    <span className="selected-check">
                      <CheckIcon size={15} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="onboarding-range">
              <div className="range-head">
                <span>Durasi belajar per sesi</span>
                <strong>{waktuPerSesiMin} menit</strong>
              </div>
              <input
                max={120}
                min={10}
                onChange={(e) => setWaktuPerSesiMin(Number(e.target.value))}
                step={10}
                type="range"
                value={waktuPerSesiMin}
              />
            </div>

            <div className="onboarding-actions">
              <button className="btn btn-secondary" onClick={() => setStep(0)} type="button">
                Kembali
              </button>
              <button className="btn btn-primary" disabled={!targetLevel || loading} onClick={() => void save()} type="button">
                {loading ? "Menyimpanâ€¦" : "Lanjut"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
