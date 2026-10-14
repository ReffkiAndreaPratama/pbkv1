import {
  LayoutDashboard,
  BookOpenText,
  ListChecks,
  MonitorCog,
  Target,
  UserRound,
  Sparkles,
  ShieldCheck,
  Users,
  Wrench,
  Database,
  Layers,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Materi", path: "/materials", icon: BookOpenText },
  { title: "Latihan", path: "/practice", icon: ListChecks },
  { title: "Simulasi", path: "/cases", icon: MonitorCog },
  { title: "Evaluasi", path: "/evaluation", icon: Target },
  { title: "Profil", path: "/profile", icon: UserRound },
];

export const bottomNav: NavItem[] = navItems;

export const adminNavItems: NavItem[] = [
  { title: "Ringkasan", path: "/admin", icon: LayoutDashboard, end: true },
  { title: "Pengguna", path: "/admin/users", icon: Users },
  { title: "Kategori Skill", path: "/admin/skills", icon: Layers },
  { title: "Kasus", path: "/admin/cases", icon: Wrench },
  { title: "Soal Kuis", path: "/admin/questions", icon: ListChecks },
  { title: "Materi", path: "/admin/materials", icon: Database },
  { title: "Monitor Progres", path: "/admin/progress", icon: Activity },
];

export const adminIcon = ShieldCheck;
export const aiIcon = Sparkles;