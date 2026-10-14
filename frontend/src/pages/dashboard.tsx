import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Brain,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Laptop,
  ListChecks,
  MonitorCog,
  Monitor,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { getJalur } from "@/lib/learning-path";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { tierLabel, tierStatusClass, formatNumber, greeting, dateChip, cn } from "@/lib/utils";
import type { SummaryData, PathItem, QuizSessionRow } from "@/lib/types";

const pathIcon: Record<string, React.ReactNode> = {
  MATERIAL: <BookOpenText size={17} />,
  CASE: <MonitorCog size={17} />,
  QUIZ: <Brain size={17} />,
  POSTTEST: <Trophy size={17} />,
};

const pathHref = (item: PathItem) =>
  item.type === "MATERIAL"
    ? `/materials/${item.refId}`
    : item.type === "CASE"
    ? `/cases/${item.refId}`
    : item.type === "QUIZ"
    ? `/quiz/adaptive?skill=${item.skillId}`
    : "/quiz/posttest";

export function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [path, setPath] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get<SummaryData>("/api/progress/summary"), api.get<PathItem[]>("/api/cases/path")])
      .then(([s, p]) => {
        setSummary(s);
        setPath(p);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <PageLoader />;

  const p = summary.profile;
  const jalur = getJalur();
  const isPC = jalur === "PC";
  const overall = Math.min(100, Math.round((summary.avgMastery || 0) * 100));
  const currentMaterial = path.find((i) => i.type === "MATERIAL");
  const recommended = path[0];

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <span className="kicker">DASHBOARD</span>
          <h1>
            {greeting()}, {user?.name?.split(" ")[0]}! 👋 Lanjutkan pembelajaranmu.
          </h1>
          <p>Pantau progres dan lanjutkan aktivitas terakhir kamu.</p>
        </div>
        <span className="date-chip">
          <Clock size={16} /> {dateChip()}
        </span>
      </div>

      {!p.pretestDone && (
        <div className="dashboard-banner">
          <span>
            <Target size={19} />
          </span>
          <div>
            <strong>Belum mengerjakan pretest</strong>
            <p>Pretest membantu kami mengukur kemampuan awalmu dan menyusun jalur belajar adaptif.</p>
          </div>
          <Link className="btn btn-primary" to="/quiz/pretest">
            Kerjakan Pretest
          </Link>
        </div>
      )}

      <section className="active-path-card">
        <div className="active-path-copy">
          <span className="overline">JALUR AKTIF</span>
          <div className="active-title">
            <span>{isPC ? <Monitor size={28} /> : <Laptop size={28} />}</span>
            <div>
              <h2>Troubleshooting {jalur}</h2>
              <p>
                {summary.materialReads} dari {summary.totalCases} aktivitas selesai
              </p>
            </div>
          </div>
          <div className="active-progress">
            <div>
              <span>Progress keseluruhan</span>
              <strong>{overall}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${overall}%` }} />
            </div>
          </div>
          <Link className="btn btn-primary" to={currentMaterial ? pathHref(currentMaterial) : "/materials"}>
            Lanjutkan Materi
          </Link>
        </div>
        <div className="active-art">
          <img src={isPC ? "/materials/display.jpg" : "/materials/boot.jpg"} alt="Komponen perangkat" />
          <span className="art-chip chip-one">
            {isPC ? "RAM" : "BATTERY"} <Check size={12} />
          </span>
          <span className="art-chip chip-two">{isPC ? "BIOS" : "CHARGING"}</span>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel current-panel">
          <div className="panel-head">
            <div>
              <span className="kicker">LANJUTKAN DARI TERAKHIR</span>
              <h2>Materi Saat Ini</h2>
            </div>
            <span className="module-pill">{currentMaterial ? currentMaterial.skillCode : "MULAI"}</span>
          </div>
          <div className="current-content">
            <span className="content-icon">
              <BookOpenText size={25} />
            </span>
            <div>
              <h3>{currentMaterial ? currentMaterial.reason : "Mulai dari materi pertama"}</h3>
              <p>{currentMaterial ? "Ikuti materi yang direkomendasikan sesuai hasil pretest kamu." : "Baca materi untuk membangun dasar troubleshooting."}</p>
              <div className="inline-progress">
                <div className="progress-track">
                  <span style={{ width: `${overall}%` }} />
                </div>
                <strong>{summary.materialReads}/6</strong>
              </div>
            </div>
          </div>
          <Link className="btn btn-secondary" to="/materials">
            Buka Materi <ArrowRight size={17} />
          </Link>
        </section>

        <section className="panel recommendation-panel">
          <div className="panel-head">
            <div>
              <span className="kicker">REKOMENDASI UNTUKMU</span>
              <h2>Aktivitas Berikutnya</h2>
            </div>
            <span className="spark-box">
              <Sparkles size={18} />
            </span>
          </div>
          <div className="recommendation-content">
            <span className="content-icon orange">
              <Target size={25} />
            </span>
            <div>
              <h3>{recommended ? recommended.reason : "Latihan adaptif"}</h3>
              <p>{recommended ? `Fokus pada skill ${recommended.skillCode} yang masih perlu diperkuat.` : "Kerjakan pretest untuk mendapat rekomendasi personal."}</p>
              <span className="meta">
                <Clock size={15} /> 10 menit <i /> 10 soal
              </span>
            </div>
          </div>
          <Link className="btn btn-secondary" to="/practice">
            Mulai Latihan <ArrowRight size={17} />
          </Link>
        </section>
      </div>

      <div className="dashboard-insight-row">
        <section className="panel">
          <span>
            <CheckCircle2 size={18} />
          </span>
          <div>
            <small>HASIL TERAKHIR</small>
            <strong>
              {summary.recentQuizzes[0]
                ? `${summary.recentQuizzes[0].correctCount}/${summary.recentQuizzes[0].totalCount} benar · ${Math.round(summary.recentQuizzes[0].score ?? 0)}%`
                : "Belum ada hasil"}
            </strong>
          </div>
        </section>
        <section className="panel weak">
          <span>
            <Target size={18} />
          </span>
          <div>
            <small>KATEGORI LEMAH</small>
            <strong>{weakestSkill(summary) || "Belum ada data"}</strong>
          </div>
        </section>
        <section className="panel action">
          <span>
            <MonitorCog size={18} />
          </span>
          <div>
            <small>AKSES CEPAT</small>
            <strong>Simulasi Troubleshooting</strong>
          </div>
          <Link to="/cases">
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>

      <div className="dashboard-bottom">
        <section className="panel skill-panel">
          <div className="panel-head">
            <div>
              <span className="kicker">PERKEMBANGAN KEMAMPUAN</span>
              <h2>Progress Keterampilan</h2>
            </div>
            <Link className="panel-link" to="/progress">
              Lihat detail <ArrowRight size={15} />
            </Link>
          </div>
          <div className="skills-grid">
            {summary.masteryBySkill.map((m) => (
              <div className="skill-row" key={m.code}>
                <div className="skill-label">
                  <strong>{m.code}</strong>
                  <span className={`status ${tierStatusClass(m.tier)}`}>{tierLabel(m.tier)}</span>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${Math.round(m.mastery * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="adaptive-card">
          <Link className="adaptive-link" to="/adaptive">
            <span className="adaptive-icon">
              <Brain size={28} />
            </span>
            <span className="kicker">PEMBELAJARAN ADAPTIF</span>
            <h3>Belajar sesuai kebutuhanmu</h3>
            <p>Pembelajaran disesuaikan berdasarkan hasil aktivitasmu.</p>
            <div>
              <Sparkles size={16} /> Lihat rekomendasi terbaru <ArrowRight size={14} />
            </div>
          </Link>
        </aside>
      </div>

      <div className="panel dashboard-mini">
        <div className="mini-stat">
          <span className="mini-icon blue">
            <Sparkles size={17} />
          </span>
          <div>
            <strong>{formatNumber(p.totalXp)}</strong>
            <small>XP Total</small>
          </div>
        </div>
        <div className="mini-stat">
          <span className="mini-icon orange">
            <Flame size={17} />
          </span>
          <div>
            <strong>{p.streakDays}</strong>
            <small>Streak hari</small>
          </div>
        </div>
        <div className="mini-stat">
          <span className="mini-icon green">
            <Trophy size={17} />
          </span>
          <div>
            <strong>Level {p.level}</strong>
            <small>Level saat ini</small>
          </div>
        </div>
        <div className="mini-stat">
          <span className="mini-icon navy">
            <ListChecks size={17} />
          </span>
          <div>
            <strong>{summary.successCases}</strong>
            <small>Kasus berhasil</small>
          </div>
        </div>
      </div>

      <section className="panel skill-panel">
        <div className="panel-head">
          <div>
            <span className="kicker">KUIS TERBARU</span>
            <h2>Riwayat Kuis</h2>
          </div>
          <Link className="panel-link" to="/evaluation">
            Lihat evaluasi <ArrowRight size={15} />
          </Link>
        </div>
        {summary.recentQuizzes.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={24} />}
            title="Belum ada kuis"
            description="Kerjakan pretest, kuis adaptif, atau posttest untuk melihat hasilnya di sini."
          />
        ) : (
          <div className="quiz-history">
            {summary.recentQuizzes.map((q) => (
              <QuizHistoryRow key={q.id} q={q} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function weakestSkill(s: SummaryData): string | null {
  const weak = [...s.masteryBySkill].sort((a, b) => a.mastery - b.mastery)[0];
  if (!weak || weak.mastery >= 0.75) return null;
  return `${weak.code} — ${tierLabel(weak.tier)}`;
}

function QuizHistoryRow({ q }: { q: QuizSessionRow }) {
  const typeLabel: Record<string, string> = { PRETEST: "Pretest", POSTTEST: "Posttest", ADAPTIVE: "Kuis Adaptif" };
  const pass = q.score !== null && q.score >= 70;
  return (
    <div className="quiz-history-row">
      <span className="quiz-type-icon">
        <ListChecks size={17} />
      </span>
      <div className="quiz-meta">
        <strong>{typeLabel[q.type] ?? q.type}</strong>
        <small>
          {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
        </small>
      </div>
      <span className={cn("status", pass ? "status-mastered" : q.completedAt ? "status-needs-practice" : "status-in-progress")}>
        {q.completedAt ? (pass ? "Lulus" : "Belum lulus") : "Berjalan"}
      </span>
    </div>
  );
}