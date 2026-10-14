import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Database, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader, EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { linksToText, textToLinks } from "@/lib/media";

interface AdminMaterial {
  id: string;
  skillId: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  isActive: boolean;
  readCount: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
  links?: { title: string; url: string }[] | null;
  skill: { id: string; code: string; name: string };
}

interface AdminSkill {
  id: string;
  code: string;
  name: string;
}

type EditorState =
  | { mode: "new" }
  | { mode: "edit"; material: AdminMaterial }
  | { mode: "closed" };

const emptyForm = {
  skillId: "",
  title: "",
  summary: "",
  content: "",
  order: "1",
  imageUrl: "",
  videoUrl: "",
  links: "",
};

function EditorForm({
  skills,
  initial,
  onCancel,
  onSaved,
}: {
  skills: AdminSkill[];
  initial: { mode: "new" } | { mode: "edit"; material: AdminMaterial };
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() =>
    initial.mode === "new"
      ? { ...emptyForm, skillId: skills[0]?.id ?? "" }
      : {
          skillId: initial.material.skillId,
          title: initial.material.title,
          summary: initial.material.summary,
          content: initial.material.content,
          order: String(initial.material.order),
          imageUrl: initial.material.imageUrl ?? "",
          videoUrl: initial.material.videoUrl ?? "",
          links: linksToText(initial.material.links),
        }
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.skillId || !form.title.trim() || !form.content.trim()) {
      toast.error("Skill, judul, dan isi materi wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      skillId: form.skillId,
      title: form.title.trim(),
      summary: form.summary,
      content: form.content,
      order: Number(form.order) || 1,
      imageUrl: form.imageUrl,
      videoUrl: form.videoUrl,
      links: textToLinks(form.links),
    };
    try {
      if (initial.mode === "new") {
        await api.post("/api/admin/materials", payload);
        toast.success("Materi berhasil dibuat.");
      } else {
        await api.put(`/api/admin/materials/${initial.material.id}`, payload);
        toast.success("Materi berhasil diperbarui.");
      }
      onSaved();
    } catch {
      toast.error("Gagal menyimpan materi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <h3 className="mb-4 font-display text-base font-bold">
        {initial.mode === "new" ? "Tambah Materi Baru" : `Edit: ${initial.material.title}`}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="mt-skill">Skill</Label>
          <select
            id="mt-skill"
            value={form.skillId}
            onChange={set("skillId")}
            className="mt-1 flex h-9 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mt-title">Judul</Label>
          <Input id="mt-title" value={form.title} onChange={set("title")} placeholder="Materi ..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mt-summary">Ringkasan</Label>
          <Textarea id="mt-summary" value={form.summary} onChange={set("summary")} placeholder="Ringkasan singkat materi" rows={2} />
        </div>
        <div>
          <Label htmlFor="mt-order">Urutan</Label>
          <Input id="mt-order" type="number" value={form.order} onChange={set("order")} />
        </div>
        <div>
          <Label htmlFor="mt-video">Link YouTube</Label>
          <Input id="mt-video" value={form.videoUrl} onChange={set("videoUrl")} placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mt-image">URL Gambar</Label>
          <Input id="mt-image" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://...jpg" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mt-links">Link Referensi (satu per baris: Judul | https://...)</Label>
          <Textarea id="mt-links" value={form.links} onChange={set("links")} placeholder={"Contoh:\nPerintah CMD | https://docs.microsoft.com/cmd"} rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mt-content">Isi Materi (Markdown)</Label>
          <Textarea id="mt-content" value={form.content} onChange={set("content")} placeholder={"## Judul Bagian\n\nNarasi materi..."} rows={12} className="font-mono-tech text-xs" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Materi"}
        </Button>
      </div>
    </Card>
  );
}

export function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<AdminMaterial[] | null>(null);
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });

  const load = useCallback(async () => {
    try {
      const [ms, sk] = await Promise.all([api.get<AdminMaterial[]>("/api/admin/materials"), api.get<AdminSkill[]>("/api/admin/skills")]);
      setMaterials(ms);
      setSkills(sk);
    } catch {
      setMaterials([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (m: AdminMaterial) => {
    try {
      const updated = await api.put<AdminMaterial>(`/api/admin/materials/${m.id}`, { isActive: !m.isActive });
      setMaterials((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Status materi diperbarui.");
    } catch {
      toast.error("Gagal memperbarui materi.");
    }
  };

  const remove = async (m: AdminMaterial) => {
    if (!window.confirm(`Hapus materi "${m.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api.del(`/api/admin/materials/${m.id}`);
      setMaterials((prev) => (prev ?? []).filter((x) => x.id !== m.id));
      toast.success("Materi dihapus.");
    } catch {
      toast.error("Gagal menghapus materi.");
    }
  };

  if (!materials) return <PageLoader />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Manajemen Materi"
        subtitle={`${materials.length} materi terdaftar. ${skills.length} skill tersedia.`}
        actions={
          <Button size="sm" onClick={() => setEditor({ mode: "new" })}>
            <Plus className="h-4 w-4" /> Tambah Materi
          </Button>
        }
      />

      {editor.mode !== "closed" && (
        <div className="mb-5">
          <EditorForm
            skills={skills}
            initial={editor}
            onCancel={() => setEditor({ mode: "closed" })}
            onSaved={() => {
              setEditor({ mode: "closed" });
              void load();
            }}
          />
        </div>
      )}

      {materials.length === 0 ? (
        <EmptyState icon={<Database className="h-6 w-6" />} title="Belum ada materi" />
      ) : (
        <div className="space-y-2.5">
          {materials.map((m) => (
            <Card key={m.id} className={cn("flex flex-wrap items-center gap-3 p-4", !m.isActive && "opacity-60")}>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="" className="hidden h-14 w-20 shrink-0 rounded-lg object-cover sm:block" loading="lazy" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono-tech">{m.skill.code}</Badge>
                  <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                  {m.videoUrl && <Badge variant="info" className="text-[10px]">Video</Badge>}
                  {m.links && m.links.length > 0 && <Badge variant="outline" className="text-[10px]">+{m.links.length} link</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {m.summary} · urutan {m.order} · {m.readCount}x dibaca
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setEditor({ mode: "edit", material: m })} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => void toggleActive(m)}>
                  {m.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void remove(m)} aria-label="Hapus">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}