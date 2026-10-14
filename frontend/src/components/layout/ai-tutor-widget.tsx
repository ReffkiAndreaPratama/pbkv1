import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, X, Send, Bot, MessageSquareText, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "tutor";
  text: string;
}

const SUGGESTIONS = [
  "Apa itu DHCP dan kenapa penting?",
  "Minta petunjuk untuk kasus ini",
  "Kenapa komputer tidak mau menyala padahal lampu nyala?",
  "Bagaimana cara memeriksa RAM?",
];

export function AITutorWidget({ onNavigating }: { onNavigating?: () => void }) {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<"chat" | "help">("chat");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "tutor",
      text: "Halo! Aku TechTutor AI, asisten belajarmu. Mau tanya konsep, minta petunjuk kasus, atau diskusi soal troubleshooting?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, screen]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await api.post<{ reply: string }>("/api/ai/chat", { message: text, contextPage: location.pathname });
      setMessages((m) => [...m, { role: "tutor", text: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "tutor", text: "Maaf, aku sedang kesulitan terhubung. Coba lagi ya." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={cn("tutor-fab", open && "is-open")} onClick={() => setOpen((o) => !o)} type="button">
        {open ? <X size={16} /> : <Sparkles size={16} />} {open ? "Tutup" : "TechTutor AI"}
      </button>

      {open && (
        <div className="tutor-widget-panel" role="dialog" aria-label="TechTutor AI">
          <div className="tutor-identity">
            <span>
              <Bot size={18} />
            </span>
            <div>
              <h2>TechTutor AI</h2>
              <p>Pendamping belajar kontekstual</p>
            </div>
            <i>● Online</i>
          </div>

          <div className="ai-tabs">
            <button className={screen === "chat" ? "active" : ""} onClick={() => setScreen("chat")} type="button">
              Percakapan
            </button>
            <button className={screen === "help" ? "active" : ""} onClick={() => setScreen("help")} type="button">
              Bantuan
            </button>
          </div>

          {screen === "chat" ? (
            <>
              <div className="tutor-scroll" ref={scrollRef}>
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div className="tutor-user-message" key={i}>
                      <div>{m.text}</div>
                    </div>
                  ) : (
                    <div className="tutor-response" key={i}>
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
                  <div className="tutor-typing">
                    <i />
                    <i />
                    <i /> TechTutor sedang berpikir…
                  </div>
                )}
              </div>
              <div className="tutor-composer">
                <div>
                  <input
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Tanya konsep / minta hint…"
                    value={input}
                  />
                  <button className="btn btn-primary" disabled={loading || !input.trim()} onClick={() => void send()} type="button">
                    <Send size={15} />
                  </button>
                </div>
                <small>Enter untuk kirim · AI tidak memberi jawaban langsung</small>
              </div>
            </>
          ) : (
            <div className="tutor-scroll">
              <div className="tutor-welcome">
                <span>
                  <MessageSquareText size={20} />
                </span>
                <h3>Contoh pertanyaan</h3>
                <p>Klik salah satu untuk langsung mengobrol.</p>
              </div>
              <div className="tutor-suggestions">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setScreen("chat");
                    }}
                    type="button"
                  >
                    <Sparkles size={14} /> {q} <ArrowRight size={13} />
                  </button>
                ))}
              </div>
              <div className="tutor-leading-note">
                <Sparkles size={14} />
                TechTutor AI tidak memberi jawaban langsung sebelum kamu mencoba dulu — itu cara belajar troubleshooting yang benar!
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}