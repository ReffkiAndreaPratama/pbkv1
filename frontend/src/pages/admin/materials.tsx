import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Database } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface AdminMaterial {
  id: string;
  title: string;
  summary: string;
  order: number;
  isActive: boolean;
  readCount: number;
  skill: { code: string; name: string };
}

export function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<AdminMaterial[] | null>(null);

  useEffect(() => {
    api.get<AdminMaterial[]>("/api/admin/materials").then(setMaterials).catch(() => setMaterials([]));
  }, []);

  const toggleActive = async (m: AdminMaterial) => {
    try {
      const updated = await api.put<AdminMaterial>(`/api/admin/materials/${m.id}`, { isActive: !m.isActive });
      setMaterials((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Status materi diperbarui.");
    } catch {
      toast.error("Gagal memperbarui materi.");
    }
  };

  if (!materials) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manajemen Materi" subtitle={`${materials.length} materi terdaftar.`} />

      {materials.length === 0 ? (
        <EmptyState icon={<Database className="h-6 w-6" />} title="Belum ada materi" />
      ) : (
        <div className="space-y-2.5">
          {materials.map((m) => (
            <Card key={m.id} className={cn("p-4", !m.isActive && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono-tech">{m.skill.code}</Badge>
                    <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.summary} · {m.readCount}x dibaca</p>
                </div>
                <Button size="sm" variant={m.isActive ? "outline" : "default"} onClick={() => void toggleActive(m)}>
                  {m.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}