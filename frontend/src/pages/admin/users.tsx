import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ChevronRight, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  simCount: number;
  profile: { totalXp: number; level: number; pretestDone: boolean; posttestDone: boolean; posttestScore: number | null; streakDays: number };
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  useEffect(() => {
    api.get<AdminUser[]>("/api/admin/users").then(setUsers).catch(() => setUsers([]));
  }, []);

  if (!users) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manajemen Pengguna" subtitle={`${users.length} pengguna terdaftar.`} />

      {users.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Belum ada pengguna" />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border/60">
            {users.map((u) => (
              <Link key={u.id} to={`/admin/users/${u.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-circuit text-sm font-bold text-white">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{u.name}</span>
                    {u.role === "ADMIN" && <Badge variant="info" className="gap-1 text-[10px]"><BadgeCheck className="h-3 w-3" /> Admin</Badge>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="hidden gap-2 sm:flex">
                  {u.profile.pretestDone && <Badge variant="success" className="text-[10px]">Pretest</Badge>}
                  {u.profile.posttestDone && <Badge variant="info" className="text-[10px]">Posttest {u.profile.posttestScore ?? 0}</Badge>}
                </div>
                <div className="hidden text-right md:block">
                  <div className="text-sm font-bold">{u.profile.totalXp} XP</div>
                  <div className="text-[11px] text-muted-foreground">Level {u.profile.level} · {u.simCount} simulasi</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}