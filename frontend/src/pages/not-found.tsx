import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div style={{ padding: 24 }}>
      <div className="panel empty-state" style={{ maxWidth: 460, margin: "10vh auto 0" }}>
        <Compass size={40} style={{ color: "#98a2b3" }} />
        <strong>404 — Halaman tidak ditemukan</strong>
        <p>Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
        <Link className="btn btn-primary" to="/" style={{ marginTop: 16 }}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
