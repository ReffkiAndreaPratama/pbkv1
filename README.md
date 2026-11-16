# TechTutor

Platform pembelajaran adaptif untuk mata kuliah **Troubleshooting & Perawatan Komputer**. Siswa belajar mendiagnosis dan memperbaiki komputer/PC maupun laptop lewat simulasi kasus interaktif (decision-tree), **simulasi perbaikan langsung "Bengkel PC & Laptop"** (inspeksi komponen pada gambar perangkat, alat ukur, tindakan perbaikan, tes nyala), kuis adaptif per-skill, materi bacaan, tutor AI berbasis template (mock), dan gamification (XP, level, streak, achievements, leaderboard).

## Demo account

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | `admin@techtutor.app`    | `admin1234`|
| Siswa | `demo1@techtutor.app`    | `demo1234` |
| Siswa | `demo2@techtutor.app`    | `demo1234` |

Database telah di-seed dengan **6 skill, 32 kasus simulasi (350 node), 54 soal kuis, 24 materi, 15 achievement, 18 misi Bengkel (12 PC + 6 laptop, 110 komponen), dan 3 akun**. Akun demo1 sudah melewati onboarding + pretest/posttest sehingga dashboard dan rekomendasi adaptif langsung terisi.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + TypeScript, Vite 5, Tailwind CSS 3 (komponen ala shadcn), React Router 6, Recharts, Radix primitives, sonner toasts |
| Backend  | Node.js + Express 4, Zod validation, JWT auth (`jsonwebtoken`), Prisma ORM, bcrypt |
| Database | SQLite (default dev) atau PostgreSQL (dokumentasi switch di bawah) |
| Testing  | Vitest (unit-test engine: scoring, hint, adaptive, AI tutor, repair scoring, integritas seed/chassis) + ESLint |

## Project structure

```
techtutor/
├── backend/                  # Express REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Skema DB (20 model)
│   │   ├── seed.ts           # Seed idempoten (wipe → insert)
│   │   └── seed/             # data kasus, soal, materi, achievement, misi bengkel
│   └── src/
│       ├── index.ts          # Bootstrap app
│       ├── config.ts         # Env config
│       ├── middleware/       # auth (requireAuth/requireAdmin), error, validate
│       ├── routes/           # auth, profile, quiz, cases, simulation, repair, materials, ai, progress, admin
│       └── lib/              # adaptive (mastery/XPA), scoring, repair-scoring, hint, ai-tutor, gamification
├── frontend/
│   ├── index.html
│   └── src/
│       ├── pages/           # Satu file per route (~23 halaman, termasuk repair/)
│       ├── components/      # ui/ primitives, layout/ (app-shell, nav, ai-tutor-widget)
│       └── lib/             # types.ts, auth.tsx, api.ts, utils.ts
└── tests/                   # Unit test engine inti
```

## Prerequisites

- Node.js ≥ 18 dan npm ≥ 9.

## Setup

```bash
cd techtutor
npm install                      # atau: npm run setup (install backend+frontend + db:setup)
cp backend/.env.example backend/.env
npm run db                       # prisma migrate deploy + seed (idempoten, bisa dijalankan berulang)
```

## Run (development)

```bash
npm run dev                      # backend :5000 + frontend :5173 (concurrently)
# atau pisah:
npm run dev:backend              # http://localhost:5000
npm run dev:frontend             # http://localhost:5173
```

Buka **http://localhost:5173**. Frontend mem-proxy `/api` ke backend (konfigurasi port via `API_TARGET` di `frontend/vite.config.ts` untuk dev server).

## Verifikasi berkala

```bash
npm run typecheck
npm run lint
npm run build
npm run test
```

## API overview (ringkas)

| Area | Endpoint | Keterangan |
|------|----------|------------|
| Auth | `POST /api/auth/register` · `login` · `GET /api/auth/me` | JWT; password di-hash bcrypt (cost 10) |
| Profile | `GET/PUT /api/profile` · `POST /api/profile/complete` | Learning profile + onboarding state (wajib sebelum pretest) |
| Quiz | `GET/POST /api/quiz/{pretest,posttest,adaptive}` · `/start` · `/submit` | Mastery diinisialisasi/diperbarui per jawaban |
| Cases | `GET /api/cases` · `/path` · `/history` · `/:id` · `/:id/start` | Rekomendasi adaptif per skill |
| Simulation | `GET /api/simulation/:attemptId` · `submit` · `hint` · `abandon` | Decision tree: condition/effect, SOL/FAIL, skor metrik |
| Bengkel PC & Laptop | `GET /api/repair/jobs` · `/jobs/:id` · `POST /jobs/:id/start` · `GET /attempts/:id` · `POST /attempts/:id/action` · `abandon` · `GET /history` | Simulasi perbaikan PC & laptop: INSPECT, TEST (VISUAL/MULTIMETER/POST_CARD/SOFTWARE), FIX (REPLACE/RESEAT/CLEAN/RECONNECT), POWER_TEST; tiap job punya `deviceType` (`PC`/`LAPTOP`), nyawa, combo, timer, skor/grade/bintang; `/history` mengembalikan 12 sesi terakhir |
| Materials | `GET /api/materials` · `/:id` · `POST /:id/read` | Tandai selesai +15 XP |
| AI Tutor | `POST /api/ai/chat` | Router intent deterministik (cheat → socratic, konsep, hint, gejala); tidak pernah spoiler jawaban |
| Progress | `GET /api/progress/{mastery,summary,activity,achievements,leaderboard}` | Satu sumber penghitung XP/level (learningProfile) |
| Admin | `GET/POST/PUT/DELETE /api/admin/*` · `POST /api/admin/users/:id/reset` | Manajemen kasus/soal/materi/pengguna, statistik, reset progress |

