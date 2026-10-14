import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, ListChecks, Youtube } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface AdminQuestion {
  id: string;
  skillId: string;
  prompt: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  isActive: boolean;
  phases: string[];
  correctKeys: string[];
  imageUrl?: string | null;
  videoUrl?: string | null;
  skill: { code: string; name: string };
}

export function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { imageUrl: string; videoUrl: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get<AdminQuestion[]>("/api/admin/questions").then(setQuestions).catch(() => setQuestions([]));
  }, []);

  const draftFor = (q: AdminQuestion) =>
    drafts[q.id] ?? { imageUrl: q.imageUrl ?? "", videoUrl: q.videoUrl ?? "" };

  const toggleActive = async (q: AdminQuestion) => {
    try {
      const updated = await api.put<AdminQuestion>(`/api/admin/questions/${q.id}`, { isActive: !q.isActive });
      setQuestions((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Status soal diperbarui.");
    } catch {
      toast.error("Gagal memperbarui soal.");
    }
  };

  const saveMedia = async (q: AdminQuestion) => {
    const d = draftFor(q);
    setSaving(q.id);
    try {
      const updated = await api.put<AdminQuestion>(`/api/admin/questions/${q.id}`, {
        imageUrl: d.imageUrl.trim() || null,
        videoUrl: d.videoUrl.trim() || null,
      });
      setQuestions((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Media soal disimpan.");
    } catch {
      toast.error("Gagal menyimpan media soal.");
    } finally {
      setSaving(null);
    }
  };

  if (!questions) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manajemen Soal Kuis" subtitle={`${questions.length} soal terdaftar.`} />

      {questions.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-6 w-6" />} title="Belum ada soal" />
      ) : (
        <div className="space-y-2.5">
          {questions.map((q) => {
            const d = drafts[q.id] ?? { imageUrl: q.imageUrl ?? "", videoUrl: q.videoUrl ?? "" };
            return (
              <Card key={q.id} className={cn("p-4", !q.isActive && "opacity-60")}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex items-center gap-3">
                    {q.imageUrl ? (
                      <img src={q.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono-tech">{q.skill.code}</Badge>
                      <Badge className={cn(q.difficulty === "EASY" && "bg-emerald-100 text-emerald-700", q.difficulty === "MEDIUM" && "bg-amber-100 text-amber-700", q.difficulty === "HARD" && "bg-rose-100 text-rose-700")}>
                        {q.difficulty}
                      </Badge>
                      {(q.phases ?? []).map((p) => (
                        <Badge key={p} variant="info" className="text-[10px]">{p}</Badge>
                      ))}
                      {q.videoUrl && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Youtube className="h-3 w-3" /> video
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{q.prompt}</h3>

                    <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
                      <div className="relative">
                        <ImageIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs outline-none focus:border-primary"
                          placeholder="URL gambar (https://… atau /…)"
                          value={d.imageUrl}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [q.id]: { ...draftFor(q), imageUrl: e.target.value } }))}
                        />
                      </div>
                      <div className="relative">
                        <Youtube className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          className="h-9 w-full rounded-lg border border-border bg-card pl-8 pr-3 text-xs outline-none focus:border-primary"
                          placeholder="URL video YouTube"
                          value={d.videoUrl}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [q.id]: { ...draftFor(q), videoUrl: e.target.value } }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => void saveMedia(q)}
                          disabled={saving === q.id}
                        >
                          {saving === q.id ? "Menyimpan…" : "Simpan Media"}
                        </Button>
                        <Button size="sm" variant={q.isActive ? "outline" : "default"} onClick={() => void toggleActive(q)}>
                          {q.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}