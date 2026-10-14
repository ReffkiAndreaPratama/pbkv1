import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenText, CheckCircle2, ArrowRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardGridSkeleton, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Material[]>("/api/materials").then(setMaterials).catch(() => setMaterials([]));
  }, []);

  if (!materials) return <CardGridSkeleton />;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? materials.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.skill.name.toLowerCase().includes(q)
      )
    : materials;

  const completedCount = materials.filter((m) => m.completed).length;
  const grouped = filtered.reduce<Record<string, { name: string; items: Material[] }>>((acc, m) => {
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

      <div className="relative mb-5 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari materi..."
          className="w-full rounded-xl border border-border/70 bg-card px-9 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-white"
          aria-label="Cari materi"
        />
      </div>

      {materials.length === 0 ? (
        <EmptyState icon={<BookOpenText className="h-6 w-6" />} title="Belum ada materi" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-6 w-6" />} title="Tidak ada hasil" description="Tidak ada materi yang cocok dengan pencarianmu." />
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
                  <Link key={m.id} to={`/materials/${m.id}`} className="group h-full">
                    <Card className={cn("flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift", m.completed && "border-emerald-300/50")}>
                      {m.imageUrl && (
                        <div className="relative aspect-[2/1] w-full overflow-hidden bg-muted">
                          <img
                            src={m.imageUrl}
                            alt=""
                            loading="lazy"
                            className={cn("h-full w-full object-cover transition-transform duration-300 group-hover:scale-105", m.completed && "opacity-80")}
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-4">
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