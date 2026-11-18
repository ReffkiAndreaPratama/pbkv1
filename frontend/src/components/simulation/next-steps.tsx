import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Compass,
  GraduationCap,
  Lock,
  Sparkles,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, difficultyColor, difficultyLabel } from "@/lib/utils";
import type { SimRecommendations } from "@/lib/types";

/**
 * Panel "Langkah berikutnya" pada debrief simulasi.
 * Menutup loop belajar: materi pendukung, kasus lanjutan, dan CTA latihan/ujian.
 */
export function NextStepsPanel({ attemptId }: { attemptId: string }) {
  const [data, setData] = useState<SimRecommendations | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setHidden(false);
    api
      .get<SimRecommendations>(`/api/simulation/${attemptId}/recommendations`)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setHidden(true);
      });
    return () => {
      alive = false;
    };
  }, [attemptId]);

  if (hidden) return null;

  if (!data) {
    return (
      <div className="border-t border-border px-6 py-5">
        <div className="h-3 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-xl bg-muted/60" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/60" />
        </div>
      </div>
    );
  }

  const mastery = Math.max(0, Math.min(100, data.mastery));
  const readPct = data.totalMaterials
    ? Math.round((data.completedMaterials / data.totalMaterials) * 100)
    : 0;

  return (
    <div className="border-t border-border px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Langkah berikutnya
          </div>
          <h2 className="mt-0.5 font-display text-base font-extrabold">Tutup loop belajarmu</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono-tech text-[9px] font-bold text-muted-foreground">
          <Compass className="h-3 w-3" /> {data.skill.code}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ProgressRow label="Penguasaan skill" value={mastery} hint={data.skill.name} tone="emerald" />
        <ProgressRow
          label="Materi dibaca"
          value={readPct}
          hint={`${data.completedMaterials}/${data.totalMaterials} modul`}
          tone="blue"
        />
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <BookOpenText className="h-3 w-3" /> Materi pendukung
            </span>
            <Link
              to={`/materials?skill=${data.skill.code}`}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Semua
            </Link>
          </div>
          {data.materials.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">Belum ada materi untuk skill ini.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {data.materials.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/materials/${m.id}`}
                    className="group flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-white"
                  >
                    {m.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <BookOpenText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold leading-snug group-hover:text-primary">
                        {m.title}
                      </span>
                      <span
                        className={cn(
                          "block text-[9px]",
                          m.completed ? "text-emerald-600" : "text-muted-foreground"
                        )}
                      >
                        {m.completed ? "Sudah dibaca" : "Belum dibaca"}
                      </span>
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="inline-flex items-center gap-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <Target className="h-3 w-3" /> Kasus berikutnya
          </div>
          {data.nextCase ? (
            <div className="mt-2">
              <div className="flex items-start justify-between gap-2">
                <div className="line-clamp-2 text-[12px] font-bold leading-snug">{data.nextCase.title}</div>
                {data.nextCase.locked && (
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Terkunci" />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[8.5px] font-bold",
                    difficultyColor(data.nextCase.difficulty)
                  )}
                >
                  {difficultyLabel(data.nextCase.difficulty)}
                </span>
                <span className="font-mono-tech text-[9px] text-muted-foreground">
                  {data.nextCase.targetSteps} langkah
                </span>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{data.nextCase.reason}</p>
              <Link
                to={`/cases/${data.nextCase.id}`}
                className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline"
              >
                Buka kasus <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Semua kasus di skill ini sudah kamu jelajahi. Pertajam pemahaman lewat latihan soal.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/practice"
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 text-[11px] font-bold text-white transition-colors hover:bg-slate-800"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Latihan soal
        </Link>
        <Link
          to="/exam"
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[11px] font-bold text-slate-800 transition-colors hover:bg-muted"
        >
          <GraduationCap className="h-3.5 w-3.5" /> Ujian
        </Link>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "emerald" | "blue";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "font-mono-tech text-[10px] font-extrabold",
            tone === "emerald" ? "text-emerald-600" : "text-blue-600"
          )}
        >
          {value}%
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "emerald" ? "bg-emerald-500" : "bg-blue-500"
          )}
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
      <div className="mt-1 truncate text-[9px] text-muted-foreground">{hint}</div>
    </div>
  );
}
