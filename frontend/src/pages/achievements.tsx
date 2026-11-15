import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Brain,
  Flame,
  Footprints,
  Hand,
  Lock,
  Medal,
  Rocket,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn, formatDate } from "@/lib/utils";
import type { Achievement } from "@/lib/types";

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  wrench: Wrench,
  target: Target,
  brain: Brain,
  flame: Flame,
  fire: Flame,
  "book-open": BookOpen,
  sparkles: Sparkles,
  medal: Medal,
  rocket: Rocket,
  timer: Timer,
  award: Award,
  hand: Hand,
};

function AchievementIcon({ icon }: { icon: string }) {
  const Icon = ACHIEVEMENT_ICONS[icon] ?? Trophy;
  return <Icon className="h-6 w-6 text-amber-600" />;
}

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);

  useEffect(() => {
    api.get<Achievement[]>("/api/progress/achievements").then(setAchievements).catch(() => setAchievements([]));
  }, []);

  if (!achievements) return <PageLoader />;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pencapaian"
        subtitle={`${unlockedCount}/${achievements.length} pencapaian terbuka. Selesaikan tantangan untuk dapat XP!`}
      />

      {achievements.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="Belum ada pencapaian" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <Card
              key={a.id}
              className={cn(
                "p-5 transition-all",
                a.unlocked ? "border-amber-300/60 bg-gradient-to-br from-amber-50/70 to-card" : "opacity-80"
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", a.unlocked ? "bg-amber-100" : "bg-muted")}>
                  {a.unlocked ? <AchievementIcon icon={a.icon} /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>
                {a.unlocked ? (
                  <Badge variant="success" className="gap-1">Terbuka</Badge>
                ) : (
                  <Badge variant="secondary">Terkunci</Badge>
                )}
              </div>
              <h3 className="font-display text-sm font-bold">{a.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="warning" className="gap-1">+{a.xpReward} XP</Badge>
                {a.unlocked && a.unlockedAt && <span className="text-[11px] text-muted-foreground">{formatDate(a.unlockedAt)}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}