import { useEffect, useState } from "react";
import { BarChart as BarChartIcon, Clock, MonitorCog, BrainCircuit, Activity } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn, formatDate, formatPct, formatTime, tierLabel, tierColor, quizTypeLabel } from "@/lib/utils";
import type { MasteryRow, SimHistoryRow, QuizSessionRow, ActivityLog, SummaryData } from "@/lib/types";

export function ProgressPage() {
  const [mastery, setMastery] = useState<MasteryRow[] | null>(null);
  const [history, setHistory] = useState<SimHistoryRow[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSessionRow[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<MasteryRow[]>("/api/progress/mastery"),
      api.get<SimHistoryRow[]>("/api/cases/history"),
      api.get<ActivityLog[]>("/api/progress/activity"),
      api.get<SummaryData>("/api/progress/summary").then((s) => s.recentQuizzes ?? []),
    ])
      .then(([m, h, a, q]) => {
        setMastery(m);
        setHistory(h);
        setActivities(a);
        setQuizzes(q);
      })
      .catch(() => setMastery([]));
  }, []);

  if (!mastery) return <PageLoader />;

  const avgMastery = mastery.reduce((s, m) => s + m.mastery, 0) / (mastery.length || 1);
  const chartData = mastery.map((m) => ({ name: m.code, mastery: Math.round(m.mastery * 100), tier: m.tier }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Progres & Statistik"
        subtitle="Pantau penguasaan skill, riwayat simulasi, dan aktivitas belajarmu."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-4 w-4 text-primary" /> Penguasaan Skill
            </CardTitle>
            <Badge variant="secondary">Rata-rata {Math.round(avgMastery * 100)}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Penguasaan"]} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.mastery >= 75 ? "#10b981" : d.mastery >= 40 ? "#f59e0b" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {mastery.map((m) => (
                <div key={m.code}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono-tech text-xs text-muted-foreground">{m.code}</span>
                      <span className="font-medium">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", tierColor(m.tier))}>{tierLabel(m.tier)}</span>
                      <span className="text-sm font-bold">{Math.round(m.mastery * 100)}%</span>
                    </div>
                  </div>
                  <Progress value={m.mastery * 100} className="h-2" indicatorClassName={m.mastery >= 0.75 ? "bg-emerald-500" : m.mastery >= 0.4 ? "bg-amber-500" : "bg-rose-500"} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <MonitorCog className="h-4 w-4 text-primary" /> Riwayat Simulasi
              </CardTitle>
              <Badge variant="secondary">{history.filter((h) => h.success).length} berhasil</Badge>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <EmptyState icon={<MonitorCog className="h-6 w-6" />} title="Belum ada simulasi" description="Mulai dari halaman Simulasi Kasus." />
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1 no-scrollbar">
                  {history.slice(0, 12).map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{h.caseTitle}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="font-mono-tech">{h.skill.code}</span>· {formatDate(h.startedAt)} · {formatTime(h.timeSec)}
                        </div>
                      </div>
                      {h.success == null ? (
                        <Badge variant="secondary">Ditinggalkan</Badge>
                      ) : h.success ? (
                        <Badge variant="success">{Math.round(h.score ?? 0)}</Badge>
                      ) : (
                        <Badge variant="danger">{Math.round(h.score ?? 0)}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" /> Kuis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada kuis dikerjakan.</p>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm">
                      <span>{quizTypeLabel(q.type)}</span>
                      <span className="font-semibold">{q.completedAt ? `${Math.round(q.score ?? 0)}/100` : "…"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Aktivitas Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
          ) : (
            <div className="space-y-1.5">
              {activities.slice(0, 15).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-accent/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{ActivityLabel(a.type)}</span>
                    {a.meta?.score != null && <span className="text-xs text-muted-foreground">skor {Math.round(a.meta.score)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.points > 0 && <Badge variant="success" className="text-[10px]">+{a.points} XP</Badge>}
                    <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityLabel(type: string): string {
  const map: Record<string, string> = {
    PRETEST: "Mengerjakan pretest",
    POSTTEST: "Mengerjakan posttest",
    QUIZ_ANSWER: "Menjawab soal kuis",
    CASE_SUBMIT: "Menyelesaikan simulasi",
    MATERIAL_READ: "Membaca materi",
    ACHIEVEMENT: "Membuka pencapaian",
  };
  return map[type] ?? type;
}