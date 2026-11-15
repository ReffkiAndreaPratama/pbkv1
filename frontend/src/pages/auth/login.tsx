import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Info, Lock, LogIn, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { flowTarget } from "@/lib/flow";
import { AuthLayout, AuthHeading } from "@/components/layout/auth-layout";

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
    <AuthLayout heading={<AuthHeading icon={<Lock size={22} />} subtitle="Lanjutkan progres pembelajaranmu." title="Masuk ke TechTutor AI" />}>
      <form className="auth-form" onSubmit={submit}>
        {error && (
          <div className="auth-error" role="alert">
            <Info size={16} /> {error}
          </div>
        )}
        <label htmlFor="login-email">
          Email
          <div className="input-wrap">
            <Mail size={18} />
            <input
              autoComplete="email"
              autoFocus
              id="login-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              type="email"
              value={email}
            />
          </div>
        </label>
        <label htmlFor="login-password">
          Password
          <div className="input-wrap has-action">
            <Lock size={18} />
            <input
              autoComplete="current-password"
              id="login-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="input-action"
              onClick={() => setShowPassword((v) => !v)}
              type="button"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="form-row">
          <label className="checkbox" htmlFor="login-remember">
            <input
              checked={remember}
              id="login-remember"
              onChange={(e) => {
                setRemember(e.target.checked);
                if (!e.target.checked) localStorage.removeItem(REMEMBER_KEY);
              }}
              type="checkbox"
            />
            <span>Ingat saya</span>
          </label>
          <span className="form-hint">Progress tersimpan otomatis</span>
        </div>
        <button className="demo-fill" onClick={fillDemo} type="button">
          <span className="demo-fill-icon">
            <Sparkles size={16} />
          </span>
          <span className="demo-fill-copy">
            <strong>Coba akun demo</strong>
            <small>demo1@techtutor.app · demo1234</small>
          </span>
          <span className="demo-fill-cta">Isi otomatis</span>
        </button>
        <button className="btn btn-primary full-button auth-submit" disabled={loading} type="submit">
          {loading ? (
            <>
              <span className="btn-spinner" /> Memproses…
            </>
          ) : (
            <>
              Masuk <LogIn size={18} />
            </>
          )}
        </button>
        <div className="auth-divider">
          <span>atau</span>
        </div>
        <p className="register-text">
          Belum punya akun?{" "}
          <button onClick={() => navigate("/register")} type="button">
            Daftar
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
