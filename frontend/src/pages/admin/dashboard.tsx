import { useEffect, useState } from "react";
import { Users, Wrench, Target, BookOpenText, BarChart3, ListChecks } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/feedback";
import { formatNumber } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalCases: number;
  totalSims: number;
  totalQuizzes: number;
  totalMaterials: number;
  successRate: number;
  avgSimScore: number;
  skillAverages: { name: string; avgMastery: number; count: number }[];
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/api/admin/stats").then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard Admin"
        subtitle="Ringkasan aktivitas seluruh pengguna TechTutor."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total Pengguna" value={formatNumber(stats.totalUsers)} icon={<Users className="h-4 w-4" />} tone="bg-primary/10 text-primary" />
        <StatCard label="Simulasi Dikerjakan" value={formatNumber(stats.totalSims)} icon={<Wrench className="h-4 w-4" />} tone="bg-cyan-500/10 text-cyan-600" />
        <StatCard label="Kuis Diselesaikan" value={formatNumber(stats.totalQuizzes)} icon={<ListChecks className="h-4 w-4" />} tone="bg-amber-500/10 text-amber-600" />
        <StatCard label="Tingkat Keberhasilan" value={`${stats.successRate}%`} icon={<Target className="h-4 w-4" />} tone="bg-emerald-500/10 text-emerald-600" />
        <StatCard label="Skor Rata-rata" value={`${stats.avgSimScore}`} icon={<BarChart3 className="h-4 w-4" />} tone="bg-violet-500/10 text-violet-600" />
        <StatCard label="Materi Aktif" value={formatNumber(stats.totalMaterials)} icon={<BookOpenText className="h-4 w-4" />} tone="bg-rose-500/10 text-rose-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rata-rata Penguasaan per Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.skillAverages.map((s) => ({ name: s.name.split(" ")[0], avgMastery: Math.round(s.avgMastery * 100), count: s.count }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Penguasaan"]} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="avgMastery" radius={[6, 6, 0, 0]}>
                  {stats.skillAverages.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#0d9488" : "#0891b2"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
        <div className="min-w-0">
          <div className="font-display text-lg font-extrabold leading-tight">{value}</div>
          <div className="truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}