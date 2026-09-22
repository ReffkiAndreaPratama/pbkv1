import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ListChecks } from "lucide-react";
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
  skill: { code: string; name: string };
}

export function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);

  useEffect(() => {
    api.get<AdminQuestion[]>("/api/admin/questions").then(setQuestions).catch(() => setQuestions([]));
  }, []);

  const toggleActive = async (q: AdminQuestion) => {
    try {
      const updated = await api.put<AdminQuestion>(`/api/admin/questions/${q.id}`, { isActive: !q.isActive });
      setQuestions((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Status soal diperbarui.");
    } catch {
      toast.error("Gagal memperbarui soal.");
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
          {questions.map((q) => (
            <Card key={q.id} className={cn("p-4", !q.isActive && "opacity-60")}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono-tech">{q.skill.code}</Badge>
                    <Badge className={cn(q.difficulty === "EASY" && "bg-emerald-100 text-emerald-700", q.difficulty === "MEDIUM" && "bg-amber-100 text-amber-700", q.difficulty === "HARD" && "bg-rose-100 text-rose-700")}>
                      {q.difficulty}
                    </Badge>
                    {(q.phases ?? []).map((p) => (
                      <Badge key={p} variant="info" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{q.prompt}</h3>
                </div>
                <Button size="sm" variant={q.isActive ? "outline" : "default"} onClick={() => void toggleActive(q)}>
                  {q.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}