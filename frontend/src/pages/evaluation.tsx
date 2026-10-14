import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, CheckCircle2, Clock, Flame, ListChecks, TrendingUp, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { tierLabel, tierStatusClass, cn, quizTypeLabel, formatNumber } from "@/lib/utils";
import type { SummaryData, QuizSessionRow } from "@/lib/types";

export function EvaluationPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    api.get<SummaryData>("/api/progress/summary").then(setSummary);
  }, []);

  if (!summary) return <PageLoader />;

  const p = summary.profile;
  const completed = summary.recentQuizzes.filter((q) => q.completedAt);
  const avg = completed.length
    ? Math.round(completed.reduce((a, q) => a + (q.score ?? 0), 0) / completed.length)
    : 0;
  const pretestScore = summary.recentQuizzes.find((q) => q.type === "PRETEST")?.score ?? null;
  const posttestScore = summary.recentQuizzes.find((q) => q.type === "POSTTEST")?.score ?? p.posttestScore;
  const growth = pretestScore !== null && posttestScore !== null ? Math.round(posttestScore - pretestScore) : null;

  return (
    <div className="results-page">
      <div className="page-heading">
        <div>
          <span className="kicker">EVALUASI HASIL BELAJAR</span>
          <h1>Hasil &amp; Evaluasi</h1>
          <p>Pantau perkembangan kompetensimu dari waktu ke waktu.</p>
        </div>
        <span className="date-chip">
          <Clock size={16} /> Diperbarui otomatis
        </span>
      </div>

      <section className="panel growth-comparison">
        <div>
          <span className="kicker">PERBANDINGAN HASIL</span>
          <h2 className="summary-title">Pretest → Posttest</h2>
          <div className="final-eval-details">
            <div className="eval-detail">
              <small>PRETEST</small>
              <strong>{pretestScore !== null ? `${Math.round(pretestScore)}/100` : "—"}</strong>
            </div>
            <div className="eval-detail">
              <small>POSTTEST</small>
              <strong>{posttestScore !== null ? `${Math.round(posttestScore)}/100` : "—"}</strong>
            </div>
            <div className="eval-detail">
              <small>RATA-RATA KUIS</small>
              <strong>{avg}/100</strong>
            </div>
            <div className="eval-detail">
              <small>STATUS</small>
              <strong>{p.posttestDone ? "Selesai" : "Berjalan"}</strong>
            </div>
          </div>
          <div className="growth-bars">
            <div className="growth-column" style={{ height: `${Math.max(10, pretestScore ?? 10)}%` }}>
              {pretestScore !== null ? Math.round(pretestScore) : 0}
            </div>
            <div className="growth-column" style={{ height: `${Math.max(10, avg || 10)}%` }}>{avg}</div>
            <div className="growth-column" style={{ height: `${Math.max(10, posttestScore ?? 10)}%` }}>
              {posttestScore !== null ? Math.round(posttestScore) : 0}
            </div>
          </div>
          <div className="growth-caption">
            <span>Pretest</span>
            <span>Rata-rata</span>
            <span>Posttest</span>
          </div>
        </div>
        <div className="growth-highlight">
          <TrendingUp size={26} />
          <strong>{growth !== null ? `${growth > 0 ? "+" : ""}${growth}` : "—"}</strong>
          <span>Poin perubahan skor</span>
          <p>
            {growth !== null
              ? growth > 0
                ? "Kemampuanmu meningkat setelah menyelesaikan jalur belajar."
                : "Terus latih skill yang masih lemah agar skormu naik."
              : "Kerjakan pretest dan posttest untuk melihat pertumbuhanmu."}
          </p>
        </div>
      </section>

      <div className="results-grid">
        <section className="panel results-skills">
          <div className="panel-head">
            <div>
              <span className="kicker">KOMPETENSI</span>
              <h2>Perkembangan Keterampilan</h2>
            </div>
            <Link className="panel-link" to="/progress">
              Detail <ArrowRight size={15} />
            </Link>
          </div>
          <div className="adaptive-skill-list">
            {summary.masteryBySkill.map((m) => (
              <div className="adaptive-skill-row" key={m.code}>
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
        </section>

        <section className="panel results-skills">
          <div className="panel-head">
            <div>
              <span className="kicker">PROGRESSION</span>
              <h2>Ringkasan Capaian</h2>
            </div>
          </div>
          <div className="summary-stat-list">
            <div>
              <span className="mini-icon blue">
                <Trophy size={17} />
              </span>
              <div>
                <strong>Level {p.level}</strong>
                <small>{formatNumber(p.totalXp)} XP total</small>
              </div>
            </div>
            <div>
              <span className="mini-icon orange">
                <Flame size={17} />
              </span>
              <div>
                <strong>{p.streakDays} hari streak</strong>
                <small>Jaga streak harianmu</small>
              </div>
            </div>
            <div>
              <span className="mini-icon green">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <strong>{summary.successCases} kasus berhasil</strong>
                <small>Dari {summary.totalCases} kasus</small>
              </div>
            </div>
            <div>
              <span className="mini-icon navy">
                <Brain size={17} />
              </span>
              <div>
                <strong>{Math.round(summary.avgMastery * 100)}% rata-rata mastery</strong>
                <small>Average kompetensi</small>
              </div>
            </div>
          </div>
          {!p.posttestDone && (
            <div className="eval-cta">
              <p>Posttest membuktikan sejauh mana kamu menguasai jalur ini.</p>
              <Link className="btn btn-primary full-button" to="/quiz/posttest">
                Kerjakan Posttest <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="panel results-skills">
        <div className="panel-head">
          <div>
            <span className="kicker">RIWAYAT</span>
            <h2>Semua Hasil Kuis</h2>
          </div>
        </div>
        {summary.recentQuizzes.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={24} />}
            title="Belum ada hasil kuis"
            description="Kerjakan pretest untuk memulai evaluasi kemampuanmu."
          />
        ) : (
          <div className="quiz-history">
            {summary.recentQuizzes.map((q) => (
              <EvalRow key={q.id} q={q} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EvalRow({ q }: { q: QuizSessionRow }) {
  const pass = q.score !== null && q.score >= 70;
  return (
    <div className="quiz-history-row">
      <span className="quiz-type-icon">
        <ListChecks size={17} />
      </span>
      <div className="quiz-meta">
        <strong>{quizTypeLabel(q.type)}</strong>
        <small>
          {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
        </small>
      </div>
      <small className="quiz-date">{q.completedAt ? new Date(q.completedAt).toLocaleDateString("id-ID") : "—"}</small>
      <span className={cn("status", pass ? "status-mastered" : q.completedAt ? "status-needs-practice" : "status-in-progress")}>
        {q.completedAt ? (pass ? "Lulus" : "Remedial") : "Berjalan"}
      </span>
    </div>
  );
}