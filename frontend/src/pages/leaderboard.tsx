import { useEffect, useState } from "react";
import { Medal, Trophy, Flame } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/lib/types";

const rankStyle = ["bg-gradient-to-br from-amber-400 to-amber-300 text-amber-950", "bg-gradient-to-br from-slate-300 to-slate-200 text-slate-800", "bg-gradient-to-br from-orange-300 to-amber-200 text-orange-900"];

export function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    api.get<LeaderboardRow[]>("/api/progress/leaderboard").then(setRows).catch(() => setRows([]));
  }, []);

  if (!rows) return <PageLoader />;

  if (rows.length === 0)
    return <EmptyState icon={<Trophy className="h-6 w-6" />} title="Belum ada peserta" description="Ajak temanmu ikut TechTutor!" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Papan Peringkat" subtitle="Kumpulkan XP terbanyak dan kuasai seluruh skill." />

      <Card className="mb-6">
        <div className="grid grid-cols-3 divide-x divide-border/60">
          {rows.slice(0, 3).map((r) => (
            <div key={r.rank} className="flex flex-col items-center gap-1 p-4 text-center">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", rankStyle[r.rank - 1] ?? "bg-muted")}>
                {medal(r.rank)}
              </span>
              <span className="mt-1 w-full truncate text-sm font-bold">{r.user.name}</span>
              <span className="text-xs text-muted-foreground">{r.totalXp} XP</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y divide-border/60">
          {rows.map((r) => {
            const isMe = r.user.id === user?.id;
            return (
              <div key={r.rank} className={cn("flex items-center gap-3 px-4 py-3", isMe && "bg-primary/5")}>
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  r.rank <= 3 ? rankStyle[r.rank - 1] : "bg-muted text-muted-foreground"
                )}>
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{r.user.name}</span>
                    {isMe && <Badge variant="outline" className="text-[10px]">kamu</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Level {r.level} · <Flame className="inline h-3 w-3" /> {r.streakDays} hari
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-amber-500" />
                  <span className="font-display text-sm font-extrabold">{r.totalXp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  return "🥉";
}