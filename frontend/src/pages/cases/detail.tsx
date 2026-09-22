import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, MonitorCog, Lightbulb, ListOrdered } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/feedback";
import { difficultyLabel, difficultyColor, cn } from "@/lib/utils";
import type { CaseDetail } from "@/lib/types";

export function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (id) api.get<CaseDetail>(`/api/cases/${id}`).then(setCaseDetail).catch(() => setCaseDetail(null));
  }, [id]);

  const start = async () => {
    if (!id) return;
    setStarting(true);
    try {
      const res = await api.post<{ attemptId: string }>(`/api/cases/${id}/start`);
      navigate(`/simulation/${res.attemptId}`);
    } catch {
      setStarting(false);
    }
  };

  if (!caseDetail) return <PageLoader />;

  const bestPath = caseDetail.nodes.filter((n) => n.isOnBestPath);
  const active = user?.profile?.pretestDone;

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link to="/cases">
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar kasus
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono-tech">{caseDetail.skill.code}</Badge>
              <Badge className={difficultyColor(caseDetail.difficulty)}>{difficultyLabel(caseDetail.difficulty)}</Badge>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{caseDetail.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {caseDetail.skill.name} · ±{caseDetail.targetSteps} langkah optimal
            </p>
          </div>
          <Button size="lg" onClick={() => void start()} disabled={starting} className="shrink-0 gap-2">
            <Play className="h-4 w-4" /> {starting ? "Menyiapkan…" : "Mulai Simulasi"}
          </Button>
        </div>
      </div>

      {!active && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-50 p-4 text-sm text-amber-800">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Kamu bebas bereksplorasi, tapi disarankan mengerjakan <b>Pretest</b> dulu agar jalur adaptifmu akurat.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <MonitorCog className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-bold">Skenario Kasus</h2>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{caseDetail.scenario}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-bold">Alur Simulasi</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Kamu akan diberi <b>situasi & gejala</b>, lalu harus memilih <b>langkah diagnosis/solusi</b> yang tepat. Gerakan yang salah
                mengurangi akurasi. Gunakan tombol <b>💡 Hint</b> jika buntu — makin banyak hint, makin kecil skor.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Fokus pada ~{caseDetail.targetSteps} langkah optimal</Badge>
                <Badge variant="secondary">Estimasi wakt</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Skill yang dilatih</div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-mono-tech text-xs font-bold text-primary">
                  {caseDetail.skill.code.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{caseDetail.skill.name}</div>
                  <div className="text-xs text-muted-foreground">Sesuai kurikulum troubleshooting</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Jalur terbaik</span>
                <Badge variant="success" className="text-[10px]">
                  {caseDetail.targetSteps} langkah
                </Badge>
              </div>
              {bestPath.length > 0 && (
                <ol className="space-y-1.5">
                  {bestPath.slice(0, 8).map((n, i) => (
                    <li key={n.nodeKey} className={cn("flex items-start gap-2 text-xs", i === bestPath.length - 1 ? "font-semibold text-emerald-600" : "text-muted-foreground")}>
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span className="line-clamp-1">{n.text}</span>
                    </li>
                  ))}
                  {bestPath.length > 8 && <li className="text-xs text-muted-foreground">… dan langkah lainnya</li>}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}