import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpenText, Bot, CheckCircle2, Send, Sparkles, Target, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getJalur, jalurLabel } from "@/lib/learning-path";
import { PageLoader } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { SummaryData } from "@/lib/types";

interface ChatMsg {
  role: "user" | "tutor";
  text: string;
}

const SUGGESTIONS = [
  "Apa itu DHCP dan kenapa penting?",
  "Kenapa komputer tidak mau menyala padahal lampu nyala?",
  "Bagaimana cara memeriksa RAM yang bermasalah?",
  "Jelaskan aliran daya pada PSU",
];

export function AiTutorPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "tutor",
      text: "Halo! Aku TechTutor AI. Tanyakan konsep troubleshooting, minta petunjuk kasus, atau diskusi soal. Aku tidak akan memberi jawaban langsung sebelum kamu mencoba.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"chat" | "panduan">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<SummaryData>("/api/progress/summary").then(setSummary);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, tab]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string }>("/api/ai/chat", { message: msg, contextPage: location.pathname });
      setMessages((m) => [...m, { role: "tutor", text: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "tutor", text: "Maaf, aku sedang kesulitan terhubung. Coba lagi ya." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return <PageLoader />;

  const p = summary.profile;
  const weakest = [...summary.masteryBySkill].sort((a, b) => a.mastery - b.mastery)[0];

  return (
    <div className="ai-page">
      <div className="page-heading">
        <div>
          <span className="kicker">AI TUTOR</span>
          <h1>TechTutor AI</h1>
          <p>Pendamping belajar kontekstual — bertanya, minta petunjuk, atau diskusi konsep.</p>
        </div>
        <span className="date-chip">
          <Sparkles size={16} /> Anti-spoiler mode
        </span>
      </div>

      <div className="ai-layout">
        <section className="ai-panel">
          <div className="ai-head">
            <div className="ai-title">
              <span>
                <Bot size={18} />
              </span>
              <div>
                <h2>TechTutor AI</h2>
                <p>Router intent deterministik · siap membantu</p>
              </div>
            </div>
            <span className="ai-status">● Online</span>
          </div>

          <div className="ai-context">
            <span>KONTEKS BELAJAR</span>
            <div>
              Jalur <strong>{jalurLabel(getJalur())}</strong> <i /> Level <strong>{p.level}</strong> <i /> XP{" "}
              <strong>{p.totalXp}</strong>
              {weakest && (
                <>
                  {" "}
                  <i /> Fokus <strong>{weakest.code}</strong>
                </>
              )}
            </div>
          </div>

          <div className="ai-tabs">
            <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")} type="button">
              Percakapan
            </button>
            <button className={tab === "panduan" ? "active" : ""} onClick={() => setTab("panduan")} type="button">
              Panduan Bertanya
            </button>
          </div>

          {tab === "chat" ? (
            <>
              <div className="ai-scroll" ref={scrollRef}>
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div className="ai-user-message" key={i}>
                      <div>{m.text}</div>
                    </div>
                  ) : (
                    <div className="ai-message" key={i}>
                      <span>
                        <Sparkles size={14} />
                      </span>
                      <div>
                        <strong>TechTutor AI</strong>
                        <p>{m.text}</p>
                      </div>
                    </div>
                  )
                )}
                {loading && (
                  <div className="tutor-typing dark">
                    <i />
                    <i />
                    <i /> TechTutor sedang berpikir…
                  </div>
                )}
              </div>

              <div className="ai-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => void send(s)} type="button">
                    {s}
                  </button>
                ))}
              </div>

              <div className="ai-composer">
                <span>TANYA TECHTUTOR AI</span>
                <div>
                  <textarea
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Tulis pertanyaanmu…"
                    rows={1}
                    value={input}
                  />
                  <button disabled={loading || !input.trim()} onClick={() => void send()} type="button">
                    <Send size={15} />
                  </button>
                </div>
                <small>Enter untuk kirim · Shift+Enter untuk baris baru</small>
              </div>
            </>
          ) : (
            <div className="ai-scroll">
              <div className="tutor-welcome dark">
                <span>
                  <BookOpenText size={20} />
                </span>
                <h3>Cara bertanya yang efektif</h3>
                <p>TechTutor AI memandu proses berpikir, bukan memberi jawaban jadi.</p>
              </div>
              <div className="tutor-suggestions dark">
                {SUGGESTIONS.map((q) => (
                  <button key={q} onClick={() => { setTab("chat"); setInput(q); }} type="button">
                    <Sparkles size={14} /> {q}
                  </button>
                ))}
              </div>
              <div className="tutor-leading-note dark">
                <Sparkles size={14} /> AI tidak memberi jawaban langsung sebelum kamu mencoba dulu — itu cara belajar troubleshooting
                yang benar.
              </div>
            </div>
          )}
        </section>

        <aside className="ai-aside">
          <section className="panel competency-card">
            <span className="kicker">KONTEKS AKTIF</span>
            <h3>{user?.name}</h3>
            <div className="context-empty-state">
              <Target size={15} /> Halaman saat ini: <strong>{location.pathname}</strong>
            </div>
            <p>Aku tahu di halaman mana kamu berada sehingga jawabanku lebih relevan.</p>
          </section>

          <section className="panel competency-card">
            <span className="kicker">CAPAIANMU</span>
            <div className="summary-stat-list compact">
              <div>
                <span className="mini-icon blue">
                  <Trophy size={16} />
                </span>
                <div>
                  <strong>Level {p.level}</strong>
                  <small>{p.totalXp} XP</small>
                </div>
              </div>
              <div>
                <span className="mini-icon green">
                  <CheckCircle2 size={16} />
                </span>
                <div>
                  <strong>{summary.successCases} kasus</strong>
                  <small>berhasil diselesaikan</small>
                </div>
              </div>
            </div>
          </section>

          <section className="panel competency-card">
            <span className="kicker">BATASAN AI</span>
            <ul className="ai-limit-list">
              <li>Tidak membocorkan jawaban simulasi.</li>
              <li>Tidak mengerjakan kuis untukmu.</li>
              <li>Menjelaskan konsep dengan bahasa sederhana.</li>
              <li>Mengarahkan ke materi &amp; skill terkait.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}