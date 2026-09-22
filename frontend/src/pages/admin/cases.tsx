import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { difficultyLabel, difficultyColor, cn } from "@/lib/utils";

interface AdminCase {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  isActive: boolean;
  order: number;
  attemptCount: number;
  skill: { code: string; name: string };
}

export function AdminCasesPage() {
  const [cases, setCases] = useState<AdminCase[] | null>(null);

  useEffect(() => {
    api.get<AdminCase[]>("/api/admin/cases").then(setCases).catch(() => setCases([]));
  }, []);

  const toggleActive = async (c: AdminCase) => {
    try {
      const updated = await api.put<AdminCase>(`/api/admin/cases/${c.id}`, { isActive: !c.isActive });
      setCases((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      toast.success(`Kasus "${updated.title}" ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}.`);
    } catch {
      toast.error("Gagal memperbarui kasus.");
    }
  };

  if (!cases) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manajemen Kasus" subtitle={`${cases.length} kasus tersedia.`} />

      {cases.length === 0 ? (
        <EmptyState icon={<Wrench className="h-6 w-6" />} title="Belum ada kasus" />
      ) : (
        <div className="space-y-2.5">
          {cases.map((c) => (
            <Card key={c.id} className={cn("p-4", !c.isActive && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-tech text-xs text-muted-foreground">{c.order}</span>
                    <h3 className="truncate text-sm font-semibold">{c.title}</h3>
                    <Badge className={difficultyColor(c.difficulty)}>{difficultyLabel(c.difficulty)}</Badge>
                    <Badge variant="secondary" className="font-mono-tech">{c.skill.code}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.skill.name} · {c.attemptCount} simulasi</p>
                </div>
                <Button size="sm" variant={c.isActive ? "outline" : "default"} onClick={() => void toggleActive(c)}>
                  {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}