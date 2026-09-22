import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, Target, ArrowRight, BookOpenText, MonitorCog, BrainCircuit, ListChecks, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { greeting, formatNumber, tierLabel, tierColor, cn } from "@/lib/utils";
import type { SummaryData, PathItem, QuizSessionRow } from "@/lib/types";

const pathIcon: Record<string, React.ReactNode> = {
  MATERIAL: <BookOpenText className="h-4 w-4" />,
  CASE: <MonitorCog className="h-4 w-4" />,
  QUIZ: <BrainCircuit className="h-4 w-4" />,
  POSTTEST: <Trophy className="h-4 w-4" />,
};

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [path, setPath] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<SummaryData>("/api/progress/summary"), api.get<PathItem[]>("/api/cases/path")])
      .then(([s, p]) => {
        setSummary(s);
        setPath(p);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <PageLoader />;

  const p = summary.profile;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(" ")[0]}! 👋`}
        subtitle="Yuk pertajam skill troubleshooting IT kamu hari ini."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="info">
              <Flame className="h-3 w-3" /> {p.streakDays} hari streak
            </Badge>
            <Badge>
              <Trophy className="h-3 w-3" /> Level {p.level}
            </Badge>
          </div>
        }
      />

      {!p.pretestDone && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Belum mengerjakan pretest</div>
              <p className="text-sm text-muted-foreground">Pretest membantu kami mengukur kemampuan awalmu dan menyusun jalur belajar adaptif.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/quiz/pretest">Kerjakan Pretest →</Link>
          </Button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="XP Total" value={formatNumber(p.totalXp)} icon={<Sparkles className="h-4 w-4" />} tone="bg-primary/10 text-primary" />
        <StatCard label="Kasus Berhasil" value={formatNumber(summary.successCases)} icon={<MonitorCog className="h-4 w-4" />} tone="bg-cyan-500/10 text-cyan-600" />
        <StatCard label="Skor Rata-rata" value={`${formatNumber(summary.avgScore)}/100`} icon={<BrainCircuit className="h-4 w-4" />} tone="bg-amber-500/10 text-amber-600" />
        <StatCard label="Materi Dibaca" value={formatNumber(summary.materialReads)} icon={<BookOpenText className="h-4 w-4" />} tone="bg-emerald-500/10 text-emerald-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mastery */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Penguasaan Skill</CardTitle>
            <Link to="/progress" className="text-sm font-semibold text-primary hover:underline">Lihat detail →</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.masteryBySkill.map((m) => (
              <div key={m.code}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="font-mono-tech text-xs text-muted-foreground">{m.code}</span>
                    {m.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", tierColor(m.tier))}>{tierLabel(m.tier)}</span>
                    <span className="text-sm font-bold">{Math.round(m.mastery * 100)}%</span>
                  </div>
                </div>
                <Progress value={m.mastery * 100} indicatorClassName={m.mastery >= 0.75 ? "bg-emerald-500" : m.mastery >= 0.4 ? "bg-amber-500" : "bg-rose-500"} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendation path */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Rekomendasi Belajar</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {path.length === 0 && <EmptyState title="Belum ada rekomendasi" description="Lengkapi pretest dulu ya!" />}
            {path.map((item, i) => {
              const href =
                item.type === "MATERIAL"
                  ? `/materials/${item.refId}`
                  : item.type === "CASE"
                  ? `/cases/${item.refId}`
                  : item.type === "QUIZ"
                  ? `/quiz/adaptive?skill=${item.skillId}`
                  : "/quiz/posttest";
              return (
                <Link key={i} to={href} className="group flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{pathIcon[item.type]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold group-hover:text-primary">{item.reason}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{item.skillCode}</Badge>
                      Urgensi {item.urgency}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity + quick start */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kuis Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentQuizzes.length === 0 ? (
              <EmptyState
                icon={<ListChecks className="h-6 w-6" />}
                title="Belum ada kuis"
                description="Kerjakan pretest, kuis adaptif, atau posttest untuk melihat hasilnya di sini."
              />
            ) : (
              <div className="space-y-2">
                {summary.recentQuizzes.map((q) => (
                  <QuizRow key={q.id} q={q} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mulai cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/cases">🔍 Jelajahi Simulasi Kasus</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/materials">📚 Baca Materi</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link to="/quiz/adaptive">🧠 Kuis Adaptif</Link></Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Butuh bantuan? Klik tombol <Sparkles className="inline h-3 w-3" /> <b>TechTutor AI</b> di pojok kanan bawah.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</div>
        <div className="min-w-0">
          <div className="font-display text-lg font-extrabold leading-tight">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuizRow({ q }: { q: QuizSessionRow }) {
  const typeLabel: Record<string, string> = { PRETEST: "Pretest", POSTTEST: "Posttest", ADAPTIVE: "Kuis Adaptif" };
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{typeLabel[q.type] ?? q.type}</div>
        <div className="text-xs text-muted-foreground">
          {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
        </div>
      </div>
      {q.completedAt ? (
        <Badge variant={q.score && q.score >= 70 ? "success" : "warning"}>{q.score && q.score >= 70 ? "Lulus" : "Belum lulus"}</Badge>
      ) : (
        <Badge variant="secondary">Belum selesai</Badge>
      )}
    </div>
  );
}