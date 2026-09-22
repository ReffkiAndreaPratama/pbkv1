import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { MonitorCog, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, bottomNav, accentColor } from "./nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { AITutorWidget } from "@/components/layout/ai-tutor-widget";

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-40 right-[-8%] h-[440px] w-[440px] rounded-full bg-primary/15 blur-3xl animate-blob" />
      <div
        className="absolute top-1/3 left-[-10%] h-[380px] w-[380px] rounded-full bg-circuit/15 blur-3xl animate-blob"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-[-12%] right-1/4 h-[400px] w-[400px] rounded-full bg-tech/10 blur-3xl animate-blob"
        style={{ animationDelay: "-12s" }}
      />
      <div className="absolute inset-0 bg-grid opacity-60" />
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [kursorLoader, setKursorLoader] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    setKursorLoader(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientBackground />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-card/85 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-cyan-600 to-circuit text-white shadow-glow">
            <MonitorCog className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-[15px] font-extrabold leading-tight">
              Tech<span className="text-gradient">Tutor</span>
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight">IT Troubleshooting Lab</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                          : "text-foreground/75 hover:bg-accent/70 hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all",
                            isActive ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-primary" : item.accent ? cn(accentColor[item.accent]?.split(" ")[0], "opacity-80") : "text-muted-foreground"
                          )}
                        />
                        {item.title}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          {isAdmin && (
            <div className="mb-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-2">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
                    isActive ? "bg-cyan-500/15 text-cyan-700" : "text-foreground/75 hover:bg-accent/70"
                  )
                }
              >
                <ShieldAdmin />
                Panel Admin
              </NavLink>
              <div className="mt-1 space-y-0.5">
                {([
                  { title: "Pengguna", path: "/admin/users" },
                  { title: "Kasus", path: "/admin/cases" },
                  { title: "Soal", path: "/admin/questions" },
                  { title: "Materi", path: "/admin/materials" },
                ] as const).map((it) => (
                  <NavLink
                    key={it.path}
                    to={it.path}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                        isActive ? "bg-cyan-500/10 text-cyan-700" : "text-muted-foreground hover:text-foreground"
                      )
                    }
                  >
                    {it.title}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-circuit/10 p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-circuit text-sm font-bold text-white shadow-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                Level {user?.profile?.level ?? 1} · {user?.profile?.totalXp ?? 0} XP
              </div>
            </div>
            <Button variant="ghost" size="iconSm" onClick={handleLogout} aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-cyan-600 to-circuit text-white shadow-glow">
          <MonitorCog className="h-4 w-4" />
        </div>
        <span className="font-display font-extrabold">
          Tech<span className="text-gradient">Tutor</span>
        </span>
      </header>

      {/* Content */}
      <main className="relative z-10 px-4 pb-24 pt-5 sm:px-6 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <AITutorWidget onNavigating={() => setKursorLoader(true)} />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ShieldAdmin() {
  return <Sparkles className="h-4 w-4 text-cyan-600" />;
}