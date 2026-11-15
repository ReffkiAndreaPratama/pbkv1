import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Info, Lock, Mail, UserRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AuthLayout, AuthHeading } from "@/components/layout/auth-layout";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = password.length >= 8 && /\d/.test(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordValid) {
      setError("Password minimal 8 karakter dan harus mengandung angka.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: any }>("/api/auth/register", { name, email, password });
      login(res.token, res.user);
      toast.success("Akun berhasil dibuat! Yuk kenalan dulu.");
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading={<AuthHeading icon={<UserPlus size={22} />} subtitle="Buat akun pelajar untuk menyimpan progress dan profil kemampuanmu." title="Daftar ke TechTutor AI" />}
    >
      <form className="auth-form" onSubmit={submit}>
        {error && (
          <div className="auth-error" role="alert">
            <Info size={16} /> {error}
          </div>
        )}
        <label htmlFor="register-name">
          Nama Lengkap
          <div className="input-wrap">
            <UserRound size={18} />
            <input
              autoComplete="name"
              autoFocus
              id="register-name"
              minLength={3}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              value={name}
            />
          </div>
        </label>
        <label htmlFor="register-email">
          Email
          <div className="input-wrap">
            <Mail size={18} />
            <input
              autoComplete="email"
              id="register-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              type="email"
              value={email}
            />
          </div>
        </label>
        <label htmlFor="register-password">
          Password
          <div className="input-wrap has-action">
            <Lock size={18} />
            <input
              autoComplete="new-password"
              id="register-password"
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
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
        <label htmlFor="register-confirm">
          Ulangi Password
          <div className="input-wrap has-action">
            <Lock size={18} />
            <input
              autoComplete="new-password"
              id="register-confirm"
              minLength={8}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password"
              required
              type={showConfirm ? "text" : "password"}
              value={confirm}
            />
            <button
              aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
              className="input-action"
              onClick={() => setShowConfirm((v) => !v)}
              type="button"
            >
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <div className="auth-checks">
          <span className={cn("field-status", passwordValid ? "ok" : "muted")}>
            {passwordValid ? <Check size={13} /> : <Info size={13} />}
            {passwordValid ? "Password memenuhi syarat" : "Minimal 8 karakter dan mengandung angka"}
          </span>
          {confirm.length > 0 && (
            <span className={cn("field-status", passwordsMatch ? "ok" : "bad")}>
              {passwordsMatch ? <Check size={13} /> : <Info size={13} />}
              {passwordsMatch ? "Konfirmasi password cocok" : "Konfirmasi password belum cocok"}
            </span>
          )}
        </div>
        <button className="btn btn-primary full-button auth-submit" disabled={loading} type="submit">
          {loading ? (
            <>
              <span className="btn-spinner" /> Membuat akun…
            </>
          ) : (
            <>
              Daftar & Mulai <UserPlus size={18} />
            </>
          )}
        </button>
        <div className="auth-divider">
          <span>atau</span>
        </div>
        <p className="register-text">
          Sudah punya akun?{" "}
          <button onClick={() => navigate("/login")} type="button">
            Masuk
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
