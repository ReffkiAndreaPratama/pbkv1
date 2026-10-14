import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  MonitorCog,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { getJalur, jalurLabel } from "@/lib/learning-path";
import { PageLoader } from "@/components/ui/feedback";
import { cn, tierLabel, tierStatusClass } from "@/lib/utils";
import type { MasteryRow, PathItem, SummaryData } from "@/lib/types";

export function AdaptivePage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [path, setPath] = useState<PathItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<SummaryData>("/api/progress/summary"),
      api.get<MasteryRow[]>("/api/progress/mastery"),
      api.get<PathItem[]>("/api/cases/path"),
    ]).then(([s, m, p]) => {
      setSummary(s);
      setMastery(m);
      setPath(p);
    });
  }, []);

  if (!summary) return <PageLoader />;

  const p = summary.profile;
  const jalur = getJalur();
  const sorted = [...mastery].sort((a, b) => a.mastery - b.mastery);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  const focus = path.find((i) => i.type === "CASE") ?? path[0];

  const state = !p.pretestDone ? "needs" : (p.posttestDone && (p.posttestScore ?? 0) >= 70) ? "mastered" : "developing";
  const stateCopy = {
    needs: { title: "Belum ada profil kemampuan", text: "Kerjakan pretest agar TechTutor dapat menyusun rekomendasi belajar adaptif.", cta: "Kerjakan Pretest", href: "/quiz/pretest" },
    developing: { title: "Kamu sedang berkembang", text: `Fokus saat ini: ${jalurLabel(jalur)}. Terus latih skill yang masih di bawah 75%.`, cta: "Mulai Latihan", href: "/practice" },
    mastered: { title: "Selamat, jalur dikuasai!", text: "Posttest sudah lulus. Jaga kemampuanmu dengan kuis adaptif berkala.", cta: "Kuis Singkat", href: "/quiz/adaptive" },
  }[state];

  return (
    <div className="adaptive-page">
      <div className="page-heading">
        <div>
          <span className="kicker">PEMBELAJARAN ADAPTIF</span>
          <h1>Profil &amp; Rekomendasi Adaptif</h1>
          <p>Pembelajaran disesuaikan berdasarkan hasil aktivitasmu.</p>
        </div>
        <span className="date-chip">
          <Brain size={16} /> {jalurLabel(jalur)}
        </span>
      </div>

      <section className="adaptive-focus-banner">
        <span>
          <Target size={24} />
        </span>
        <div>
          <strong>{stateCopy.title}</strong>
          <p>{stateCopy.text}</p>
        </div>
        <Link className="btn btn-primary" to={stateCopy.href}>
          {stateCopy.cta} <ArrowRight size={17} />
        </Link>
      </section>

      <section className="panel adaptive-profile-summary">
        <span className="adaptive-profile-icon">
          <TrendingUp size={24} />
        </span>
        <div>
          <span className="kicker">RINGKASAN PROFIL</span>
          <h2>
            Level {p.level} · {p.totalXp} XP · Streak {p.streakDays} hari
          </h2>
        </div>
        <div className="mastery-summary">
          <div>
            <strong>{Math.round(summary.avgMastery * 100)}%</strong>
            <small>Rata-rata mastery</small>
          </div>
          <div>
            <strong>{summary.successCases}</strong>
            <small>Kasus berhasil</small>
          </div>
          <div>
            <strong>{summary.materialReads}</strong>
            <small>Materi dibaca</small>
          </div>
        </div>
      </section>

      <section className="panel adaptive-skill-panel">
        <div className="panel-head">
          <div>
            <span className="kicker">ANALISIS KEMAMPUAN</span>
            <h2>Penguasaan per Skill</h2>
          </div>
          <Link className="panel-link" to="/evaluation">
            Lihat evaluasi <ArrowRight size={15} />
          </Link>
        </div>
        <div className="adaptive-skill-list">
          {mastery.map((m) => (
            <div className="adaptive-skill-row" key={m.skillId}>
              <div className="skill-label">
                <strong>{m.code}</strong>
                <span className={cn("status", tierStatusClass(m.tier))}>{tierLabel(m.tier)}</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${Math.round(m.mastery * 100)}%` }} />
              </div>
              <strong className="skill-score">{Math.round(m.mastery * 100)}%</strong>
            </div>
          ))}
        </div>
        <div className="adaptive-profile-note">
          <Sparkles size={16} />
          {weakest && strongest ? (
            <span>
              Paling perlu diperkuat: <strong>{weakest.code}</strong> ({Math.round(weakest.mastery * 100)}%) · Paling kuat:{" "}
              <strong>{strongest.code}</strong> ({Math.round(strongest.mastery * 100)}%).
            </span>
          ) : (
            <span>Belum cukup data untuk analisis.</span>
          )}
        </div>
      </section>

      <div className="adaptive-recommendation-grid">
        <article className="panel adaptive-recommendation-card">
          <span className="adaptive-rec-icon">
            <BookOpenText size={21} />
          </span>
          <span className="kicker">MATERI</span>
          <h3>{focus?.type === "MATERIAL" ? focus.reason : `Pelajari konsep ${focus?.skillCode ?? "dasar"}`}</h3>
          <p>Baca materi untuk membangun fondasi sebelum berlatih.</p>
          <div className="adaptive-rec-meta">
            <span>
              <Clock size={14} /> 10 menit
            </span>
            <span>{focus?.skillCode ?? "DASAR"}</span>
          </div>
          <Link className="btn btn-secondary full-button" to="/materials">
            Buka Materi <ArrowRight size={17} />
          </Link>
        </article>

        <article className="panel adaptive-recommendation-card">
          <span className="adaptive-rec-icon">
            <MonitorCog size={21} />
          </span>
          <span className="kicker">SIMULASI</span>
          <h3>{focus?.type === "CASE" ? focus.reason : "Latih diagnosis pada kasus nyata"}</h3>
          <p>Kerjakan langkah diagnosis dan ukur akurasi serta efisiensimu.</p>
          <div className="adaptive-rec-meta">
            <span>
              <Clock size={14} /> 15 menit
            </span>
            <span>{focus?.skillCode ?? "DASAR"}</span>
          </div>
          <Link className="btn btn-secondary full-button" to="/cases">
            Buka Simulasi <ArrowRight size={17} />
          </Link>
        </article>

        <article className="panel adaptive-recommendation-card">
          <span className="adaptive-rec-icon">
            <Brain size={21} />
          </span>
          <span className="kicker">KUIS ADAPTIF</span>
          <h3>{weakest ? `Perkuat ${weakest.code}` : "Kuis adaptif personal"}</h3>
          <p>Soal dipilih berdasarkan skill dengan mastery terendah.</p>
          <div className="adaptive-rec-meta">
            <span>
              <Clock size={14} /> 10 soal
            </span>
            <span>{weakest?.code ?? "AUTO"}</span>
          </div>
          <Link className="btn btn-primary full-button" to={weakest ? `/quiz/adaptive?skill=${weakest.skillId}` : "/quiz/adaptive"}>
            Mulai Kuis <ArrowRight size={17} />
          </Link>
        </article>
      </div>

      <section className="panel adaptive-skill-panel">
        <div className="panel-head">
          <div>
            <span className="kicker">LANGKAH BERIKUTNYA</span>
            <h2>Urutan Rekomendasi</h2>
          </div>
        </div>
        {path.length === 0 ? (
          <div className="context-empty-state">
            <Check size={16} /> Belum ada rekomendasi. Lengkapi pretest dulu ya.
          </div>
        ) : (
          <div className="recommendation-flow">
            {path.map((item, i) => {
              const href =
                item.type === "MATERIAL"
                  ? `/materials/${item.refId}`
                  : item.type === "CASE"
                  ? `/cases/${item.refId}`
                  : item.type === "QUIZ"
                  ? `/quiz/adaptive?skill=${item.skillId}`
                  : "/quiz/posttest";
              return (
                <Link className="flow-item" key={i} to={href}>
                  <span className="flow-index">{i + 1}</span>
                  <div>
                    <strong>{item.reason}</strong>
                    <small>
                      {item.skillCode} · urgensi {item.urgency}
                    </small>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              );
            })}
          </div>
        )}
        <div className="adaptive-profile-note">
          <CheckCircle2 size={16} />
          Rekomendasi dihitung ulang otomatis setiap kali kamu menyelesaikan materi, kuis, atau simulasi.
        </div>
      </section>
    </div>
  );
}