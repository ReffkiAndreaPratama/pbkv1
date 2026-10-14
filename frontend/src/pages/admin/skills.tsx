import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, Database, Layers, ListChecks, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

interface SkillAggregate {
  id: string;
  code: string;
  name: string;
  caseCount: number;
  questionCount: number;
  materialCount: number;
}

interface CaseRow {
  id: string;
  title: string;
  skill: { id: string; code: string; name: string };
  difficulty: string;
  attemptCount?: number;
}
interface QuestionRow {
  id: string;
  skill: { id: string; code: string; name: string };
}
interface MaterialRow {
  id: string;
  title: string;
  isActive: boolean;
  skill: { id: string; code: string; name: string };
}

export function AdminSkillsPage() {
  const [skills, setSkills] = useState<SkillAggregate[] | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<CaseRow[]>("/api/admin/cases"),
      api.get<QuestionRow[]>("/api/admin/questions"),
      api.get<MaterialRow[]>("/api/admin/materials"),
    ]).then(([cases, questions, materials]) => {
      const map = new Map<string, SkillAggregate>();
      const ensure = (s: { id: string; code: string; name: string }) => {
        let entry = map.get(s.id);
        if (!entry) {
          entry = { id: s.id, code: s.code, name: s.name, caseCount: 0, questionCount: 0, materialCount: 0 };
          map.set(s.id, entry);
        }
        return entry;
      };
      cases.forEach((c) => (ensure(c.skill).caseCount += 1));
      questions.forEach((q) => (ensure(q.skill).questionCount += 1));
      materials.forEach((m) => (ensure(m.skill).materialCount += 1));
      setSkills([...map.values()].sort((a, b) => a.code.localeCompare(b.code)));
    });
  }, []);

  if (!skills) return <PageLoader />;

  const totals = skills.reduce(
    (acc, s) => ({
      cases: acc.cases + s.caseCount,
      questions: acc.questions + s.questionCount,
      materials: acc.materials + s.materialCount,
    }),
    { cases: 0, questions: 0, materials: 0 }
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="kicker">KATEGORI SKILL</span>
          <h1>Kategori Skill</h1>
          <p>Ringkasan konten per kategori: kasus, soal kuis, dan materi.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="btn btn-secondary" to="/admin/questions">
            <ListChecks size={17} /> Kelola Soal
          </Link>
          <Link className="btn btn-primary" to="/admin/cases">
            <Wrench size={17} /> Kelola Kasus
          </Link>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <span className="mini-icon blue">
            <Layers size={17} />
          </span>
          <div>
            <strong>{skills.length}</strong>
            <small>Kategori skill</small>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="mini-icon navy">
            <Wrench size={17} />
          </span>
          <div>
            <strong>{totals.cases}</strong>
            <small>Kasus simulasi</small>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="mini-icon orange">
            <ListChecks size={17} />
          </span>
          <div>
            <strong>{totals.questions}</strong>
            <small>Soal kuis</small>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="mini-icon green">
            <BookOpenText size={17} />
          </span>
          <div>
            <strong>{totals.materials}</strong>
            <small>Materi</small>
          </div>
        </div>
      </div>

      <div className="admin-skill-grid">
        {skills.map((s) => (
          <article className="panel admin-skill-card" key={s.id}>
            <div className="admin-skill-head">
              <span className="admin-skill-code">{s.code}</span>
              <span className={cn("status", s.caseCount > 0 ? "status-mastered" : "status-needs-practice")}>
                {s.caseCount > 0 ? "Aktif" : "Kosong"}
              </span>
            </div>
            <h3>{s.name}</h3>
            <div className="admin-skill-counts">
              <div>
                <strong>{s.caseCount}</strong>
                <small>
                  <Wrench size={13} /> Kasus
                </small>
              </div>
              <div>
                <strong>{s.questionCount}</strong>
                <small>
                  <ListChecks size={13} /> Soal
                </small>
              </div>
              <div>
                <strong>{s.materialCount}</strong>
                <small>
                  <BookOpenText size={13} /> Materi
                </small>
              </div>
            </div>
            <div className="admin-skill-links">
              <Link className="panel-link" to="/admin/cases">
                Kasus <ArrowRight size={14} />
              </Link>
              <Link className="panel-link" to="/admin/questions">
                Soal <ArrowRight size={14} />
              </Link>
              <Link className="panel-link" to="/admin/materials">
                Materi <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="context-empty-state">
        <Database size={16} /> Data diambil dari endpoint admin cases, questions, dan materials. Untuk menambah skill baru,
        gunakan seed Prisma.
      </div>
    </div>
  );
}