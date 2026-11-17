import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpenText,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Lock,
  LogOut,
  MonitorCog,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getJalur, setJalur, type Jalur } from "@/lib/learning-path";
import { PageLoader } from "@/components/ui/feedback";
import { cn, formatDate, formatNumber, tierLabel, quizTypeLabel, difficultyLabel } from "@/lib/utils";
import type { Achievement, SimHistoryRow, SummaryData, QuizSessionRow } from "@/lib/types";

type Tab = "profil" | "kemampuan" | "riwayat" | "pengaturan";

const TIER_CHIP: Record<string, string> = {
  NOVICE: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  DEVELOPING: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  PROFICIENT: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
};

const TIER_BAR: Record<string, string> = {
  NOVICE: "from-rose-400 to-rose-500",
  DEVELOPING: "from-amber-400 to-orange-400",
  PROFICIENT: "from-emerald-400 to-teal-400",
};

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
        setQuizzes(s.recentQuizzes ?? []);
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

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "profil", label: "Profil", icon: UserRound },
    { id: "kemampuan", label: "Kemampuan", icon: Target },
    { id: "riwayat", label: "Riwayat", icon: ListChecks },
    { id: "pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      {/* --------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1628] text-white shadow-lift">
        <div className="lab-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-16 top-6 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden />

        <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:p-9">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <UserRound className="h-3 w-3 text-emerald-300" /> Profil teknisi
            </div>

            <div className="mt-5 flex items-center gap-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 font-display text-xl font-extrabold text-slate-950 shadow-lg">
                {initials}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg border border-[#0b1628] bg-[#0b1628] text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                </span>
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-extrabold leading-tight tracking-tight">{user?.name}</h1>
                <p className="truncate text-[12px] text-slate-400">{user?.email}</p>
                <p className="mt-1 font-mono-tech text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  terdaftar {user?.createdAt ? formatDate(user.createdAt) : "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <HeroChip icon={Trophy} label={`Level ${p.level}`} tone="amber" />
              <HeroChip icon={Zap} label={`${formatNumber(p.totalXp)} XP`} tone="emerald" />
              <HeroChip icon={Flame} label={`${p.streakDays} hari streak`} tone="rose" />
              <HeroChip icon={Wrench} label={`Jalur ${jalur}`} tone="sky" />
            </div>
          </div>

          {/* completion terminal */}
          <div className="relative self-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-400">profil.status</span>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono-tech text-[9px] font-bold text-emerald-300">
                  {completion}%
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <CompletionDial value={completion} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  {[
                    { label: "Pretest", done: p.pretestDone },
                    { label: "Gaya belajar", done: !!p.learningStyle },
                    { label: "Simulasi", done: history.length > 0 },
                    { label: "Posttest", done: p.posttestDone },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-400">{c.label}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono-tech text-[9px] font-bold",
                          c.done ? "text-emerald-300" : "text-slate-500"
                        )}
                      >
                        {c.done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {c.done ? "OK" : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 font-mono-tech text-[10px] text-slate-500">
                <span className="text-emerald-300">$</span> lengkapi profil untuk rekomendasi akurat
                <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-emerald-300 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Zap} label="Total XP" value={formatNumber(p.totalXp)} tone="emerald" />
        <StatCard icon={Flame} label="Streak" value={`${p.streakDays} hari`} tone="rose" />
        <StatCard icon={Award} label="Pencapaian" value={`${unlocked}/${achievements.length || 0}`} tone="amber" />
        <StatCard icon={BookOpenText} label="Materi dibaca" value={String(summary.materialReads ?? 0)} tone="sky" />
        <StatCard icon={MonitorCog} label="Simulasi" value={String(history.length)} tone="violet" />
        <StatCard icon={Target} label="Rata mastery" value={`${Math.round((summary.avgMastery ?? 0) * 100)}%`} tone="emerald" />
      </div>

      {/* --------------------------------------------------------------- tabs + content */}
      <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border/70 bg-card p-2 shadow-soft lg:sticky lg:top-4">
          <div className="hidden px-2.5 pb-2 pt-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:block">
            Menu profil
          </div>
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[11.5px] font-semibold transition-colors",
                  tab === t.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <t.icon className={cn("h-4 w-4", tab === t.id && "text-emerald-300")} />
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={logout}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[11.5px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 lg:mt-1 lg:border-t lg:border-border/60 lg:pt-3"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          {tab === "profil" && (
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
              <PanelHead icon={UserRound} title="Data diri" kicker="Informasi akun" aside="PROFIL" />
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nama lengkap" icon={UserRound}>
                    <input
                      className="h-9 w-full rounded-lg border border-border/70 bg-background pl-8 pr-3 text-[12px] font-medium focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      onChange={(e) => setName(e.target.value)}
                      value={name}
                    />
                  </Field>
                  <Field label="Email" icon={Lock}>
                    <input
                      className="h-9 w-full rounded-lg border border-border/60 bg-muted/40 pl-8 pr-3 text-[12px] font-medium text-muted-foreground"
                      disabled
                      value={user?.email ?? ""}
                    />
                  </Field>
                  <Field label="Level" icon={Trophy}>
                    <input
                      className="h-9 w-full rounded-lg border border-border/60 bg-muted/40 pl-8 pr-3 text-[12px] font-medium text-muted-foreground"
                      disabled
                      value={`Level ${p.level} · ${formatNumber(p.totalXp)} XP`}
                    />
                  </Field>
                  <Field label="Streak" icon={Flame}>
                    <input
                      className="h-9 w-full rounded-lg border border-border/60 bg-muted/40 pl-8 pr-3 text-[12px] font-medium text-muted-foreground"
                      disabled
                      value={`${p.streakDays} hari`}
                    />
                  </Field>
                </div>

                <div className="mt-4 flex flex-col gap-2.5 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10.5px] leading-relaxed text-muted-foreground">
                    Ubah nama hanya memengaruhi tampilan akunmu.
                  </span>
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving || name.trim().length < 3}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-[11.5px] font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> {saving ? "Menyimpan…" : "Simpan perubahan"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "kemampuan" && (
            <div className="space-y-4">
              <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                <PanelHead icon={Target} title="Penguasaan per kategori" kicker="Peta skill" aside={`${summary.masteryBySkill.length} SKILL`} />
                <div className="divide-y divide-border/60">
                  {summary.masteryBySkill.length === 0 && (
                    <p className="px-5 py-8 text-center text-[11.5px] text-muted-foreground">Belum ada data penguasaan skill.</p>
                  )}
                  {summary.masteryBySkill.map((m) => {
                    const pct = Math.round(m.mastery * 100);
                    return (
                      <div key={m.code} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-mono-tech text-[9px] font-bold text-emerald-300">
                          {m.code.slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-[11.5px] font-bold">{m.name}</div>
                              <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">{m.code}</div>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-bold ring-1",
                                TIER_CHIP[m.tier] ?? "bg-muted text-muted-foreground ring-border"
                              )}
                            >
                              {tierLabel(m.tier)}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r", TIER_BAR[m.tier] ?? "from-slate-400 to-slate-500")}
                                style={{ width: `${Math.max(2, pct)}%` }}
                              />
                            </div>
                            <span className="w-8 shrink-0 text-right font-mono-tech text-[9.5px] font-bold text-slate-700">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <QuizCard
                  kicker="Pretest"
                  title={p.pretestDone ? "Sudah dikerjakan" : "Belum dikerjakan"}
                  desc="Ukur titik awal kemampuanmu."
                  to="/quiz/pretest"
                  done={p.pretestDone}
                />
                <QuizCard
                  kicker="Ujian Akhir"
                  title={p.posttestDone ? `Skor ${Math.round(p.posttestScore ?? 0)}/100` : "Belum dikerjakan"}
                  desc="Ujian formal: 20 menit, tanpa hint, KKM 70."
                  to="/exam"
                  done={p.posttestDone}
                />
              </div>
            </div>
          )}

          {tab === "riwayat" && (
            <div className="space-y-4">
              <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                <PanelHead icon={Award} title="Pencapaian" kicker="Achievement" aside={`${unlocked}/${achievements.length} TERBUKA`} />
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  {achievements.length === 0 && (
                    <p className="col-span-full py-6 text-center text-[11.5px] text-muted-foreground">Belum ada pencapaian.</p>
                  )}
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border p-3",
                        a.unlocked ? "border-emerald-200/70 bg-emerald-50/50" : "border-border/60 bg-muted/20 opacity-80"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                          a.unlocked ? "bg-emerald-100 text-emerald-700 ring-emerald-200" : "bg-muted text-muted-foreground ring-border/60"
                        )}
                      >
                        {a.unlocked ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="truncate text-[11.5px] font-bold">{a.name}</strong>
                          <span className="shrink-0 font-mono-tech text-[9px] font-bold text-amber-600">+{a.xpReward} XP</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{a.description}</p>
                        {a.unlocked && a.unlockedAt && (
                          <div className="mt-1 font-mono-tech text-[8.5px] uppercase tracking-[0.1em] text-emerald-700">
                            {formatDate(a.unlockedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                <PanelHead icon={MonitorCog} title="Riwayat simulasi" kicker="Bengkel" aside={`${history.length} SESI`} />
                {history.length === 0 ? (
                  <EmptyRow text="Belum ada simulasi yang dikerjakan." />
                ) : (
                  <div className="divide-y divide-border/60">
                    {history.slice(0, 10).map((h) => (
                      <div key={h.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-slate-600">
                          <Wrench className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11.5px] font-bold">{h.caseTitle}</div>
                          <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
                            {h.skill.code} · {difficultyLabel(h.difficulty)} · {h.timeSec}s
                          </div>
                        </div>
                        <StatusPill
                          tone={h.status === "IN_PROGRESS" ? "sky" : h.success ? "emerald" : "rose"}
                          label={h.status === "IN_PROGRESS" ? "Berjalan" : h.success ? "Berhasil" : "Gagal"}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                <PanelHead icon={ListChecks} title="Riwayat kuis" kicker="Latihan" aside={`${quizzes.length} SESI`} />
                {quizzes.length === 0 ? (
                  <EmptyRow text="Belum ada kuis." />
                ) : (
                  <div className="divide-y divide-border/60">
                    {quizzes.map((q) => (
                      <div key={q.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-slate-600">
                          <ListChecks className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11.5px] font-bold">{quizTypeLabel(q.type)}</div>
                          <div className="font-mono-tech text-[8.5px] uppercase tracking-[0.1em] text-muted-foreground">
                            {q.correctCount}/{q.totalCount} benar · {Math.round(q.score ?? 0)}/100
                          </div>
                        </div>
                        <StatusPill tone={(q.score ?? 0) >= 70 ? "emerald" : "amber"} label={(q.score ?? 0) >= 70 ? "Lulus" : "Remedial"} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "pengaturan" && (
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
              <PanelHead icon={Settings} title="Pengaturan belajar" kicker="Preferensi" aside="LOKAL" />
              <div className="divide-y divide-border/60">
                <SettingRow
                  icon={MonitorCog}
                  title="Jalur pembelajaran"
                  desc="Tentukan perangkat yang sedang kamu fokuskan."
                  action={
                    <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5">
                      {(["PC", "Laptop"] as Jalur[]).map((j) => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => changeJalur(j)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-[10.5px] font-bold transition-colors",
                            jalur === j ? "bg-slate-900 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {j}
                        </button>
                      ))}
                    </div>
                  }
                />
                <SettingRow
                  icon={Sparkles}
                  title="Onboarding & minat"
                  desc="Perbarui gaya belajar, target level, dan durasi sesi."
                  action={<NavButton onClick={() => navigate("/onboarding")} label="Ubah jawaban" />}
                />
                <SettingRow
                  icon={Target}
                  title="Pilih ulang jalur"
                  desc={`Saat ini: ${jalur === "PC" ? "Troubleshooting PC" : "Troubleshooting Laptop"}`}
                  action={<NavButton onClick={() => navigate("/path")} label="Buka halaman jalur" />}
                />
                <SettingRow
                  icon={BookOpenText}
                  title="Ringkasan belajar"
                  desc={`Pretest ${p.pretestDone ? "selesai" : "belum"} · Posttest ${p.posttestDone ? "selesai" : "belum"} · ${summary.materialReads ?? 0} materi dibaca`}
                  action={<NavButton onClick={() => navigate("/evaluation")} label="Lihat evaluasi" />}
                />
                <SettingRow
                  icon={LogOut}
                  title="Keluar dari akun"
                  desc="Sesi belajarmu tetap tersimpan di server."
                  danger
                  action={
                    <button
                      type="button"
                      onClick={logout}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10.5px] font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Keluar
                    </button>
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 bg-muted/20 px-4 py-2.5 font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> progres aman di server
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> jalur bisa diganti kapan saja
                </span>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

function HeroChip({ icon: Icon, label, tone }: { icon: LucideIcon; label: string; tone: "amber" | "emerald" | "rose" | "sky" }) {
  const tones = {
    amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    rose: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    sky: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.12em]", tones[tone])}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: "emerald" | "rose" | "amber" | "sky" | "violet" }) {
  const tones = {
    emerald: "text-emerald-600 bg-emerald-50 ring-emerald-100",
    rose: "text-rose-600 bg-rose-50 ring-rose-100",
    amber: "text-amber-600 bg-amber-50 ring-amber-100",
    sky: "text-sky-600 bg-sky-50 ring-sky-100",
    violet: "text-violet-600 bg-violet-50 ring-violet-100",
  };
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg ring-1", tones[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 font-display text-lg font-extrabold leading-none tracking-tight">{value}</div>
      <div className="mt-1 font-mono-tech text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
    </div>
  );
}

function CompletionDial({ value }: { value: number }) {
  const size = 84;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#profileDial)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - safe / 100)}
        />
        <defs>
          <linearGradient id="profileDial" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-extrabold leading-none text-white">{safe}%</span>
        <span className="mt-0.5 font-mono-tech text-[7px] uppercase tracking-[0.16em] text-slate-500">lengkap</span>
      </div>
    </div>
  );
}

function PanelHead({ icon: Icon, title, kicker, aside }: { icon: LucideIcon; title: string; kicker: string; aside: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-4 py-2.5">
      <span className="inline-flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {kicker}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-700">{title}</span>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono-tech text-[8px] font-bold text-emerald-300">{aside}</span>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono-tech text-[8.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </span>
    </label>
  );
}

function StatusPill({ tone, label }: { tone: "emerald" | "rose" | "sky" | "amber"; label: string }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-bold ring-1", tones[tone])}>{label}</span>;
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
      <ListChecks className="h-5 w-5 text-muted-foreground/60" />
      <p className="text-[11px] text-muted-foreground">{text}</p>
    </div>
  );
}

function QuizCard({ kicker, title, desc, to, done }: { kicker: string; title: string; desc: string; to: string; done: boolean }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="font-mono-tech text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{kicker}</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[8.5px] font-bold ring-1",
            done ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"
          )}
        >
          {done ? "Selesai" : "Belum"}
        </span>
      </div>
      <h3 className="mt-1.5 font-display text-base font-extrabold leading-tight">{title}</h3>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{desc}</p>
      <Link to={to} className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-bold text-primary hover:underline">
        Buka {kicker.toLowerCase()} <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  action,
  danger,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  action: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
            danger ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-muted text-slate-600 ring-border/60"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-[11.5px] font-bold">{title}</div>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="shrink-0 pl-10 sm:pl-0">{action}</div>
    </div>
  );
}

function NavButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-3 text-[10.5px] font-bold text-slate-700 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      {label} <ArrowRight className="h-3 w-3" />
    </button>
  );
}
