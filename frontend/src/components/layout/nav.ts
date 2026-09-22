import {
  LayoutDashboard,
  Wrench,
  BookOpenText,
  BrainCircuit,
  Trophy,
  BarChart3,
  Medal,
  Settings,
  ShieldCheck,
  Users,
  ListChecks,
  Database,
  MonitorCog,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  accent?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Belajar",
    items: [
      { title: "Dashboard", path: "/", icon: LayoutDashboard },
      { title: "Simulasi Kasus", path: "/cases", icon: MonitorCog, accent: "tech" },
      { title: "Materi", path: "/materials", icon: BookOpenText, accent: "circuit" },
    ],
  },
  {
    label: "Evaluasi",
    items: [
      { title: "Pretest", path: "/quiz/pretest", icon: BrainCircuit, accent: "energy" },
      { title: "Posttest", path: "/quiz/posttest", icon: ShieldCheck, accent: "danger" },
      { title: "Kuis Adaptif", path: "/quiz/adaptive", icon: ListChecks, accent: "tech" },
    ],
  },
  {
    label: "Perkembangan",
    items: [
      { title: "Progres & Statistik", path: "/progress", icon: BarChart3 },
      { title: "Pencapaian", path: "/achievements", icon: Trophy, accent: "energy" },
      { title: "Papan Peringkat", path: "/leaderboard", icon: Medal },
    ],
  },
];

export const adminNav: NavItem[] = [
  { title: "Dashboard Admin", path: "/admin", icon: Settings },
  { title: "Pengguna", path: "/admin/users", icon: Users },
  { title: "Kasus", path: "/admin/cases", icon: Wrench },
  { title: "Soal Kuis", path: "/admin/questions", icon: ListChecks },
  { title: "Materi", path: "/admin/materials", icon: Database },
];

export const bottomNav: NavItem[] = [
  { title: "Home", path: "/", icon: LayoutDashboard },
  { title: "Kasus", path: "/cases", icon: MonitorCog },
  { title: "Materi", path: "/materials", icon: BookOpenText },
  { title: "Progres", path: "/progress", icon: BarChart3 },
];

export const accentColor: Record<string, string> = {
  tech: "text-secondary",
  circuit: "text-foreground",
  energy: "text-amber-500",
  danger: "text-rose-500",
};