import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MonitorCog, Eye, BookOpenText, Hand, Rocket, Check as CheckIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LEARNING_STYLES = [
  { value: "VISUAL", label: "Visual", desc: "Belajar lewat diagram, gambar, dan peta konsep", icon: Eye },
  { value: "TEKS", label: "Tekstual", desc: "Belajar lewat membaca dan catatan terstruktur", icon: BookOpenText },
  { value: "PRAKTIK", label: "Praktik", desc: "Belajar paling cepat lewat mencoba langsung", icon: Hand },
];

const TARGET_LEVELS = [
  { value: "DASAR", label: "Dasar", desc: "Baru mengenal troubleshooting komputer & jaringan" },
  { value: "MENENGAH", label: "Menengah", desc: "Sudah bisa menangani masalah umum sendiri" },
  { value: "MAHIR", label: "Mahir", desc: "Ingin menguasai diagnosis sistematis tingkat lanjut" },
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
      await api.put("/api/profile", {
        learningStyle,
        targetLevel,
        waktuPerSesiMin,
      });
      if (user) setUser({ ...user, profile: { level: 1, totalXp: 0, pretestDone: false, posttestDone: false, posttestScore: null, streakDays: 0, learningStyle, targetLevel } });
      toast.success("Profil belajar disimpan!");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-8%] h-[440px] w-[440px] rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute bottom-[-12%] left-[-10%] h-[400px] w-[400px] rounded-full bg-circuit/15 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
        <div className="absolute inset-0 bg-grid opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-cyan-600 to-circuit text-white shadow-glow">
            <MonitorCog className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            Kenalan dulu, <span className="text-gradient">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Kami sesuaikan pengalaman belajarmu berdasarkan pilihan di bawah ini.</p>
        </div>

        <div className="mb-5 flex gap-1.5">
          {[0, 1].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        {step === 0 ? (
          <div className="animate-fade-in space-y-4">
            <Label className="text-base font-bold">Bagaimana kamu paling nyaman belajar?</Label>
            <div className="space-y-2.5">
              {LEARNING_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setLearningStyle(s.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                    learningStyle === s.value ? "border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]" : "border-border/70 bg-card hover:border-primary/30"
                  )}
                >
                  <s.icon className={cn("h-5 w-5", learningStyle === s.value ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  {learningStyle === s.value && <CheckIcon className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!learningStyle} className="gap-2">
                Lanjut <Rocket className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-4">
            <Label className="text-base font-bold">Seberapa mahir targetmu?</Label>
            <div className="space-y-2.5">
              {TARGET_LEVELS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTargetLevel(t.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                    targetLevel === t.value ? "border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]" : "border-border/70 bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.desc}</div>
                  </div>
                  {targetLevel === t.value && <CheckIcon className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durasi belajar per sesi (menit): {waktuPerSesiMin}</Label>
              <Input id="duration" type="range" min={10} max={120} step={10} value={waktuPerSesiMin} onChange={(e) => setWaktuPerSesiMin(Number(e.target.value))} />
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Kembali
              </Button>
              <Button onClick={() => void save()} disabled={!targetLevel || loading}>
                {loading ? "Menyimpan…" : "Mulai Belajar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}