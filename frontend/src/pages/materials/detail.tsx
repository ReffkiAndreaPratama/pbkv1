import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { Material } from "@/lib/types";

function renderMarkdown(content: string) {
  const blocks = content.split(/\r?\n/).filter((b) => b.trim().length > 0);
  return blocks.map((b, i) => {
    if (b.startsWith("## ")) {
      return <h2 key={i} className="mt-6 mb-2 font-display text-lg font-bold first:mt-0">{b.slice(3)}</h2>;
    }
    if (b.startsWith("### ")) {
      return <h3 key={i} className="mt-4 mb-1 text-base font-bold">{b.slice(4)}</h3>;
    }
    if (b.startsWith("- ")) {
      return <li key={i} className="ml-1 list-none before:mr-2 before:content-['▸'] before:text-primary">{b.slice(2)}</li>;
    }
    if (/^\d+\. /.test(b)) {
      return <li key={i} className="ml-6 list-decimal marker:font-bold marker:text-primary">{b.replace(/^\d+\. /, "")}</li>;
    }
    if (b.startsWith("> ")) {
      return <blockquote key={i} className="mt-2 border-l-4 border-primary/40 bg-primary/5 py-1 pl-3 text-sm text-foreground/80">{b.slice(2)}</blockquote>;
    }
    return <p key={i} className="mb-2 text-sm leading-relaxed text-foreground/85">{b}</p>;
  });
}

export function MaterialDetailPage() {
  const { id } = useParams();
  const [material, setMaterial] = useState<Material | null>(null);
  const [readAt, setReadAt] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) api.get<Material>(`/api/materials/${id}`).then((m) => { setMaterial(m); setReadAt(m.readAt ?? null); });
  }, [id]);

  const markRead = async () => {
    if (!id) return;
    try {
      await api.post(`/api/materials/${id}/read`);
      setReadAt(new Date().toISOString());
      toast.success("Materi selesai dibaca! Konsepmu naik. 🚀");
    } catch {
      toast.error("Gagal menandai materi.");
    }
  };

  if (!material) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <div ref={topRef} className="mb-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/materials">
            <ArrowLeft className="h-4 w-4" /> Kembali ke materi
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono-tech">{material.skill.code}</Badge>
          <Badge variant="outline">{material.skill.name}</Badge>
          {readAt && <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Dibaca</Badge>}
        </div>
        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">{material.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{material.summary}</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5 sm:p-8">
          <div className="space-y-0.5 text-[15px] leading-relaxed">{renderMarkdown(material.content)}</div>

          <div className="mt-8 border-t pt-5">
            {readAt ? (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Materi ini sudah kamu baca
              </div>
            ) : (
              <Button className="w-full" onClick={() => void markRead()}>
                <CheckCircle2 className="h-4 w-4" /> Tandai Selesai Dibaca (+15 XP)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}