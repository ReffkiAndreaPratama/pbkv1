import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, ExternalLink, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { embedVideoUrl } from "@/lib/media";
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
  const [prev, setPrev] = useState<Material | null>(null);
  const [next, setNext] = useState<Material | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) api.get<Material>(`/api/materials/${id}`).then((m) => { setMaterial(m); setReadAt(m.readAt ?? null); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get<Material[]>("/api/materials").then((all) => {
      const ordered = [...all].sort((a, b) => a.skill.code.localeCompare(b.skill.code) || a.order - b.order);
      const idx = ordered.findIndex((m) => m.id === id);
      if (idx > -1) {
        setPrev(idx > 0 ? ordered[idx - 1] : null);
        setNext(idx < ordered.length - 1 ? ordered[idx + 1] : null);
      }
    }).catch(() => {});
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

      {material.imageUrl && (
        <Card className="mb-6 overflow-hidden">
          <img src={material.imageUrl} alt="" className="max-h-72 w-full object-cover" loading="lazy" />
        </Card>
      )}

      {(embedVideoUrl(material.videoUrl) || (material.links?.length ?? 0) > 0) && (
        <Card className="mb-6">
          <CardContent className="p-5">
            {embedVideoUrl(material.videoUrl) && (
              <div className="mb-4">
                <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
                  <Play className="h-4 w-4 text-primary" /> Video Pendukung
                </h2>
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                  <iframe
                    src={embedVideoUrl(material.videoUrl)!}
                    title={`Video: ${material.title}`}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                {material.videoUrl && (
                  <a href={material.videoUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    Buka di YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {material.links && material.links.length > 0 && (
              <div>
                <h2 className="mb-2 font-display text-sm font-bold">Referensi Tambahan</h2>
                <ul className="space-y-1.5">
                  {material.links.map((l, i) => (
                    <li key={i}>
                      <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {l.title || l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

          {(prev || next) && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link to={`/materials/${prev.id}`} className="group block rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" /> Materi sebelumnya
                  </span>
                  <span className="mt-1 block truncate text-sm font-bold group-hover:text-primary">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link to={`/materials/${next.id}`} className="group block rounded-xl border border-border/70 bg-card p-4 text-right transition-colors hover:border-primary/40 hover:bg-accent/40 sm:col-start-2">
                  <span className="flex items-center justify-end gap-1 text-[11px] font-semibold text-muted-foreground">
                    Materi berikutnya <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-1 block truncate text-sm font-bold group-hover:text-primary">{next.title}</span>
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}