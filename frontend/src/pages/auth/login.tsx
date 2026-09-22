import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MonitorCog, LogIn, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: any }>("/api/auth/login", { email, password });
      login(res.token, res.user);
      toast.success(`Selamat datang kembali, ${res.user.name}!`);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Gagal masuk.");
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
            <CardTitle className="text-lg">Masuk ke akunmu</CardTitle>
            <CardDescription>Lanjutkan belajar troubleshooting IT-mu di mana pun.</CardDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="kamu@kampus.ac.id" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? "Memproses…" : "Masuk"}
              </Button>
            </form>

            <div className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground/80">Akun demo:</div>
              <div>Mahasiswa — demo1@techtutor.app / demo1234</div>
              <div>Admin — admin@techtutor.app / admin1234</div>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold text-primary underline underline-offset-4">
                Daftar di sini
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}