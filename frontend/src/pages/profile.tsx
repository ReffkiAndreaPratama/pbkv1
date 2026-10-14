import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpenText,
  Check,
  Clock,
  Flame,
  ListChecks,
  Lock,
  LogOut,
  MonitorCog,
  Settings,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getJalur, setJalur, type Jalur } from "@/lib/learning-path";
import { PageLoader } from "@/components/ui/feedback";
import { cn, formatDate, formatNumber, tierLabel, tierStatusClass, quizTypeLabel } from "@/lib/utils";
import type { Achievement, SimHistoryRow, SummaryData, QuizSessionRow } from "@/lib/types";

type Tab = "profil" | "kemampuan" | "riwayat" | "pengaturan";

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profil");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<SimHistoryRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name ?? "");
  const [jalur, setJalurState] = useState<Jalur>(getJalur());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<SummaryData>("/api/progress/summary"),
      api.get<Achievement[]>("/api/progress/achievements"),
      api.get<SimHistoryRow[]>("/api/cases/history"),
    ])
      .then(([s, a, h]) => {
        setSummary(s);
        setAchievements(a);
        setHistory(h);
        setQuizzes(s.recentQuizzes);
        setName(user?.name ?? "");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !summary) return <PageLoader />;

  const p = summary.profile;
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const completionParts = [p.pretestDone, !!p.learningStyle, history.length > 0, p.posttestDone];
  const completion = Math.round((completionParts.filter(Boolean).length / completionParts.length) * 100);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put("/api/profile", { name: name.trim() });
      if (user) setUser({ ...user, name: name.trim() });
      toast.success("Profil diperbarui.");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const changeJalur = (j: Jalur) => {
    setJalur(j);
    setJalurState(j);
    toast.success(`Jalur diubah ke ${j === "PC" ? "Troubleshooting PC" : "Troubleshooting Laptop"}.`);
    window.dispatchEvent(new Event("techtutor:jalur-change"));
  };

  const tabs: { id: Tab; label: string; icon: typeof UserRound }[] = [
    { id: "profil", label: "Profil Saya", icon: UserRound },
    { id: "kemampuan", label: "Kemampuan", icon: Target },
    { id: "riwayat", label: "Riwayat", icon: ListChecks },
    { id: "pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <span className="kicker">PROFIL</span>
          <h1>Profil Pembelajar</h1>
          <p>Kelola identitas, jalur belajar, dan riwayat aktivitasmu.</p>
        </div>
      </div>

      <section className="panel profile-summary">
        <span className="profile-avatar">{initials}</span>
        <div className="profile-identity">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <small>Terdaftar {user?.createdAt ? formatDate(user.createdAt) : "—"}</small>
        </div>
        <div className="profile-path">
          <span className="kicker">JALUR AKTIF</span>
          <strong>Troubleshooting {jalur}</strong>
        </div>
        <div className="profile-completion">
          <span className="kicker">KELENGKAPAN PROFIL</span>
          <div className="inline-progress">
            <div className="progress-track">
              <span style={{ width: `${completion}%` }} />
            </div>
            <strong>{completion}%</strong>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <aside className="panel profile-tabs">
          {tabs.map((t) => (
            <button className={cn("profile-tab", tab === t.id && "active")} key={t.id} onClick={() => setTab(t.id)} type="button">
              <t.icon size={17} />
              {t.label}
            </button>
          ))}
          <button className="profile-tab danger" onClick={logout} type="button">
            <LogOut size={17} /> Keluar
          </button>
        </aside>

        <div className="profile-content">
          {tab === "profil" && (
            <section className="panel profile-form">
              <div className="profile-form-head">
                <span className="kicker">INFORMASI AKUN</span>
                <h2>Data Diri</h2>
              </div>
              <div className="form-grid">
                <label>
                  Nama Lengkap
                  <div className="input-wrap">
                    <UserRound size={17} />
                    <input onChange={(e) => setName(e.target.value)} value={name} />
                  </div>
                </label>
                <label>
                  Email
                  <div className="input-wrap">
                    <Lock size={17} />
                    <input disabled value={user?.email ?? ""} />
                  </div>
                </label>
                <label>
                  Level
                  <div className="input-wrap">
                    <Trophy size={17} />
                    <input disabled value={`Level ${p.level} · ${formatNumber(p.totalXp)} XP`} />
                  </div>
                </label>
                <label>
                  Streak
                  <div className="input-wrap">
                    <Flame size={17} />
                    <input disabled value={`${p.streakDays} hari`} />
                  </div>
                </label>
              </div>
              <div className="profile-form-actions">
                <span className="form-hint">Ubah nama hanya memengaruhi tampilan akunmu.</span>
                <button className="btn btn-primary" disabled={saving || name.trim().length < 3} onClick={saveProfile} type="button">
                  {saving ? "Menyimpan…" : "Simpan Perubahan"}
                </button>
              </div>
            </section>
          )}

          {tab === "kemampuan" && (
            <section className="panel profile-skill-summary">
              <div className="profile-form-head">
                <span className="kicker">PUASAAN SKILL</span>
                <h2>Penguasaan per Kategori</h2>
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
              <div className="post-rec-grid">
                <div className="panel competency-card">
                  <span className="kicker">PRETEST</span>
                  <h3>{p.pretestDone ? "Sudah dikerjakan" : "Belum dikerjakan"}</h3>
                  <Link className="panel-link" to="/quiz/pretest">
                    Buka pretest <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="panel competency-card">
                  <span className="kicker">POSTTEST</span>
                  <h3>{p.posttestDone ? `Skor ${p.posttestScore ?? 0}/100` : "Belum dikerjakan"}</h3>
                  <Link className="panel-link" to="/quiz/posttest">
                    Buka posttest <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {tab === "riwayat" && (
            <div className="profile-riwayat">
              <section className="panel profile-skill-summary">
                <div className="profile-form-head">
                  <span className="kicker">ACHIEVEMENT</span>
                  <h2>
                    {unlocked}/{achievements.length} Terbuka
                  </h2>
                </div>
                <div className="achievement-grid">
                  {achievements.map((a) => (
                    <div className={cn("achievement-card", a.unlocked && "unlocked")} key={a.id}>
                      <span className="achievement-icon">{a.unlocked ? <Award size={19} /> : <Lock size={19} />}</span>
                      <div>
                        <strong>{a.name}</strong>
                        <p>{a.description}</p>
                        <small>+{a.xpReward} XP</small>
                      </div>
                      {a.unlocked && a.unlockedAt && <em>{formatDate(a.unlockedAt)}</em>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel profile-skill-summary">
                <div className="profile-form-head">
                  <span className="kicker">SIMULASI</span>
                  <h2>Riwayat Simulasi</h2>
                </div>
                {history.length === 0 ? (
                  <p className="competency-note">Belum ada simulasi yang dikerjakan.</p>
                ) : (
                  <div className="quiz-history">
                    {history.slice(0, 10).map((h) => (
                      <div className="quiz-history-row" key={h.id}>
                        <span className="quiz-type-icon">
                          <MonitorCog size={17} />
                        </span>
                        <div className="quiz-meta">
                          <strong>{h.caseTitle}</strong>
                          <small>
                            {h.skill.code} · {h.difficulty} · {h.timeSec}s
                          </small>
                        </div>
                        <span className={cn("status", h.success ? "status-mastered" : h.status === "IN_PROGRESS" ? "status-in-progress" : "status-needs-practice")}>
                          {h.status === "IN_PROGRESS" ? "Berjalan" : h.success ? "Berhasil" : "Gagal"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel profile-skill-summary">
                <div className="profile-form-head">
                  <span className="kicker">KUIS</span>
                  <h2>Riwayat Kuis</h2>
                </div>
                <div className="quiz-history">
                  {quizzes.length === 0 ? (
                    <p className="competency-note">Belum ada kuis.</p>
                  ) : (
                    quizzes.map((q) => (
                      <div className="quiz-history-row" key={q.id}>
                        <span className="quiz-type-icon">
                          <ListChecks size={17} />
                        </span>
                        <div className="quiz-meta">
                          <strong>{quizTypeLabel(q.type)}</strong>
                          <small>
                            {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
                          </small>
                        </div>
                        <span className={cn("status", (q.score ?? 0) >= 70 ? "status-mastered" : "status-needs-practice")}>
                          {(q.score ?? 0) >= 70 ? "Lulus" : "Remedial"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "pengaturan" && (
            <section className="panel profile-form">
              <div className="profile-form-head">
                <span className="kicker">PREFERENSI</span>
                <h2> Pengaturan Belajar</h2>
              </div>

              <div className="settings-block">
                <div>
                  <strong>Jalur Pembelajaran</strong>
                  <p>Tentukan perangkat yang sedang kamu fokuskan.</p>
                </div>
                <div className="segmented">
                  <button className={cn(jalur === "PC" && "active")} onClick={() => changeJalur("PC")} type="button">
                    PC
                  </button>
                  <button className={cn(jalur === "Laptop" && "active")} onClick={() => changeJalur("Laptop")} type="button">
                    Laptop
                  </button>
                </div>
              </div>

              <div className="settings-block">
                <div>
                  <strong>Onboarding &amp; Minat</strong>
                  <p>Perbarui gaya belajar, target level, dan durasi sesi.</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("/onboarding")} type="button">
                  Ubah Jawaban <ArrowRight size={17} />
                </button>
              </div>

              <div className="settings-block">
                <div>
                  <strong>Pilih Ulang Jalur</strong>
                  <p>Saat ini: {jalur === "PC" ? "Troubleshooting PC" : "Troubleshooting Laptop"}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate("/path")} type="button">
                  Lihat Halaman Pilihan <ArrowRight size={17} />
                </button>
              </div>

              <div className="settings-block danger">
                <div>
                  <strong>Keluar dari Akun</strong>
                  <p>Sesi belajarmu tetap tersimpan di server.</p>
                </div>
                <button className="btn btn-secondary" onClick={logout} type="button">
                  <LogOut size={17} /> Keluar
                </button>
              </div>

              <div className="settings-block">
                <div>
                  <strong>Ringkasan</strong>
                  <p>
                    {p.pretestDone ? <Check size={14} /> : <Clock size={14} />} Pretest ·{" "}
                    {p.posttestDone ? <Check size={14} /> : <Clock size={14} />} Posttest ·{" "}
                    <BookOpenText size={14} /> {summary.materialReads} materi
                  </p>
                </div>
                <Link className="btn btn-soft" to="/evaluation">
                  Lihat Evaluasi
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}