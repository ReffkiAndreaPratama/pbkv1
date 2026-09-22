import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MonitorCog, Lock, Play, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { difficultyLabel, difficultyColor, cn } from "@/lib/utils";
import type { CaseListItem } from "@/lib/types";

export function CasesPage() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);

  useEffect(() => {
    api.get<CaseListItem[]>("/api/cases").then(setCases).catch(() => setCases([]));
  }, []);

  if (!cases) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Simulasi Kasus Troubleshooting"
        subtitle="Latih kemampuan diagnosis-mu lewat 20 skenario interaktif. Semakin tinggi penguasaan, semakin sulit kasus yang terbuka."
      />

      {cases.length === 0 ? (
        <EmptyState icon={<MonitorCog className="h-6 w-6" />} title="Belum ada kasus" description="Kasus akan tersedia setelah admin menambahkannya." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Card key={c.id} className={cn("overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift", c.locked && "opacity-70")}>
              <div className="relative p-5">
                {c.locked && (
                  <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono-tech">{c.skill.code}</Badge>
                  <Badge className={difficultyColor(c.difficulty)}>{difficultyLabel(c.difficulty)}</Badge>
                  {c.tries > 0 && (
                    <Badge variant="info" className="gap-1">
                      <TrendingUp className="h-3 w-3" /> {c.tries}× berhasil
                    </Badge>
                  )}
                </div>
                <h3 className="font-display text-sm font-bold leading-snug">{c.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.skill.name} · {c.targetSteps} langkah
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">Urgensi: {c.urgency}</span>
                  <Button asChild size="sm" disabled={c.locked}>
                    <Link to={c.locked ? "#" : `/cases/${c.id}`}>
                      <Play className="h-3.5 w-3.5" /> {c.locked ? "Terkunci" : "Mulai"}
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}