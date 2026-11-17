import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { flowTarget } from "@/lib/flow";
import { AuthLayout, AuthHeading, AuthField } from "@/components/layout/auth-layout";

const REMEMBER_KEY = "techtutor:remember-email";
const DEMO = { email: "demo1@techtutor.app", password: "demo1234" };

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: any }>("/api/auth/login", { email, password });
      login(res.token, res.user);
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      toast.success(`Selamat datang kembali, ${res.user.name}!`);
      const target = flowTarget(res.user);
      navigate(target === "/dashboard" && from && from !== "/" ? from : target, { replace: true });
    } catch (err: any) {
      setError(err.message || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO.email);
    setPassword(DEMO.password);
    setRemember(true);
    setError(null);
    toast.info("Akun demo terisi. Tekan Masuk untuk melanjutkan.");
  };

  return (
    <AuthLayout heading={<AuthHeading icon={<Lock size={20} />} subtitle="Lanjutkan progres pembelajaranmu." title="Masuk ke TechTutor AI" />}>
      <form className="space-y-3.5" onSubmit={submit}>
        {error && (
          <div
            className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-[11.5px] font-medium text-rose-200"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        <AuthField
          autoComplete="email"
          autoFocus
          icon={<Mail className="h-4 w-4" />}
          id="login-email"
          label="Email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          required
          type="email"
          value={email}
        />

        <AuthField
          action={
            <button
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              onClick={() => setShowPassword((v) => !v)}
              type="button"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          autoComplete="current-password"
          icon={<Lock className="h-4 w-4" />}
          id="login-password"
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan password"
          required
          type={showPassword ? "text" : "password"}
          value={password}
        />

        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2" htmlFor="login-remember">
            <input
              checked={remember}
              className="h-3.5 w-3.5 rounded border-white/20 bg-slate-950/40 accent-emerald-500"
              id="login-remember"
              onChange={(e) => {
                setRemember(e.target.checked);
                if (!e.target.checked) localStorage.removeItem(REMEMBER_KEY);
              }}
              type="checkbox"
            />
            <span className="text-[11px] font-medium text-slate-400">Ingat saya</span>
          </label>
          <span className="font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-slate-600">progres otomatis</span>
        </div>

        <button
          className="group flex w-full items-center gap-2.5 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.07] px-3 py-2.5 text-left transition-colors hover:border-emerald-300/40 hover:bg-emerald-300/[0.12]"
          onClick={fillDemo}
          type="button"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-emerald-200">Coba akun demo</span>
            <span className="block font-mono-tech text-[9px] text-slate-500">demo1@techtutor.app · demo1234</span>
          </span>
          <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-1 font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-300 transition-colors group-hover:bg-emerald-400 group-hover:text-slate-950">
            Isi otomatis
          </span>
        </button>

        <button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-[12.5px] font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" /> Memproses…
            </>
          ) : (
            <>
              Masuk <LogIn className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-3 pt-1">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="font-mono-tech text-[8.5px] uppercase tracking-[0.16em] text-slate-600">atau</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <p className="text-center text-[11.5px] text-slate-400">
          Belum punya akun?{" "}
          <button className="font-bold text-emerald-300 transition-colors hover:text-emerald-200" onClick={() => navigate("/register")} type="button">
            Daftar
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
