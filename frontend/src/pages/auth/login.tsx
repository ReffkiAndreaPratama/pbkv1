import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, Info, LogIn } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { flowTarget } from "@/lib/flow";
import { AuthLayout, AuthHeading } from "@/components/layout/auth-layout";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      toast.success(`Selamat datang kembali, ${res.user.name}!`);
      const target = flowTarget(res.user);
      navigate(target === "/dashboard" && from && from !== "/" ? from : target, { replace: true });
    } catch (err: any) {
      setError(err.message || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading={<AuthHeading icon={<Lock size={22} />} subtitle="Lanjutkan progres pembelajaranmu." title="Masuk ke TechTutor AI" />}>
      <form className="auth-form" onSubmit={submit}>
        {error && (
          <div className="auth-error">
            <Info size={16} /> {error}
          </div>
        )}
          <label>
            Email
            <div className="input-wrap">
              <Mail size={18} />
              <input
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                type="email"
                value={email}
              />
            </div>
          </label>
          <label>
            Password
            <div className="input-wrap">
              <Lock size={18} />
              <input
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                type="password"
                value={password}
              />
            </div>
          </label>
          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" /> <span>Ingat saya</span>
            </label>
            <span className="form-hint">Akun demo: demo1@techtutor.app / demo1234</span>
          </div>
          <button className="btn btn-primary full-button" disabled={loading} type="submit">
            {loading ? "Memproses…" : "Masuk"}
            {!loading && <LogIn size={18} />}
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