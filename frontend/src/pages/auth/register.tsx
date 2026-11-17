import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, UserPlus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AuthLayout, AuthHeading, AuthField } from "@/components/layout/auth-layout";

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
      heading={
        <AuthHeading
          icon={<UserPlus size={20} />}
          subtitle="Buat akun pelajar untuk menyimpan progres dan profil kemampuanmu."
          title="Daftar ke TechTutor AI"
        />
      }
    >
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
          autoComplete="name"
          autoFocus
          icon={<UserRound className="h-4 w-4" />}
          id="register-name"
          label="Nama lengkap"
          minLength={3}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masukkan nama lengkap"
          required
          value={name}
        />

        <AuthField
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          id="register-email"
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
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4" />}
          id="register-password"
          label="Password"
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          required
          type={showPassword ? "text" : "password"}
          value={password}
        />

        <AuthField
          action={
            <button
              aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
              onClick={() => setShowConfirm((v) => !v)}
              type="button"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          autoComplete="new-password"
          icon={<ShieldCheck className="h-4 w-4" />}
          id="register-confirm"
          label="Ulangi password"
          minLength={8}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi password"
          required
          type={showConfirm ? "text" : "password"}
          value={confirm}
        />

        <div className="space-y-1.5">
          <span
            className={cn(
              "flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.1em]",
              passwordValid ? "text-emerald-300" : "text-slate-600"
            )}
          >
            {passwordValid ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}
            {passwordValid ? "Password memenuhi syarat" : "Minimal 8 karakter + angka"}
          </span>
          {confirm.length > 0 && (
            <span
              className={cn(
                "flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.1em]",
                passwordsMatch ? "text-emerald-300" : "text-rose-300"
              )}
            >
              {passwordsMatch ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {passwordsMatch ? "Konfirmasi password cocok" : "Konfirmasi password belum cocok"}
            </span>
          )}
        </div>

        <button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-[12.5px] font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" /> Membuat akun…
            </>
          ) : (
            <>
              Daftar & mulai <UserPlus className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="flex items-center gap-3 pt-1">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="font-mono-tech text-[8.5px] uppercase tracking-[0.16em] text-slate-600">atau</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <p className="text-center text-[11.5px] text-slate-400">
          Sudah punya akun?{" "}
          <button className="font-bold text-emerald-300 transition-colors hover:text-emerald-200" onClick={() => navigate("/login")} type="button">
            Masuk
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
