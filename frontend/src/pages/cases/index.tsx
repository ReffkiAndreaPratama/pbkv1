import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Play, TrendingUp, Search } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton, EmptyState } from "@/components/ui/feedback";
import { difficultyLabel, difficultyColor, cn } from "@/lib/utils";
import { skillImageUrl } from "@/lib/skill-media";
import type { CaseListItem, Difficulty } from "@/lib/types";

const DIFF_FILTERS: { value: "ALL" | Difficulty; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "EASY", label: "Mudah" },
  { value: "MEDIUM", label: "Sedang" },
  { value: "HARD", label: "Sulit" },
];

export function CasesPage() {
  const [cases, setCases] = useState<CaseListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [diff, setDiff] = useState<"ALL" | Difficulty>("ALL");

  useEffect(() => {
    api.get<CaseListItem[]>("/api/cases").then(setCases).catch(() => setCases([]));
  }, []);

  if (!cases) return <CardGridSkeleton groups={3} perGroup={2} />;

  const visible = cases.filter(
    (c) =>
      (diff === "ALL" || c.difficulty === diff) &&
      (search.trim() === "" ||
        c.title.toLowerCase().includes(search.trim().toLowerCase()) ||
        c.skill.name.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Simulasi Kasus Troubleshooting"
        subtitle="Latih kemampuan diagnosis-mu lewat 20 skenario interaktif. Semakin tinggi penguasaan, semakin sulit kasus yang terbuka."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kasus atau skill..."
            className="w-full rounded-xl border border-border/70 bg-card px-9 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white"
            aria-label="Cari kasus"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter kesulitan">
          {DIFF_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setDiff(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                diff === f.value ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {cases.length === 0 ? (
        <EmptyState icon={<Play className="h-6 w-6" />} title="Belum ada kasus" description="Kasus akan tersedia setelah admin menambahkannya." />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Tidak ada hasil" description="Tidak ada kasus yang cocok dengan pencarian/filter-mu." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <Card key={c.id} className={cn("overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift", c.locked && "opacity-70")}>
              <div className="relative h-28 overflow-hidden bg-muted">
                <img src={skillImageUrl(c.skill.code)} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                {c.locked && (
                  <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div className="p-5">
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