import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenText, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[] | null>(null);

  useEffect(() => {
    api.get<Material[]>("/api/materials").then(setMaterials).catch(() => setMaterials([]));
  }, []);

  if (!materials) return <PageLoader />;

  const completedCount = materials.filter((m) => m.completed).length;
  const grouped = materials.reduce<Record<string, { name: string; items: Material[] }>>((acc, m) => {
    const key = m.skill.code;
    if (!acc[key]) acc[key] = { name: m.skill.name, items: [] };
    acc[key].items.push(m);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Materi Pembelajaran"
        subtitle={`${completedCount}/${materials.length} materi selesai dibaca. Baca materi untuk menaikkan penguasaan konsep.`}
      />

      {materials.length === 0 ? (
        <EmptyState icon={<BookOpenText className="h-6 w-6" />} title="Belum ada materi" />
      ) : (
        <div className="space-y-7">
          {Object.entries(grouped).map(([code, g]) => (
            <section key={code}>
              <div className="mb-2 flex items-center gap-2.5">
                <h2 className="font-display text-sm font-bold text-foreground">{g.name}</h2>
                <Badge variant="secondary" className="font-mono-tech">{code}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((m) => (
                  <Link key={m.id} to={`/materials/${m.id}`} className="group">
                    <Card className={cn("h-full transition-all hover:-translate-y-0.5 hover:shadow-lift", m.completed && "border-emerald-300/50")}>
                      <div className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">Materi {m.order}</Badge>
                          {m.completed ? (
                            <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Selesai</Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">Belum dibaca</Badge>
                          )}
                        </div>
                        <h3 className="font-display text-sm font-bold leading-snug group-hover:text-primary">{m.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.summary}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                          Baca materi <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}