## Switching ke PostgreSQL

1. Di `backend/prisma/schema.prisma`, ubah `provider = "sqlite"` menjadi `"postgresql"` pada blok `datasource db`.
2. Update `DATABASE_URL` di `backend/.env` (contoh di `.env.example`).
3. Jalankan ulang: `npm run db` (migrate deploy + seed).

## Fitur utama

- **Simulator troubleshooting** — 32 kasus realistis dengan pohon keputusan bercabang; siswa memilih langkah diagnosis/tindakan, sistem menerapkan `condition`/`effect` sinyal, hingga mencapai SOL atau FAIL; skor dihitung dari akurasi, efisiensi langkah, waktu, dan penalti hint.
- **Bengkel PC & Laptop (simulasi perbaikan)** — 18 misi praktik langsung (12 PC + 6 laptop) di meja kerja interaktif. Perangkat digambar dengan CSS: **tower PC** (motherboard, CPU, RAM, GPU, PSU, HDD, kipas, kabel) dan **laptop** (lid/layar, dek keyboard, panel bawah dengan cover dilepas). Klik hotspot komponen pada gambar (atau periferal/kabel di baki meja), inspeksi visual, ukur dengan multimeter/POST card/diagnostik software, lalu lakukan tindakan perbaikan yang tepat (ganti, reseat, bersihkan, sambung ulang) dan tekan **Tes Nyala**. Gamifikasi: 3 nyawa, combo multiplier, countdown, bintang, grade S–D, XP, mastery per skill, dan 3 achievement teknisi. Papan misi punya filter **Semua / PC / Laptop**, badge perangkat, dan riwayat 12 perbaikan terakhir; statistik perbaikan (jumlah, sukses, rata-rata, terbaik) ikut dihitung di `/api/progress/summary` serta dashboard. Data komponen rusak tidak pernah bocor ke klien sebelum didiagnosis. Tutorial **Cara main** muncul otomatis sekali saat pertama membuka Bengkel dan bisa dibuka ulang dari hero atau HUD; di layar kecil tersedia **daftar komponen** yang bisa diketuk dan panel diagnosis otomatis digulir. **Efek suara** Web Audio (pilih, inspeksi, perbaikan, salah, menang/kalah) bisa dimatikan lewat tombol speaker. Umpan balik tindakan salah menjelaskan akar masalah (longgar/kotor/rusak/sambungan) tanpa membocorkan tindakan yang benar. Sebelum misi dimulai, **briefing misi** menampilkan gejala, alur kerja, batas waktu, nyawa, percobaan, dan rekor terbaik. Di meja kerja tersedia **shortcut keyboard** `1`–`4` untuk alat diagnosis dan `P` untuk Tes Nyala, plus HUD dengan timer melingkar, meter combo, dan log diagnosis bergaya konsol.
- **Hint bertahap 4 level** — dari pemancing socratic hingga jawaban penuh ("Jawab Langsung" terekam), memengaruhi skor.
- **Adaptive path** — rekomendasi kasus/kuis/material per skill berdasarkan mastery (deterministik untuk input sama).
- **AI Tutor (mock)** — router intent deterministik: menolak permintaan spoiler, memberi pertanyaan pemancing/hint, tidak pernah membocorkan jawaban.
- **Gamification** — XP, level, streak harian, 15 achievement, leaderboard, konsisten dari satu sumber (learningProfile).
- **Panel admin** — statistik platform, manajemen CRUD kasus/soal/materi, toggle aktif/nonaktif, reset progress per pengguna.

## Roadmap / TODO hidup

Bagian di luar scope demo-minimum yang masih berjalan (P2/P3), dicatat sesuai kriteria "definition of done":

- [ ] **Tree editor** penuh untuk admin (buat node/opsi kasus dari UI) — saat ini pembuatan kasus dilakukan via seed/admin API, belum dari UI.
- [ ] **Variasi seed soal** dalam jumlah besar & generator soal.
- [ ] **Sertifikat / ekspor CSV** hasil belajar.
- [ ] **Switch PostgreSQL** diuji menyeluruh (jaringan/diagram sudah siap).
- [ ] **Integrasi LLM sungguhan** (`AI_PROVIDER=openai` dkk) — hanya didokumentasikan, tanpa dependensi aktif agar demo tetap offline.
- [ ] **Audit aksesibilitas & optimalisasi** (code-splitting chunk >500 kB).

## Catatan keamanan

- `.env`, `node_modules/`, dan `*.db` tidak pernah di-commit (lihat `.gitignore`).
- `AI_PROVIDER=mock` default; seluruh demo berjalan offline tanpa fetching API eksternal.