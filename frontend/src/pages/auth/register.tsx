import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MonitorCog, UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-8%] h-[440px] w-[440px] rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute bottom-[-12%] left-[-10%] h-[400px] w-[400px] rounded-full bg-circuit/15 blur-3xl animate-blob" style={{ animationDelay: "-8s" }} />
        <div className="absolute inset-0 bg-grid opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-cyan-600 to-circuit text-white shadow-glow">
            <MonitorCog className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold">
              Tech<span className="text-gradient">Tutor</span>
            </div>
            <div className="text-xs text-muted-foreground">Adaptive IT Troubleshooting Lab</div>
          </div>
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-lg">Buat akun baru</CardTitle>
            <CardDescription>Mulai perjalanan belajarmu jadi ahli troubleshooting IT.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nama lengkap</Label>
                <Input id="name" required minLength={3} placeholder="Nama kamu" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="kamu@kampus.ac.id" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={8} placeholder="min. 8 karakter" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Ulangi password</Label>
                  <Input id="confirm" type="password" required minLength={8} placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                {loading ? "Membuat akun…" : "Daftar"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
                Masuk di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}