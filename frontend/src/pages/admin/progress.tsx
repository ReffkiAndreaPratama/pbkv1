import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, CheckCircle2, Flame, ListChecks, Search, TrendingUp, Trophy, Users, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/ui/feedback";
import { cn, formatDate, formatNumber } from "@/lib/utils";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  simCount: number;
  profile: {
    totalXp: number;
    level: number;
    pretestDone: boolean;
    posttestDone: boolean;
    posttestScore: number | null;
    streakDays: number;
    learningStyle: string | null;
    targetLevel: string | null;
  };
}

interface AdminStats {
  totalUsers: number;
  totalCases: number;
  totalSims: number;
  totalQuizzes: number;
  totalMaterials: number;
  successRate: number;
  avgSimScore: number;
  skillAverages: { name: string; avgMastery: number; count: number }[];
}

export function AdminProgressPage() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([api.get<AdminUserRow[]>("/api/admin/users"), api.get<AdminStats>("/api/admin/stats")]).then(([u, s]) => {
      setUsers(u);
      setStats(s);
    });
  }, []);

  if (!users || !stats) return <PageLoader />;

  const filtered = users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const learners = users.filter((u) => u.role === "USER");
  const pretestDone = learners.filter((u) => u.profile.pretestDone).length;
  const posttestDone = learners.filter((u) => u.profile.posttestDone).length;
  const avgLevel = learners.length
    ? Math.round((learners.reduce((a, u) => a + u.profile.level, 0) / learners.length) * 10) / 10
    : 0;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="kicker">MONITOR PROGRES</span>
          <h1>Monitor Progres Pelajar</h1>
          <p>Pantau XP, level, pretest/posttest, dan aktivitas seluruh pelajar.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="btn btn-secondary" to="/admin/users">
            <Users size={17} /> Kelola Pengguna
          </Link>
        </div>
      </div>

      <div className="admin-progress-summary">
        <div className="admin-stat-card">
          <span className="mini-icon blue">
            <TrendingUp size={17} />
          </span>
          <div>
            <strong>{stats.successRate}%</strong>
            <small>Success rate simulasi</small>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="mini-icon navy">
            <ListChecks size={17} />
          </span>
          <div>
            <strong>{stats.totalQuizzes}</strong>
            <small>Kuis diselesaikan</small>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="mini-icon orange">
            <CheckCircle2 size={17} />
          </span>
          <div>
            <strong>
              {pretestDone}/{learners.length}
            </strong>
            <small>Pretest selesai</small>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="mini-icon green">
            <Trophy size={17} />
          </span>
          <div>
            <strong>
              {posttestDone}/{learners.length}
            </strong>
            <small>Posttest selesai</small>
          </div>
        </div>
      </div>

      <div className="admin-progress-timeline panel">
        <div className="panel-head">
          <div>
            <span className="kicker">RINGKASAN KELAS</span>
            <h2>Average Level {avgLevel}</h2>
          </div>
          <div className="admin-search">
            <Search size={15} />
            <input onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / email…" value={q} />
          </div>
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>Pelajar</span>
            <span>Level / XP</span>
            <span>Streak</span>
            <span>Simulasi</span>
            <span>Pretest</span>
            <span>Posttest</span>
            <span />
          </div>
          {filtered.map((u) => (
            <div className="admin-table-row" key={u.id}>
              <span className="admin-user-cell">
                <strong>{u.name}</strong>
                <small>{u.email}</small>
              </span>
              <span>
                <strong>Lv {u.profile.level}</strong>
                <small>{formatNumber(u.profile.totalXp)} XP</small>
              </span>
              <span>
                <strong className="inline-icon">
                  <Flame size={14} /> {u.profile.streakDays}
                </strong>
                <small>hari</small>
              </span>
              <span>
                <strong>{u.simCount}</strong>
                <small>attempt</small>
              </span>
              <span>
                <span className={cn("status", u.profile.pretestDone ? "status-mastered" : "status-needs-practice")}>
                  {u.profile.pretestDone ? "Selesai" : "Belum"}
                </span>
              </span>
              <span>
                <span
                  className={cn(
                    "status",
                    u.profile.posttestDone ? ((u.profile.posttestScore ?? 0) >= 70 ? "status-mastered" : "status-developing") : "status-needs-practice"
                  )}
                >
                  {u.profile.posttestDone ? `${u.profile.posttestScore ?? 0}` : "Belum"}
                </span>
              </span>
              <span className="admin-actions">
                <Link className="panel-link" to={`/admin/users/${u.id}`}>
                  Detail <ArrowRight size={14} />
                </Link>
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="context-empty-state" style={{ marginTop: 14 }}>
              <XCircle size={16} /> Tidak ada pelajar yang cocok.
            </div>
          )}
        </div>
      </div>

      <section className="panel admin-progress-timeline">
        <div className="panel-head">
          <div>
            <span className="kicker">MASTERY PER SKILL</span>
            <h2>Rata-rata Kemampuan Kelas</h2>
          </div>
          <span className="mini-icon blue">
            <Brain size={17} />
          </span>
        </div>
        <div className="adaptive-skill-list">
          {stats.skillAverages.map((s) => {
            const pct = Math.round(s.avgMastery * 100);
            return (
              <div className="adaptive-skill-row" key={s.name}>
                <div className="skill-label">
                  <strong>{s.name}</strong>
                  <span className={cn("status", pct >= 75 ? "status-mastered" : pct >= 40 ? "status-developing" : "status-needs-practice")}>
                    {pct >= 75 ? "Mahir" : pct >= 40 ? "Berkembang" : "Pemula"}
                  </span>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <strong className="skill-score">{pct}%</strong>
              </div>
            );
          })}
        </div>
        <div className="context-empty-state">
          <TrendingUp size={16} /> {stats.totalSims} total attempt simulasi · {stats.totalQuizzes} kuis · rata-rata skor
          simulasi {stats.avgSimScore}.
        </div>
      </section>

      <p className="admin-foot-note">Terakhir diperbarui {formatDate(new Date().toISOString())} · data real-time dari API.</p>
    </div>
  );
}