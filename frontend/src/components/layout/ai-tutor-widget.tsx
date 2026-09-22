import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, X, Send, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "tutor";
  text: string;
}

export function AITutorWidget({ onNavigating }: { onNavigating?: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "tutor", text: "Halo! Aku TechTutor AI, asisten belajarmu. Mau tanya konsep, minta petunjuk kasus, atau diskusi soal troubleshooting? 🙂" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState("chat");
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
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="TechTutor AI"
        className={cn(
          "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-circuit text-white shadow-lift transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:right-6",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[560px] max-h-[75vh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lift animate-fade-in-up lg:bottom-24 lg:right-24">
          <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/10 to-circuit/10 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-circuit text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold leading-tight">TechTutor AI</div>
              <div className="text-[11px] text-emerald-600">● Online — siap membantu</div>
            </div>
            <button onClick={() => setScreen(screen === "chat" ? "help" : "chat")} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10">
              {screen === "chat" ? "Bantuan" : "Chat"}
            </button>
          </div>

          {screen === "chat" ? (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex max-w-[85%] flex-col", m.role === "user" ? "ml-auto items-end" : "items-start")}>
                    <div
                      className={cn(
                        "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        m.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-1 px-1 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-terminal-blink" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-terminal-blink" style={{ animationDelay: "0.2s" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-terminal-blink" style={{ animationDelay: "0.4s" }} />
                    TechTutor sedang berpikir…
                  </div>
                )}
              </div>
              <div className="border-t p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Tanya konsep / minta hint…"
                    className="max-h-24 min-h-[44px] resize-none"
                  />
                  <Button size="icon" onClick={() => void send()} disabled={loading || !input.trim()} aria-label="Kirim">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              <h4 className="font-display text-sm font-bold">Contoh pertanyaan</h4>
              {[
                "Apa itu DHCP dan kenapa penting?",
                "Minta petunjuk untuk kasus yang aku hadapi",
                "Kenapa komputer tidak mau menyala padahal lampu nyala?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    setScreen("chat");
                  }}
                  className="w-full rounded-xl border border-border/70 bg-card px-3 py-2 text-left text-sm text-foreground/85 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {q}
                </button>
              ))}
              <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                <strong>Tips:</strong> TechTutor AI tidak memberi jawaban langsung sebelum kamu mencoba dulu — itu cara belajar troubleshooting yang benar! 💪
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}