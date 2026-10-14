import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight, LayoutDashboard, LogOut, Menu, X, UserRound, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavItems, navItems } from "./nav";
import { Logo } from "./logo";
import { useAuth } from "@/lib/auth";
import { useJalur, jalurLabel } from "@/lib/learning-path";
import { AITutorWidget } from "@/components/layout/ai-tutor-widget";
import { InstallBanner } from "@/components/layout/install-banner";

const ROUTE_TITLES: { match: RegExp; title: string }[] = [
  { match: /^\/dashboard$/, title: "Dashboard" },
  { match: /^\/practice$/, title: "Latihan" },
  { match: /^\/evaluation$/, title: "Evaluasi" },
  { match: /^\/profile$/, title: "Profil Saya" },
  { match: /^\/adaptive$/, title: "Kuis Adaptif" },
  { match: /^\/ai$/, title: "AI Tutor" },
  { match: /^\/cases$/, title: "Simulasi Kasus" },
  { match: /^\/cases\/.+/, title: "Detail Kasus" },
  { match: /^\/simulation\/.+/, title: "Simulasi" },
  { match: /^\/materials$/, title: "Materi Pembelajaran" },
  { match: /^\/materials\/.+/, title: "Detail Materi" },
  { match: /^\/quiz\//, title: "Kuis" },
  { match: /^\/progress$/, title: "Progres Belajar" },
  { match: /^\/achievements$/, title: "Pencapaian" },
  { match: /^\/leaderboard$/, title: "Papan Peringkat" },
  { match: /^\/admin/, title: "Panel Admin" },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { jalur } = useJalur();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
  setMobileOpen(false);
}, [location.pathname]);

  useEffect(() => {
    const match = ROUTE_TITLES.find((r) => r.match.test(location.pathname));
    document.title = match ? `${match.title} · TechTutor` : "TechTutor — Adaptive IT Troubleshooting Lab";
  }, [location.pathname]);

  const pathProgress = Math.min(100, Math.round(((user?.profile?.level ?? 1) / 10) * 100));
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => cn("nav-item", isActive && "active");

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", mobileOpen && "sidebar-open")}>
        <div className="sidebar-top">
          <Logo inverse onClick={() => navigate("/")} />
          <button className="mobile-close" onClick={() => setMobileOpen(false)} type="button" aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav" aria-label="Navigasi utama">
          <span className="nav-label">MENU UTAMA</span>
          {navItems.map((item) => (
            <NavLink className={linkClass} end={item.end} key={item.path} to={item.path}>
              <item.icon size={19} />
              <span>{item.title}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <span className="nav-label mt-6">ADMIN</span>
              {adminNavItems.map((item) => (
                <NavLink className={linkClass} end={item.end} key={item.path} to={item.path}>
                  <item.icon size={19} />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-progress">
          <div className="mini-progress-head">
            <span>Progress jalur</span>
            <strong>{pathProgress}%</strong>
          </div>
          <div className="progress-track dark">
            <span style={{ width: `${pathProgress}%` }} />
          </div>
          <p>
            {jalurLabel(jalur)} · Level {user?.profile?.level ?? 1} · {user?.profile?.totalXp ?? 0} XP
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)} type="button" aria-label="Buka menu">
            <Menu size={20} />
          </button>
          <div className="topbar-copy">
            <span>Jalur aktif</span>
            <strong>{jalurLabel(jalur)}</strong>
          </div>
          <div className="profile-wrap">
            <button className="profile-button" onClick={() => setProfileOpen((v) => !v)} type="button">
              <span className="avatar">{initials}</span>
              <span className="profile-name">
                <strong>{user?.name}</strong>
                <small>{isAdmin ? "Administrator" : "Pelajar"}</small>
              </span>
              <ChevronRight size={16} />
            </button>
            {profileOpen && (
              <div className="profile-popover">
                <div>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <button onClick={() => { setProfileOpen(false); navigate("/profile"); }} type="button">
                  <UserRound size={17} /> Profil Saya
                </button>
                <button onClick={() => { setProfileOpen(false); navigate("/progress"); }} type="button">
                  <Activity size={17} /> Progres Belajar
                </button>
                {isAdmin && (
                  <button onClick={() => { setProfileOpen(false); navigate("/admin"); }} type="button">
                    <LayoutDashboard size={17} /> Panel Admin
                  </button>
                )}
                <button onClick={handleLogout} type="button">
                  <LogOut size={17} /> Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        {!online && (
          <div className="network-error-banner" role="alert">
            <X size={18} />
            <div>
              <strong>Koneksi jaringan terputus.</strong>
              <span>Beberapa konten mungkin tidak dapat dimuat atau disimpan.</span>
            </div>
            <button onClick={() => setOnline(navigator.onLine)} type="button">Coba Lagi</button>
          </div>
        )}

        <InstallBanner />

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Navigasi utama mobile">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            end={item.end}
            key={item.path}
            to={item.path}
          >
            <item.icon size={19} />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <AITutorWidget onNavigating={() => setNavigating(true)} />

      {navigating && (
        <div className="learning-loading-overlay">
          <div className="loading-card panel">
            <span className="loading-spinner" />
            <strong>Menyiapkan halaman</strong>
            <p>Memuat data pembelajaran sesuai konteksmu...</p>
            <div className="loading-lines">
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      )}

      {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} type="button" aria-label="Tutup menu" />}
    </div>
  );
}