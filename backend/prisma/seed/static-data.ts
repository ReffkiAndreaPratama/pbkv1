// TechTutor seed data - skills, questions, materials, achievements.
import type { Difficulty } from "@prisma/client";

export type SeedQuestion = {
  skill: string; // Skill.code
  prompt: string;
  options: { id: string; text: string }[];
  correctKeys: string[];
  explanation: string;
  difficulty: Difficulty;
  phases: ("PRETEST" | "POSTTEST" | "ADAPTIVE")[];
};

export const QUESTIONS: SeedQuestion[] = [
  // ---------------- POWER
  {
    skill: "POWER",
    prompt: "Laptop benar-benar mati total. Langkah pertama yang paling tepat adalah...",
    options: [
      { id: "A", text: "Langsung ganti baterai" },
      { id: "B", text: "Periksa aliran listrik & adaptor daya" },
      { id: "C", text: "Format ulang Windows" },
      { id: "D", text: "Pasang ulang RAM" },
    ],
    correctKeys: ["B"],
    explanation: "Matikan total dimulai dari aliran daya: adaptor, outlet, kabel — bukan langsung membongkar komponen.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "POWER",
    prompt: "Kode beep 1 panjang + 3 pendek pada banyak motherboard umumnya menandakan...",
    options: [
      { id: "A", text: "Masalah RAM" },
      { id: "B", text: "VGA rusak" },
      { id: "C", text: "Hard disk gagal" },
      { id: "D", text: "PSU mati" },
    ],
    correctKeys: ["A"],
    explanation: "Pola beep adalah kode POST. 1 panjang + 3 pendek sering berarti RAM tidak terdeteksi / slot bermasalah.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "POWER",
    prompt: "PC restart sendiri saat beban tinggi. Penyebab paling umum yang harus dicek pertama kali...",
    options: [
      { id: "A", text: "Suhu/pendinginan CPU atau PSU tidak stabil" },
      { id: "B", text: "Virus" },
      { id: "C", text: "Kabel LAN" },
      { id: "D", text: "Pengaturan monitor" },
    ],
    correctKeys: ["A"],
    explanation: "Beban tinggi menaikkan suhu dan konsumsi daya; overheating atau PSU lemah menjadi biang utama restart.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "POWER",
    prompt: "Saat membongkar komponen di dalam casing, keselamatan yang wajib dilakukan pertama...",
    options: [
      { id: "A", text: "Cabut daya listrik dan gunakan tali/alat anti-statik" },
      { id: "B", text: "Biarkan daya menyala agar mudah" },
      { id: "C", text: "Gunakan sendok logam" },
      { id: "D", text: "Tidak perlu berhati-hati karena komponen aman" },
    ],
    correctKeys: ["A"],
    explanation: "Cabut daya cegah arus pendek & sengatan; gelang antistatik melindungi komponen dari ESD.",
    difficulty: "EASY",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "POWER",
    prompt: "Fungsi utama UPS (Uninterruptible Power Supply) adalah...",
    options: [
      { id: "A", text: "Membuat PC lebih cepat" },
      { id: "B", text: "Melindungi perangkat dari mati listrik mendadak dan memberi waktu shutdown bersih" },
      { id: "C", text: "Menggantikan peran RAM" },
      { id: "D", text: "Memperbaiki sinyal WiFi" },
    ],
    correctKeys: ["B"],
    explanation: "UPS menampung daya sementara sehingga PC bisa mati dengan benar saat listrik padam.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },

  // ---------------- BOOT
  {
    skill: "BOOT",
    prompt: "Windows masuk-loop 'Preparing Automatic Repair'. Langkah yang paling tepat...",
    options: [
      { id: "A", text: "Masuk Advanced Startup → Startup Repair / Safe Mode" },
      { id: "B", text: "Biarkan restart terus menerus" },
      { id: "C", text: "Cabut semua komponen PC" },
      { id: "D", text: "Ganti hard disk langsung" },
    ],
    correctKeys: ["A"],
    explanation: "Loop tidak sembuh sendiri; intervensi lewat media recovery/Advanced Startup adalah jalur yang benar.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "BOOT",
    prompt: "BSOD 0x0000007B (INACCESSIBLE_BOOT_DEVICE) menunjukkan masalah pada...",
    options: [
      { id: "A", text: "Akses Windows ke boot device (mode ATA/SATA atau media boot)" },
      { id: "B", text: "Kipas CPU" },
      { id: "C", text: "Port monitor" },
      { id: "D", text: "Pengaturan bahasa Windows" },
    ],
    correctKeys: ["A"],
    explanation: "Windows tidak dapat mengakses partisi boot — periksa mode SATA, kabel, dan kesehatan media.",
    difficulty: "HARD",
    phases: ["PRETEST", "POSTTEST"],
  },
  {
    skill: "BOOT",
    prompt: "Cara termudah masuk Safe Mode di Windows modern...",
    options: [
      { id: "A", text: "Shift + Restart → Troubleshoot → Startup Settings → Safe Mode" },
      { id: "B", text: "Menekan tombol power 10 kali" },
      { id: "C", text: "Menghapus semua file di drive C:" },
      { id: "D", text: "Mematikan internet" },
    ],
    correctKeys: ["A"],
    explanation: "Shift+Restart memperlihatkan opsi recovery, termasuk Safe Mode.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "BOOT",
    prompt: "Urutan yang benar pada POST (Power On Self-Test)...",
    options: [
      { id: "A", text: "Pasokan daya → memori/CPU → kartu grafis → cari boot device" },
      { id: "B", text: "Boot device → PSU → RAM" },
      { id: "C", text: "Monitor → CPU → RAM" },
      { id: "D", text: "Semua serentak tanpa urutan" },
    ],
    correctKeys: ["A"],
    explanation: "POST dimulai dari suplai daya, lalu mendeteksi komponen inti, baru mencari perangkat boot.",
    difficulty: "MEDIUM",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "BOOT",
    prompt: "Setelah menginstal driver baru Windows gagal boot. Keputusan terbaik...",
    options: [
      { id: "A", text: "Boot ke Safe Mode, lalu rollback/uninstall driver tersebut" },
      { id: "B", text: "Langsung instal ulang OS" },
      { id: "C", text: "Matikan semua daya PSU" },
      { id: "D", text: "Tambahkan RAM" },
    ],
    correctKeys: ["A"],
    explanation: "Safe Mode tidak memuat driver bermasalah sehingga driver bisa di-rollback dengan aman.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },

  // ---------------- NETWORK
  {
    skill: "NETWORK",
    prompt: "IP 169.254.x.x di adapter LAN berarti...",
    options: [
      { id: "A", text: "Komputer memakai IP statis publik" },
      { id: "B", text: "DHCP tidak merespons (APIPA)" },
      { id: "C", text: "Router mendapatkan IP sendiri" },
      { id: "D", text: "DNS bekerja sempurna" },
    ],
    correctKeys: ["B"],
    explanation: "APIPA dipakai saat tidak ada server DHCP yang menjawab — indikasi masalah DHCP.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "NETWORK",
    prompt: "PING gateway berhasil, tapi situs gagal dibuka (nslookup gagal). Kemungkinan besar...",
    options: [
      { id: "A", text: "Masalah DNS — ganti DNS publik (8.8.8.8 / 1.1.1.1)" },
      { id: "B", text: "Kabel LAN putus" },
      { id: "C", text: "GPU overheat" },
      { id: "D", text: "Hard disk penuh" },
    ],
    correctKeys: ["A"],
    explanation: "Gateway OK tapi resolusi nama gagal = DNS bermasalah pada router/adapter.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "NETWORK",
    prompt: "Perintah untuk melihat konfigurasi IP di Windows adalah...",
    options: [
      { id: "A", text: "ipconfig" },
      { id: "B", text: "dir" },
      { id: "C", text: "msinfo32 /check" },
      { id: "D", text: "sfc /scannow" },
    ],
    correctKeys: ["A"],
    explanation: "ipconfig menampilkan IP, mask, gateway, dan DNS adapter.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "NETWORK",
    prompt: "Channel WiFi 2.4 GHz yang tidak saling tumpang-tindih (recommended)...",
    options: [
      { id: "A", text: "1, 6, 11" },
      { id: "B", text: "2, 4, 8" },
      { id: "C", text: "3, 5, 7" },
      { id: "D", text: "Semua channel sama saja" },
    ],
    correctKeys: ["A"],
    explanation: "Channel 1,6,11 adalah irisan non-overlap di pita 2.4 GHz.",
    difficulty: "MEDIUM",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "NETWORK",
    prompt: "WiFi terhubung penuh tapi tanpa internet. Tes berjenjang yang benar...",
    options: [
      { id: "A", text: "Ping gateway → ping IP publik → nslookup/DNS" },
      { id: "B", text: "Langsung format ulang laptop" },
      { id: "C", text: "Ganti antena router" },
      { id: "D", text: "Ubah password WiFi" },
    ],
    correctKeys: ["A"],
    explanation: "Berjenjang memisahkan masalah di lapis koneksi, routing IP, dan nama/domain.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },

  // ---------------- STORAGE
  {
    skill: "STORAGE",
    prompt: "Drive SSD/HDD muncul sebagai RAW dan berisi data penting. Tindakan pertama...",
    options: [
      { id: "A", text: "Jangan format; periksa kabel/port dan SMART drive" },
      { id: "B", text: "Format cepat agar bisa dipakai" },
      { id: "C", text: "Cabut tanpa backup" },
      { id: "D", text: "Hapus partisi semua" },
    ],
    correctKeys: ["A"],
    explanation: "Format menghapus data permanen. Selalu cari penyebab (fisik vs filesystem) sebelum menyerah.",
    difficulty: "HARD",
    phases: ["PRETEST", "POSTTEST"],
  },
  {
    skill: "STORAGE",
    prompt: "Bunyi 'klik-klik' pada HDD biasanya menandakan...",
    options: [
      { id: "A", text: "Kegagalan mekanik — backup data segera" },
      { id: "B", text: "HDD sedang defrag" },
      { id: "C", text: "Suhu normal HS" },
      { id: "D", text: "Driver belum diinstal" },
    ],
    correctKeys: ["A"],
    explanation: "Klik berulang = head mekanik gagal menjangkau sektor. Hentikan pemakaian, backup dulu.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "STORAGE",
    prompt: "Perintah untuk memeriksa integritas file sistem Windows...",
    options: [
      { id: "A", text: "sfc /scannow" },
      { id: "B", text: "chkdsk /n" },
      { id: "C", text: "format c:" },
      { id: "D", text: "ipconfig /v" },
    ],
    correctKeys: ["A"],
    explanation: "sfc memverifikasi dan memperbaiki file sistem; DISM untuk image sistem.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "STORAGE",
    prompt: "Manfaat teknologi SMART pada disk adalah...",
    options: [
      { id: "A", text: "Memprediksi/memantau kesehatan disk" },
      { id: "B", text: "Mengganti RAM" },
      { id: "C", text: "Mempercepat WiFi" },
      { id: "D", text: "Mengatur resolusi" },
    ],
    correctKeys: ["A"],
    explanation: "SMART mencatat metrik kesehatan (sector reallocated, temperature) untuk deteksi dini kerusakan.",
    difficulty: "MEDIUM",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "STORAGE",
    prompt: "PC lemot karena drive C: penuh 95%. Langkah terbaik untuk memulai...",
    options: [
      { id: "A", text: "Disk Cleanup + hapus temp/hibernation, evaluasi kapasitas" },
      { id: "B", text: "Format drive langsung tanpa backup" },
      { id: "C", text: "Nambah fan casing" },
      { id: "D", text: "Matikan internet" },
    ],
    correctKeys: ["A"],
    explanation: "Disk penuh diperbaiki dengan pembersihan dan/atau relokasi; bukan format tanpa backup.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },

  // ---------------- DISPLAY
  {
    skill: "DISPLAY",
    prompt: "Layar laptop gelap tapi saat disenter ada gambar samar. Kemungkinan besar...",
    options: [
      { id: "A", text: "Backlight/inverter mati" },
      { id: "B", text: "Disk penuh" },
      { id: "C", text: "RAM kurang" },
      { id: "D", text: "Tidak ada virus" },
    ],
    correctKeys: ["A"],
    explanation: "Gambar samar berarti panel bekerja (pixels aktif), lampu belakangnya mati.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "DISPLAY",
    prompt: "Monitor 'No Signal' padahal PC menyala. Hal pertama yang dicek...",
    options: [
      { id: "A", text: "Kabel video & sumber input monitor" },
      { id: "B", text: "Beli monitor baru" },
      { id: "C", text: "Format ulang" },
      { id: "D", text: "Cek saldo internet" },
    ],
    correctKeys: ["A"],
    explanation: "Periksa kabel di port GPU, ganti port, dan pastikan selected input monitor benar.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "DISPLAY",
    prompt: "Resolusi yang paling disarankan untuk monitor LCD adalah...",
    options: [
      { id: "A", text: "Resolusi native monitor" },
      { id: "B", text: "Resolusi terkecil yang ada" },
      { id: "C", text: "Selalu 4K walaupun tak didukung" },
      { id: "D", text: "Resolusi acak" },
    ],
    correctKeys: ["A"],
    explanation: "Resolusi native membuat teks paling tajam; di luar itu gambar mengabur.",
    difficulty: "MEDIUM",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "DISPLAY",
    prompt: "Artefak tampilan muncul tepat setelah update driver GPU. Langkah terbaik...",
    options: [
      { id: "A", text: "Rollback/reinstall driver GPU yang stabil" },
      { id: "B", text: "Beli GPU baru segera" },
      { id: "C", text: "Replace semua RAM" },
      { id: "D", text: "Ganti monitor" },
    ],
    correctKeys: ["A"],
    explanation: "Perubahan tepat setelah update → kecurigaan driver, bukan hardware.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "DISPLAY",
    prompt: "Kabel yang umum membawa sinyal tampilan digital adalah...",
    options: [
      { id: "A", text: "HDMI / DisplayPort" },
      { id: "B", text: "USB-A" },
      { id: "C", text: "RJ45" },
      { id: "D", text: "SATA" },
    ],
    correctKeys: ["A"],
    explanation: "HDMI & DisplayPort mentransfer video digital; RJ45 jaringan, SATA storage.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },

  // ---------------- PERIPHERAL
  {
    skill: "PERIPHERAL",
    prompt: "Pekerjaan cetak menggantung permanen di antrean. Solusi yang tepat...",
    options: [
      { id: "A", text: "Restart Print Spooler dan bersihkan folder SPOOL" },
      { id: "B", text: "Instal ulang Windows" },
      { id: "C", text: "Ganti monitor" },
      { id: "D", text: "Matikan printer selamanya" },
    ],
    correctKeys: ["A"],
    explanation: "Macet halnya di antrean spooler; restart service + hapus file SPOOL biasanya menyelesaikan.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "PERIPHERAL",
    prompt: "Printer tidak terdeteksi saat dicolok USB. Langkah yang benar...",
    options: [
      { id: "A", text: "Ganti kabel/port USB lalu install driver resmi" },
      { id: "B", text: "Format hard disk" },
      { id: "C", text: "Ganti CPU" },
      { id: "D", text: "Hidupkan ulang internet" },
    ],
    correctKeys: ["A"],
    explanation: "Mulai dari sambungan fisik, lanjut ke driver; hindari tindakan destruktif.",
    difficulty: "EASY",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "PERIPHERAL",
    prompt: "Cara memastikan printer sehat secara fisik (tanpa PC)...",
    options: [
      { id: "A", text: "Cetak mandiri / self-test print" },
      { id: "B", text: "Menepuk printer" },
      { id: "C", text: "Mencabut kabel listrik" },
      { id: "D", text: "Me-reset PC" },
    ],
    correctKeys: ["A"],
    explanation: "Self-test print menegaskan apakah mesin printer mampu mencetak tanpa bantuan PC.",
    difficulty: "MEDIUM",
    phases: ["PRETEST", "POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "PERIPHERAL",
    prompt: "Keyboard tidak merespons HANYA di satu aplikasi (game). Kemungkinan besar...",
    options: [
      { id: "A", text: "Bukan rusak; cek pengaturan/mode input aplikasi tersebut" },
      { id: "B", text: "Keyboard memang mati total — langsung ganti" },
      { id: "C", text: "CPU overheat" },
      { id: "D", text: "Hard disk penuh" },
    ],
    correctKeys: ["A"],
    explanation: "Berfungsi di aplikasi lain berarti hardware OK — masalah ada di konfigurasi aplikasi/OS.",
    difficulty: "HARD",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
  {
    skill: "PERIPHERAL",
    prompt: "Ke mana melihat audio tidak keluar dimulai dengan urutan yang benar...",
    options: [
      { id: "A", text: "Volume → Device Manager → default playback device → driver" },
      { id: "B", text: "Format ulang → cek speaker" },
      { id: "C", text: "Ganti speaker langsung" },
      { id: "D", text: "Instal game baru dulu" },
    ],
    correctKeys: ["A"],
    explanation: "Periksa pengaturan level-demi-level: volume, device, driver — sedari lapis yang paling tampil.",
    difficulty: "MEDIUM",
    phases: ["POSTTEST", "ADAPTIVE"],
  },
];

export type SeedMaterial = {
  skill: string; // Skill.code
  title: string;
  summary: string;
  order: number;
  sections: { title: string; body: string }[];
};

const S = (title: string, body: string) => ({ title, body });

export const MATERIALS: SeedMaterial[] = [
  {
    skill: "POWER",
    title: "Daya & PSU — Pondasi Semua Komputer",
    summary: "Memahami aliran listrik, PSU, urutan POST, dan keselamatan kelistrikan.",
    order: 1,
    sections: [
      S("Aliran Daya", "Daya dimulai dari stopkontak → PSU. PSU mengubah AC menjadi DC untuk motherboard, CPU, dan periferal. Kabel longgar = gejala 'mati total' paling umum. Urutan cek: outlet → kabel → saklar PSU → indikator. Simpan power network dalam urutan tersebut."),
      S("Urutan POST", "Saat dinyalakan, PSU memberi sinyal power-good, CPU memulai rutinitas: RAM dicek, VGA dicari, lalu BIOS mencari boot device. Kode beep/LED memberi tahu komponen mana yang gagal."),
      S("Gejala Umum", "Restart saat beban = curiga suhu atau PSU. Mati total tanpa LED = curiga pasokan listrik. Bunyi beep = perhatikan kodenya, jangan tebak."),
      S("Keselamatan", "Cabut daya sebelum bekerja di dalam casing. Gunakan gelang antistatik. Jangan menyentuh komponen sambil menyalakan perangkat."),
      S("Rangkuman", "Diagnosa daya selalu bertahap dari yang paling sederhana. Jangan ganti komponen mahal tanpa bukti."),
    ],
  },
  {
    skill: "BOOT",
    title: "Proses Boot & Pemulihan Windows",
    summary: "Fase boot, BSOD umum, Safe Mode, dan peralatan pemulihan OS.",
    order: 1,
    sections: [
      S("Fase Boot", "BIOS/UEFI → boot manager → kernel Windows → login. Masalah di fase awal (sebelum logo) sering hardware; sesudah logo sering software (driver/update)."),
      S("Kode BSOD umum", "0x7B = gaya boot device (mode SATA/disk). 0x7E/0x50 = driver/kernel. Catat kode — itu peta diagnosis."),
      S("Safe Mode", "Shift+Restart → Troubleshoot → Startup Settings. Safe Mode hanya memuat driver dasar — ideal untuk rollback driver & SFC."),
      S("Peralatan recovery", "sfc /scannow (file sistem), DISM /RestoreHealth (image), bootrec (MBR/BCD), System Restore (titik waktu)."),
      S("Rangkuman", "Selesaikan: pisahkan hardware vs software, boot ke recovery, lalu gunakan alat paling ringan yang cocok."),
    ],
  },
  {
    skill: "NETWORK",
    title: "Diagnosa Jaringan Berjenjang",
    summary: "Lapis fisik → IP/DHCP → DNS → aplikasi.",
    order: 1,
    sections: [
      S("Lapis fisik", "Kabel, port, LED, WiFi signal. LED mati saat kabel LAN = lapis fisik. Banyak masalah 'internet hilang' dimulai sini."),
      S("IP & DHCP", "ipconfig untuk melihat IP. 169.254.x.x = APIPA (DHCP tak merespon). Lease/release: ipconfig /release && /renew."),
      S("Routing & DNS", "Ping gateway (koneksi ke router), ping 8.8.8.8 (routing internet), lalu nslookup (DNS). Gagal di salah satu titik → penyebabnya terisolasi."),
      S("WiFi", "Channel 1/6/11 untuk 2.4 GHz. Perangkat lama mungkin tak mendukung WPA3 atau 5 GHz. Band steering bisa mengunci SSID."),
      S("Rangkuman", "Jangan pernah langsung format. Berjenjang: fisik → IP → routing → DNS → aplikasi."),
    ],
  },
  {
    skill: "STORAGE",
    title: "Penyimpanan, SMART & Recovery Data",
    summary: "Membaca kesehatan disk, tanda kerusakan, dan cara menyelamatkan data.",
    order: 1,
    sections: [
      S("SMART & kesehatan", "SMART mencatat sector reallocated, temperature, dan downtime. SMART bad = segera backup."),
      S("Tanda kerusakan", "Bunyi klik (head gagal), RAW partisi, file corrupt, disk 100% terus-menerus. Bedakan fisik vs filesystem."),
      S("RAWD & Recovery", "Jangan format dulu! Cek kabel/port, baca SMART, gunakan tool recovery (TestDisk/Recuva). Backup dulu baru print."),
      S("Backup 3-2-1", "3 salinan data, 2 media berbeda, 1 off-site. Backup rutin menghemat hari-hari buruk."),
      S("Rangkuman", "Ketika media mencurigakan: berhenti memakai → backup → cek penyebab → baru perbaiki."),
    ],
  },
  {
    skill: "DISPLAY",
    title: "Jalur Sinyal Tampilan",
    summary: "GPU → kabel → layar + backlight & pengaturan sistem.",
    order: 1,
    sections: [
      S("Jalur sinyal", "GPU render → kabel (HDMI/DP/VGA) → panel. 'No Signal' = salah satu segmen putus. Cek port GPU (jangan onboard saat GPU terpasang), lalu input monitor."),
      S("Backlight vs panel", "Layar gelap tapi gambar samar saat disenter = backlight mati. Cek kabel inverter/eDP. Layar dan eksternal hitam sekaligus = GPU."),
      S("Resolusi & refresh", "Set resolusi native monitor & refresh rate yang didukung. Artefak setelah update driver = kembalikan (rollback) dulu."),
      S("Rangkuman", "Urutkan dari segmen paling murah & paling mudah diukur: input → kabel → seating → GPU/driver."),
    ],
  },
  {
    skill: "PERIPHERAL",
    title: "Periferal & Spooler Printer",
    summary: "USB enumerasi, antrean cetak, dan deteksi perangkat.",
    order: 1,
    sections: [
      S("USB & enumerasi", "Perangkat USB perlu enumerated oleh OS. Ganti port/kabel, cek hub, lalu Device Manager untuk melihat status driver."),
      S("Antrean cetak", "Print job macet = file SPOOL menggantung. Restart Print Spooler dan bersihkan C:\\Windows\\System32\\spool\\PRINTERS."),
      S("Uji mandiri printer", "Self-test print membuktikan mesin cetak sehat. Jika self-test OK, masalah ada di koneksi/software PC."),
      S("Rangkuman", "Untuk setiap periferal: fisik → detection/driver → aplikasi. Non-destruktif dulu, upgrade terakhir."),
    ],
  },
];

export type SeedAchievement = {
  code: string;
  name: string;
  description: string;
  icon: string;
  condition: Record<string, string | number>;
  xpReward: number;
};

export const ACHIEVEMENTS: SeedAchievement[] = [
  { code: "FIRST_STEP", name: "Langkah Pertama", description: "Selesaikan pretest untuk pertama kali.", icon: "footprints", condition: { type: "PRETEST_DONE", count: 1 }, xpReward: 10 },
  { code: "FIRST_CASE", name: "Troubleshooter Pemula", description: "Selesaikan 1 kasus simulasi dengan sukses.", icon: "wrench", condition: { type: "CASE_SUCCESS", count: 1 }, xpReward: 30 },
  { code: "PERFECT_SIM", name: "Diagnostik Murni", description: "Selesaikan simulasi dengan akurasi ≥ 90% dan tanpa hint.", icon: "target", condition: { type: "SIM_PERFECT", count: 1 }, xpReward: 50 },
  { code: "NO_HINT_3", name: "Veteran Hintless", description: "Selesaikan 3 simulasi sukses tanpa hint.", icon: "brain", condition: { type: "SIM_NO_HINT", count: 3 }, xpReward: 40 },
  { code: "STREAK_3", name: "Konsisten", description: "Aktif 3 hari berturut-turut.", icon: "flame", condition: { type: "STREAK", count: 3 }, xpReward: 20 },
  { code: "STREAK_7", name: "Disiplin", description: "Aktif 7 hari berturut-turut.", icon: "fire", condition: { type: "STREAK", count: 7 }, xpReward: 40 },
  { code: "READER_5", name: "Kutu Buku Teknis", description: "Baca 5 materi pembelajaran.", icon: "book-open", condition: { type: "MATERIAL_READ", count: 5 }, xpReward: 25 },
  { code: "QUIZ_10", name: "Pencari Ilmu", description: "Menjawab benar 10 soal kuis.", icon: "sparkles", condition: { type: "QUIZ_CORRECT", count: 10 }, xpReward: 25 },
  { code: "CASE_10", name: "Junior IT Support", description: "Selesaikan 10 kasus simulasi sukses.", icon: "medal", condition: { type: "CASE_SUCCESS", count: 10 }, xpReward: 60 },
  { code: "LEVEL_5", name: "Level 5", description: "Mencapai level 5.", icon: "rocket", condition: { type: "LEVEL", count: 5 }, xpReward: 50 },
  { code: "SPEEDRUN", name: "Runner", description: "Selesaikan kasus MEDIUM dalam setengah waktu yang diharapkan.", icon: "timer", condition: { type: "SIM_UNDER_HALF_TIME", count: 1 }, xpReward: 40 },
  { code: "GRADUATE", name: "Lulus TechTutor", description: "Lulus posttest dengan skor ≥ 70.", icon: "award", condition: { type: "POSTTEST_PASS", count: 1 }, xpReward: 100 },
];