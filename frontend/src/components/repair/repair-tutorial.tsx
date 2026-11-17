import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  MousePointerClick,
  Power,
  Search,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const REPAIR_TUTORIAL_KEY = "techtutor:repair-tutorial-done";

export function hasSeenRepairTutorial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REPAIR_TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markRepairTutorialSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REPAIR_TUTORIAL_KEY, "1");
  } catch {
    /* abaikan */
  }
}

interface TutorialStep {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  tip: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: Compass,
    eyebrow: "Langkah 1",
    title: "Pilih misi PC atau laptop",
    body: "Setiap kartu adalah satu perangkat rusak dengan gejala berbeda. Gunakan filter Semua / PC / Laptop untuk memilih bentuk perangkat yang ingin kamu latih.",
    tip: "Misi mudah cocok untuk pemanasan. Misi sulit punya lebih banyak komponen dan waktu lebih ketat.",
  },
  {
    icon: MousePointerClick,
    eyebrow: "Langkah 2",
    title: "Klik komponen di meja kerja",
    body: "Ketuk komponen langsung pada gambar PC/laptop, atau pilih periferal dan kabel di baki meja. Di HP, buka daftar komponen agar target sentuh lebih besar.",
    tip: "Komponen yang sudah diinspeksi berwarna biru, yang sudah diperbaiki berwarna hijau.",
  },
  {
    icon: Search,
    eyebrow: "Langkah 3",
    title: "Pilih alat di tool dock, lalu klik komponen",
    body: "Tool dock di bawah meja kerja berisi Pilih (0), Inspeksi (1), Multimeter (2), POST Card (3), dan Diagnostik Software (4). Pilih alat, lalu klik komponen untuk menerapkannya.",
    tip: "Hasil inspeksi dan pengukuran muncul di Panel Diagnosis. Tidak semua alat berguna untuk setiap komponen.",
  },
  {
    icon: Wrench,
    eyebrow: "Langkah 4",
    title: "Perbaiki dengan tindakan yang tepat",
    body: "Pilih Ganti Komponen, Reseat, Bersihkan, atau Sambung Ulang sesuai akar masalah. Tindakan yang salah akan mengurangi 1 nyawa.",
    tip: "Baca petunjuk dan hasil tes dulu. Combo bertambah kalau kamu melakukan beberapa tindakan benar berturut-turut.",
  },
  {
    icon: Power,
    eyebrow: "Langkah 5",
    title: "Tes nyala untuk menyelesaikan misi",
    body: "Setelah semua komponen bermasalah diperbaiki, tekan Tes Nyala. Perangkat akan menyala dan skor dihitung dari akurasi, kecepatan, combo, serta sisa nyawa.",
    tip: "Kalau Tes Nyala gagal, nyawa berkurang. Periksa kembali diagnosis sebelum mencoba lagi.",
  },
];

interface RepairTutorialProps {
  open: boolean;
  onClose: () => void;
}

export function RepairTutorial({ open, onClose }: RepairTutorialProps) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    const t = window.setTimeout(() => dialogRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(STEPS.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const step = STEPS[index];
  const Icon = step.icon;
  const isLast = index === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#03070e]/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="repair-tutorial-title"
        tabIndex={-1}
        className="animate-fade-in-up w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/10 bg-[#081422] text-slate-200 shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] outline-none sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="flex items-center gap-2 font-mono-tech text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            <Wrench className="h-3.5 w-3.5" aria-hidden /> Cara main bengkel
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Tutup tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-2 pt-5">
          <div className="mb-4 flex items-center gap-1.5" aria-label={`Langkah ${index + 1} dari ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ke langkah ${i + 1}: ${s.title}`}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-7 bg-emerald-400" : i < index ? "w-3 bg-emerald-400/50" : "w-3 bg-white/15"
                )}
              />
            ))}
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/25">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {step.eyebrow}
              </div>
              <h2 id="repair-tutorial-title" className="mt-0.5 font-display text-lg font-extrabold leading-snug text-white">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.body}</p>

          <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-400/[0.08] px-3 py-2.5 text-xs leading-relaxed text-amber-100/90">
            <strong className="font-bold text-amber-300">Tips:</strong> {step.tip}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 transition-colors hover:text-white"
          >
            Lewati
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </Button>
            {isLast ? (
              <Button size="sm" onClick={onClose}>
                Siap, mulai! <Power className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}>
                Lanjut <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
