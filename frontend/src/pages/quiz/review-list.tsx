import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizReviewItem } from "@/lib/types";

interface ReviewListProps {
  review: QuizReviewItem[];
  title?: string;
  description?: string;
}

/** Daftar pembahasan lengkap — dipakai setelah latihan selesai dan setelah ujian dikumpulkan. */
export function ReviewList({ review, title = "Tinjau jawabanmu", description }: ReviewListProps) {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Pembahasan
          </div>
          <h2 className="mt-0.5 font-display text-xl font-extrabold">{title}</h2>
          {description && <p className="mt-1 text-[11.5px] text-muted-foreground">{description}</p>}
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground">{review.length} soal</span>
      </div>

      <div className="mt-4 space-y-3">
        {review.map((r, i) => (
          <article key={i} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-2.5">
              <span className="inline-flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono-tech text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Soal {i + 1}
                </span>
              </span>
              {r.isCorrect ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Benar
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                  <XCircle className="h-3 w-3" /> Salah
                </span>
              )}
            </div>

            <div className="p-4">
              <p className="text-[13.5px] font-bold leading-snug text-slate-800">{r.prompt}</p>
              <div className="mt-3 space-y-2">
                {r.options.map((opt) => {
                  const isSelected = r.selectedKeys.includes(opt.key);
                  const isKey = r.correctKeys.includes(opt.key);
                  return (
                    <div
                      key={opt.key}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                        isKey
                          ? "border-emerald-300 bg-emerald-50/70"
                          : isSelected
                            ? "border-rose-300 bg-rose-50/70"
                            : "border-border/60 bg-muted/20"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-mono-tech text-[10px] font-bold",
                          isKey ? "bg-emerald-500 text-white" : isSelected ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {opt.key.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium leading-snug text-slate-700">{opt.text}</p>
                        {(isKey || isSelected) && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {isKey && <span className="text-[9.5px] font-bold text-emerald-700">✓ Kunci jawaban</span>}
                            {isSelected && !isKey && <span className="text-[9.5px] font-bold text-rose-700">✗ Jawabanmu</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {r.explanation && (
                <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-slate-700">
                  <span className="font-bold text-primary">Penjelasan: </span>
                  {r.explanation}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
