import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, Brain, CheckCircle2, ClipboardList, MonitorCog, Target, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { PageLoader } from "@/components/ui/feedback";
import { tierLabel, tierStatusClass, cn } from "@/lib/utils";
import type { SummaryData, QuizSessionRow, MasteryRow } from "@/lib/types";

export function PracticePage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);

  useEffect(() => {
    Promise.all([api.get<SummaryData>("/api/progress/summary"), api.get<MasteryRow[]>("/api/progress/mastery")]).then(
      ([s, m]) => {
        setSummary(s);
        setMastery(m);
      }
    );
  }, []);

  if (!summary) return <PageLoader />;

  const recent = summary.recentQuizzes;
  const avgScore = recent.length
    ? Math.round(recent.reduce((a, q) => a + (q.score ?? 0), 0) / recent.length)
    : 0;
  const weak = [...summary.masteryBySkill].sort((a, b) => a.mastery - b.mastery);

  return (
    <div className="practice-page">
      <div className="practice-top">
        <div className="page-heading">
          <span className="kicker">LATIHAN</span>
          <h1>Latihan Kemampuan</h1>
          <p>Pilih jenis latihan yang sesuai dengan kebutuhanmu hari ini.</p>
        </div>
        <span className="date-chip">
          <Target size={16} /> {getJalur()} Track
        </span>
      </div>

      <section className="panel practice-summary">
        <div>
          <span className="kicker">RINGKASAN LATIHAN</span>
          <h2 className="summary-title">{recent.length} kuis dikerjakan</h2>
        </div>
        <div className="practice-summary-stats">
          <div>
            <strong>{avgScore}</strong>
            <small>Rata-rata skor</small>
          </div>
          <div>
            <strong>{summary.profile.level}</strong>
            <small>Level</small>
          </div>
          <div>
            <strong>{summary.profile.totalXp}</strong>
            <small>Total XP</small>
          </div>
        </div>
      </section>

      <div className="practice-category-grid">
        <article className="panel practice-category-card">
          <div className="practice-card-top">
            <span className="practice-category-icon">
              <ClipboardList size={21} />
            </span>
            <span className="status status-in-progress">Wajib</span>
          </div>
          <h3>Pretest Kemampuan</h3>
          <p>Ukur kemampuan awal sebelum jalur belajar adaptif disusun.</p>
          <div className="practice-card-progress">
            <div className="inline-progress">
              <div className="progress-track">
                <span style={{ width: summary.profile.pretestDone ? "100%" : "0%" }} />
              </div>
              <strong>{summary.profile.pretestDone ? "Selesai" : "0%"}</strong>
            </div>
          </div>
          <Link className="btn btn-secondary full-button" to="/quiz/pretest">
            {summary.profile.pretestDone ? "Ulangi Pretest" : "Mulai Pretest"} <ArrowRight size={17} />
          </Link>
        </article>

        <article className="panel practice-category-card">
          <div className="practice-card-top">
            <span className="practice-category-icon">
              <Brain size={21} />
            </span>
            <span className="status status-developing">Adaptif</span>
          </div>
          <h3>Kuis Adaptif</h3>
          <p>Soal menyesuaikan penguasaan skill yang sedang kamu latih.</p>
          <div className="practice-card-progress">
            <div className="inline-progress">
              <div className="progress-track">
                <span style={{ width: `${Math.round(summary.avgMastery * 100)}%` }} />
              </div>
              <strong>{Math.round(summary.avgMastery * 100)}%</strong>
            </div>
          </div>
          <Link className="btn btn-secondary full-button" to="/quiz/adaptive">
            Mulai Kuis <ArrowRight size={17} />
          </Link>
        </article>

        <article className="panel practice-category-card">
          <div className="practice-card-top">
            <span className="practice-category-icon">
              <Trophy size={21} />
            </span>
            <span className={cn("status", summary.profile.posttestDone ? "status-mastered" : "status-needs-practice")}>
              {summary.profile.posttestDone ? "Lulus" : "Belum"}
            </span>
          </div>
          <h3>Posttest</h3>
          <p>Uji pemahaman akhir setelah menyelesaikan materi &amp; simulasi. Minimal lulus: 70.</p>
          <div className="practice-card-progress">
            <div className="inline-progress">
              <div className="progress-track">
                <span style={{ width: summary.profile.posttestDone ? "100%" : "0%" }} />
              </div>
              <strong>{summary.profile.posttestScore ?? 0}</strong>
            </div>
          </div>
          <Link className="btn btn-secondary full-button" to="/quiz/posttest">
            Mulai Posttest <ArrowRight size={17} />
          </Link>
        </article>
      </div>

      <div className="practice-layout">
        <section className="panel skill-panel">
          <div className="panel-head">
            <div>
              <span className="kicker">FOKUS PER SKILL</span>
              <h2>Latihan Berdasarkan Kemampuan</h2>
            </div>
          </div>
          <div className="adaptive-skill-list">
            {mastery.map((m) => {
              const pct = Math.round(m.mastery * 100);
              return (
                <div className="adaptive-skill-row" key={m.skillId}>
                  <div className="skill-label">
                    <strong>{m.code}</strong>
                    <span className={cn("status", tierStatusClass(m.tier))}>{tierLabel(m.tier)}</span>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <Link className="btn btn-soft btn-mini" to={`/quiz/adaptive?skill=${m.skillId}`}>
                    Latihan
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="practice-aside">
          <section className="panel competency-card">
            <span className="kicker">REKOMENDASI</span>
            <h3>Perkuat {weak[0]?.code ?? "skill dasar"}</h3>
            <p>
              {weak[0]
                ? `Penguasaan saat ini ${Math.round(weak[0].mastery * 100)}% (${tierLabel(weak[0].tier)}). Kerjakan kuis adaptif untuk menaikkan level.`
                : "Kerjakan pretest agar rekomendasi dapat disusun."}
            </p>
            <Link className="btn btn-primary full-button" to="/quiz/adaptive">
              Mulai Kuis Adaptif
            </Link>
          </section>

          <section className="panel competency-card">
            <span className="kicker">RIWAYAT</span>
            <h3>Kuis Terbaru</h3>
            <div className="quiz-history">
              {recent.length === 0 ? (
                <p className="competency-note">Belum ada kuis yang dikerjakan.</p>
              ) : (
                recent.slice(0, 4).map((q) => <HistoryRow key={q.id} q={q} />)
              )}
            </div>
          </section>

          <section className="panel competency-card">
            <span className="kicker">MATERI</span>
            <h3>Baca Materi Pendukung</h3>
            <p>Materi menjelaskan konsep sebelum kamu berlatih.</p>
            <Link className="btn btn-secondary full-button" to="/materials">
              <BookOpenText size={17} /> Buka Materi
            </Link>
          </section>

          <section className="panel competency-card">
            <span className="kicker">SIMULASI</span>
            <h3>Latihan Kasus Nyata</h3>
            <p>Terapkan langkah diagnosis pada pohon keputusan kasus.</p>
            <Link className="btn btn-secondary full-button" to="/cases">
              <MonitorCog size={17} /> Buka Simulasi
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HistoryRow({ q }: { q: QuizSessionRow }) {
  const label: Record<string, string> = { PRETEST: "Pretest", POSTTEST: "Posttest", ADAPTIVE: "Kuis Adaptif" };
  const pass = q.score !== null && q.score >= 70;
  return (
    <div className="quiz-history-row">
      <span className="quiz-type-icon">
        <CheckCircle2 size={17} />
      </span>
      <div className="quiz-meta">
        <strong>{label[q.type] ?? q.type}</strong>
        <small>
          {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
        </small>
      </div>
      <span className={cn("status", pass ? "status-mastered" : "status-needs-practice")}>
        {q.completedAt ? (pass ? "Lulus" : "Remedial") : "Berjalan"}
      </span>
    </div>
  );
}