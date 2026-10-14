import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Lock, Mail, UserRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthLayout, AuthHeading } from "@/components/layout/auth-layout";

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
          <div className="auth-error">
            <Info size={16} /> {error}
          </div>
        )}
        <label>
          Nama Lengkap
          <div className="input-wrap">
            <UserRound size={18} />
            <input minLength={3} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama lengkap" required value={name} />
          </div>
        </label>
        <label>
          Email
          <div className="input-wrap">
            <Mail size={18} />
            <input onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required type="email" value={email} />
          </div>
        </label>
        <label>
          Password
          <div className="input-wrap">
            <Lock size={18} />
            <input minLength={8} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required type="password" value={password} />
          </div>
        </label>
        <label>
          Ulangi Password
          <div className="input-wrap">
            <Lock size={18} />
            <input minLength={8} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi password" required type="password" value={confirm} />
          </div>
        </label>
        <p className="auth-note">
          <Info size={15} /> Password minimal 8 karakter dan harus mengandung angka.
        </p>
        <button className="btn btn-primary full-button" disabled={loading} type="submit">
          {loading ? "Membuat akun…" : "Daftar & Mulai"}
          {!loading && <UserPlus size={18} />}
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