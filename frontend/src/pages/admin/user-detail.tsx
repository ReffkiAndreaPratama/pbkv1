import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, MonitorCog } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn, formatDate, tierColor, tierLabel } from "@/lib/utils";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profile: { totalXp: number; level: number; pretestDone: boolean; posttestDone: boolean; posttestScore: number | null; streakDays: number };
  mastery: { code: string; name: string; mastery: number; attempts: number; successes: number }[];
  recentSims: { id: string; case: { title: string; difficulty: string; skill: { code: string; name: string } }; score: number | null; success: boolean | null; createdAt: string }[];
  recentQuizzes: { id: string; type: string; score: number | null; completedAt: string | null }[];
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState<UserDetail | null>(null);

  useEffect(() => {
    if (id) api.get<UserDetail>(`/api/admin/users/${id}`).then(setUser).catch(() => setUser(null));
  }, [id]);

  if (!user) return <PageLoader />;

  const avgMastery = user.mastery.reduce((s, m) => s + m.mastery, 0) / (user.mastery.length || 1);

  return (
    <div className="animate-fade-in">
      <ButtonBack_ to="/admin/users" />
      <PageHeader
        title={user.name}
        subtitle={user.email}
        actions={<Badge variant={user.profile.posttestDone ? "success" : "secondary"}>{user.profile.posttestDone ? `Lulus posttest ${user.profile.posttestScore}` : "Belum posttest"}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MonitorCog className="h-4 w-4 text-primary" /> Riwayat Simulasi</CardTitle></CardHeader>
            <CardContent>
              {user.recentSims.length === 0 ? (
                <EmptyState title="Belum ada simulasi" />
              ) : (
                <div className="space-y-2">
                  {user.recentSims.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.case.title}</div>
                        <div className="text-[11px] text-muted-foreground">{s.case.skill.code} · {formatDate(s.createdAt)}</div>
                      </div>
                      {s.success == null ? <Badge variant="secondary">Ditinggalkan</Badge> : s.success ? <Badge variant="success">{Math.round(s.score ?? 0)}</Badge> : <Badge variant="danger">{Math.round(s.score ?? 0)}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <Trophy className="h-4 w-4" /> Statistik
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="font-display text-xl font-extrabold">{user.profile.totalXp} XP</div><div className="text-xs text-muted-foreground">Total XP</div></div>
                <div><div className="font-display text-xl font-extrabold">Lv {user.profile.level}</div><div className="text-xs text-muted-foreground">Level</div></div>
                <div><div className="font-display text-xl font-extrabold">{user.profile.streakDays} 🔥</div><div className="text-xs text-muted-foreground">Streak</div></div>
                <div><div className="font-display text-xl font-extrabold">{Math.round(avgMastery * 100)}%</div><div className="text-xs text-muted-foreground">Rata mastery</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Penguasaan Skill</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {user.mastery.map((m) => (
                <div key={m.code}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{m.code}</span>
                    <span className={cn("rounded-full px-2 py-0.5 font-bold", tierColor(tierOf(m.mastery)))}>{Math.round(m.mastery * 100)}%</span>
                  </div>
                  <Progress value={m.mastery * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ButtonBack_({ to }: { to: string }) {
  return (
    <Link to={to} className="mb-3 -ml-2 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70 hover:text-primary">
      <ArrowLeft className="h-4 w-4" /> Kembali
    </Link>
  );
}

function tierOf(m: number) {
  if (m >= 0.75) return "PROFICIENT";
  if (m >= 0.4) return "DEVELOPING";
  return "NOVICE";
}