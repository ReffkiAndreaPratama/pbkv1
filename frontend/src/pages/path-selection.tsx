import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth";
import { useJalur, type Jalur } from "@/lib/learning-path";

const pathData: Array<{
  type: Jalur;
  image: string;
  title: string;
  text: string;
  topics: string[];
}> = [
  {
    type: "PC",
    image: "/images/hero.jpg",
    title: "Troubleshooting PC",
    text: "Pelajari cara mengenali dan menangani masalah umum pada komputer desktop.",
    topics: ["Komponen", "Power & PSU", "RAM", "Storage", "GPU", "Motherboard", "BIOS/UEFI", "Perangkat Input"],
  },
  {
    type: "Laptop",
    image: "/materials/boot.jpg",
    title: "Troubleshooting Laptop",
    text: "Pahami diagnosis masalah pada laptop dengan karakteristik perangkat yang lebih terintegrasi.",
    topics: ["Power & Charging", "Baterai", "RAM & Storage", "Display", "Cooling", "Keyboard & Touchpad", "Wi-Fi", "Konektivitas"],
  },
];

export function PathSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jalur, setJalur } = useJalur();
  const [selected, setSelected] = useState<Jalur>(jalur);

  const confirm = () => {
    setJalur(selected);
    toast.success(`Jalur aktif: ${selected === "PC" ? "Troubleshooting PC" : "Troubleshooting Laptop"}`);
    navigate(user?.profile?.pretestDone ? "/dashboard" : "/quiz/pretest", { replace: true });
  };

  return (
    <div className="path-page">
      <header className="simple-header">
        <Logo onClick={() => navigate("/dashboard")} />
        <div>
          <span>Sudah punya akun?</span>
          <button className="btn btn-secondary" onClick={() => navigate("/profile")} type="button">
            Dashboard
          </button>
        </div>
      </header>
      <main>
        <div className="path-heading">
          <span className="step-badge">LANGKAH 2 DARI 2</span>
          <h1>Pilih Jalur Pembelajaran</h1>
          <p>Pilih perangkat yang ingin kamu kuasai. Jalur ini bisa diganti kapan saja melalui profil.</p>
        </div>

        <div className="path-grid">
          {pathData.map((p) => {
            const active = selected === p.type;
            return (
              <article
                className={active ? "path-card selected" : "path-card"}
                key={p.type}
                onClick={() => setSelected(p.type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(p.type);
                }}
              >
                <div className="path-card-top">
                  <div className="path-photo">
                    <img src={p.image} alt={p.title} loading="lazy" />
                    <span className="path-type">JALUR {p.type.toUpperCase()}</span>
                    {active && (
                      <span className="selected-check">
                        <Check size={15} />
                      </span>
                    )}
                  </div>
                </div>
                <h2>{p.title}</h2>
                <p>{p.text}</p>
                <div className="topic-list">
                  {p.topics.map((t) => (
                    <span key={t}>
                      <Check size={15} />
                      {t}
                    </span>
                  ))}
                </div>
                <div className="path-selection-progress">
                  <div>
                    <span>Progress jalur</span>
                    <strong>0%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: "0%" }} />
                  </div>
                </div>
                <button
                  className={active ? "btn btn-primary full-button" : "btn btn-secondary full-button"}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm();
                  }}
                  type="button"
                >
                  Pilih Jalur <ArrowRight size={18} />
                </button>
              </article>
            );
          })}
        </div>
        <p className="path-note">
          <Info size={16} /> Jalur hanya memengaruhi materi dan simulasi yang ditawarkannya. Semua kategori skill tetap bisa dipelajari.
        </p>
      </main>
    </div>
  );
}