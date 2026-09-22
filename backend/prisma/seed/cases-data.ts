// TechTutor seed data - 20 playable troubleshooting cases with decision trees.

export type SeedOption = {
  label: string;
  target?: string; // nodeKey tujuan (opsional bila tidak ada lanjutan)
  correct?: boolean;
  feedback?: string;
  condition?: { signal: string; equals: string | boolean | number };
  effect?: { setSignal?: Record<string, string | boolean | number>; forceFail?: boolean };
};

export type SeedNodeType = "START" | "DIAGNOSTIC" | "ACTION" | "DECISION" | "SOLUTION" | "FAIL";

export type SeedNode = {
  key: string;
  type: SeedNodeType;
  text: string;
  detail?: string;
  best?: boolean;
  options?: SeedOption[];
};

export type SeedCase = {
  title: string;
  scenario: string;
  skill: string; // Skill.code
  difficulty: "EASY" | "MEDIUM" | "HARD";
  targetSteps: number;
  nodes: SeedNode[];
};

export const SKILLS = [
  { code: "POWER", name: "Daya", description: "Aliran listrik, PSU, dan keselamatan kelistrikan perangkat." },
  { code: "BOOT", name: "Booting & Sistem", description: "Proses POST, boot Windows, BSOD, dan pemulihan OS." },
  { code: "NETWORK", name: "Jaringan & Internet", description: "IP, DHCP, DNS, WiFi, switch, dan konektivitas." },
  { code: "STORAGE", name: "Penyimpanan & Disk", description: "HDD/SSD, SMART, partisi, recovery, dan backup." },
  { code: "DISPLAY", name: "Tampilan", description: "Jalur sinyal tampilan, monitor, dan GPU." },
  { code: "PERIPHERAL", name: "Periferal", description: "Printer, USB, keyboard, dan perangkat I/O." },
] as const;

export const CASES: SeedCase[] = [
  // ============================================================= C1
  {
    title: "Komputer Mati Total",
    scenario: "PC di ruang lab tidak bereaksi sama sekali: tidak ada LED pada casing, kipas mati, dan tidak ada bunyi beep.",
    skill: "POWER",
    difficulty: "EASY",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "PC di lab tidak bereaksi: tak ada LED, kipas mati, tak ada beep. Apa langkah pertama yang kamu lakukan?",
        detail: "Urutan POST dimulai dari suplai daya. Jika PSU tidak menerima arus, tidak ada komponen lain yang akan bereaksi.",
        options: [
          { label: "Periksa aliran daya dari stopkontak ke PSU", target: "n_daya", correct: true, feedback: "Benar — mulai dari sumber listrik." },
          { label: "Langsung ganti motherboard", target: "fail_ganti_board", correct: false, feedback: "Diagnosis tanpa bukti; periksa pasokan daya terlebih dahulu." },
          { label: "Periksa monitor", target: "fail_monitor", correct: false, feedback: "Gejala awal ada di CPU, bukan layar — monitor tidak menjelaskan LED mati total." },
        ],
      },
      {
        key: "n_daya", type: "DIAGNOSTIC", best: true,
        text: "Periksa steker AC ke PSU, steker ke stopkontak / ekstensi, dan pastikan semua rapat.",
        detail: "Kabel daya longgar adalah penyebab paling umum PC 'mati total' setelah dipindah.",
        options: [
          { label: "Ada steker longgar ditemukan", target: "n_pasang", correct: true, feedback: "Bagus — ini tersangka utama." },
          { label: "Semua sudah rapat", target: "n_outlet", correct: true, feedback: "Lanjutkan ke pengujian stopkontak." },
        ],
      },
      {
        key: "n_pasang", type: "ACTION", best: true,
        text: "Pasang ulang kabel dengan benar (CPU ↔ PSU ↔ stopkontak), lalu tekan tombol power casing.",
        detail: "Selalu pasang kabel sampai 'klik' terkunci. Jangan pernah memaksakan.",
        options: [
          { label: "PC menyala normal", target: "sol_daya", correct: true, feedback: "Koneksi listrik memang penyebabnya." },
          { label: "Masih mati", target: "n_outlet", correct: true, feedback: "Lanjut cek stopkontak." },
        ],
      },
      {
        key: "n_outlet", type: "DIAGNOSTIC", best: true,
        text: "Uji stopkontak/ekstensi dengan perangkat lain (charger HP atau lampu). Apakah ada arus listrik?",
        detail: "Cara cepat membedakan gangguan di stopkontak vs gangguan di komputer.",
        options: [
          { label: "Tidak ada arus listrik", target: "n_outlet2", correct: true, feedback: "Stopkontak gagal memasok daya." },
          { label: "Arus listrik normal", target: "n_switch", correct: true, feedback: "Pasokan dari dinding aman." },
        ],
      },
      {
        key: "n_outlet2", type: "ACTION", best: true,
        text: "Pindah ke stopkontak lain atau perbaiki MCB/ekstensi, lalu coba nyalakan PC.",
        detail: "Jika lokasi sering mati listrik, pertimbangkan UPS.",
        options: [
          { label: "PC menyala normal", target: "sol_outlet", correct: true, feedback: "Masalah ada di outlet/ekstensi." },
          { label: "Masih mati", target: "n_switch", correct: true, feedback: "Lanjut ke sisi PSU." },
        ],
      },
      {
        key: "n_switch", type: "DIAGNOSTIC", best: true,
        text: "Periksa saklar ON/OFF di belakang PSU. Pastikan dalam posisi ON (I).",
        detail: "Saklar PSU sering tertekan saat pemindahan perangkat.",
        options: [
          { label: "Saklar terlihat OFF", target: "n_nyala", correct: true, feedback: "Tersangka ditemukan." },
          { label: "Saklar sudah ON", target: "n_led", correct: true, feedback: "Lanjut periksa indikator PSU." },
        ],
      },
      {
        key: "n_nyala", type: "ACTION", best: true,
        text: "Nyalakan saklar PSU ke posisi ON, lalu tekan tombol power pada casing.",
        options: [
          { label: "PC menyala", target: "sol_switch", correct: true, feedback: "Saklar memang penyebabnya." },
          { label: "Tidak menyala", target: "n_led", correct: true, feedback: "Lanjut periksa LED PSU." },
        ],
      },
      {
        key: "n_led", type: "DIAGNOSTIC", best: true,
        text: "Periksa LED indikator pada PSU (beberapa model memilikinya) dan lampu motherboard.",
        detail: "LED PSU menyala berarti PSU menerima arus dan kemungkinan berfungsi.",
        options: [
          { label: "LED PSU / board menyala", target: "n_btn", correct: true, feedback: "Arus masuk normal — fokus ke tombol power / front panel." },
          { label: "LED PSU tidak menyala", target: "n_psu", correct: true, feedback: "PSU tidak menerima daya — tersangka PSU." },
        ],
      },
      {
        key: "n_btn", type: "DIAGNOSTIC", best: true,
        text: "Uji tombol power front panel. Kamu bisa melakukan short pin power (PW) pada header motherboard.",
        detail: "Kabel front panel sering lepas — beda antara 'kabel putus' vs 'case button rusak'.",
        options: [
          { label: "Kabel front panel putus/lepas", target: "n_panel", correct: true, feedback: "Kabel panel power memang sering lepas." },
          { label: "Short pin power → PC langsung nyala", target: "n_psu", correct: true, feedback: "Berarti tombol/panel case bermasalah atau ada isu PSU." },
        ],
      },
      {
        key: "n_panel", type: "ACTION", best: true,
        text: "Rakit ulang kabel front panel dengan benar (perhatikan label PW, RESET, HD LED), lalu nyalakan.",
        options: [
          { label: "PC menyala normal", target: "sol_panel", correct: true, feedback: "Kabel front panel yang beres." },
          { label: "Tidak menyala", target: "n_psu", correct: true, feedback: "Lanjut uji PSU." },
        ],
      },
      {
        key: "n_psu", type: "ACTION", best: true,
        text: "Lakukan tes minimal: motherboard + PSU + RAM di luar casing. Jika hidup → PSU lama bermasalah saat dibebani; ganti PSU.",
        detail: "Tes bare minimum (paperclip test / jembatan PSU + komponen minimal) mengisolasi penyebab.",
        options: [
          { label: "PC hidup dengan PSU lain / tes minimal", target: "sol_psu", correct: true, feedback: "PSU usang/lemah — ganti dengan yang berkualitas." },
          { label: "Tetap mati total", target: "fail_board", correct: false, feedback: "PSU bukan penyebab — kemungkinan besar motherboard atau CPU." },
        ],
      },
      { key: "sol_daya", type: "SOLUTION", best: true, text: "Solusi: koneksi daya dipulihkan — PC menyala normal." },
      { key: "sol_outlet", type: "SOLUTION", best: true, text: "Solusi: outlet/ekstensi diganti — PC menyala." },
      { key: "sol_switch", type: "SOLUTION", best: true, text: "Solusi: saklar PSU dinegatifkan — PC menyala." },
      { key: "sol_panel", type: "SOLUTION", best: true, text: "Solusi: kabel front panel diperbaiki — tombol power berfungsi." },
      { key: "sol_psu", type: "SOLUTION", best: true, text: "Solusi: PSU diganti dengan unit berkualitas — sistem hidup stabil." },
      { key: "fail_ganti_board", type: "FAIL", text: "Diagnosis tanpa bukti — kamu mengganti motherboard padahal daya belum dicek. Proses diagnostik harus bertahap." },
      { key: "fail_monitor", type: "FAIL", text: "Monitor tidak relevan: gejala 'LED mati total' berada di CPU/PSU, bukan pada layar." },
      { key: "fail_board", type: "FAIL", text: "Motherboard/CPU diduga rusak. Di sini diagnosis DIY berhenti — lanjutkan ke teknisi lab dengan membawa bukti tes." },
    ],
  },

  // ============================================================= C2
  {
    title: "PC Mati Setelah Dipindah Lokasi",
    scenario: "PC kemarin bekerja normal, lalu dipindah ke meja lain. Kini tidak menyala sama sekali.",
    skill: "POWER",
    difficulty: "EASY",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "PC baru dipindah lokasi; sejak itu tidak menyala padahal sebelumnya normal. Dari mana kamu mulai?",
        detail: "Komponen yang 'copot' saat perpindahan = penyebab #1.",
        options: [
          { label: "Cek ulang semua kabel (daya, VGA, RAM seating)", target: "n_kabel", correct: true, feedback: "Tepat — perpindahan sering melonggarkan kabel." },
          { label: "Langsung ganti PSU baru", target: "fail_psu", correct: false, feedback: "Belum ada bukti PSU rusak — lakukan secara bertahap." },
          { label: "Instal ulang OS", target: "fail_os", correct: false, feedback: "Perangkat tidak menyala, jadi sistem operasi bukan penyebabnya." },
        ],
      },
      {
        key: "n_kabel", type: "DIAGNOSTIC", best: true,
        text: "Cabut dan pasang ulang kabel daya, kabel VGA/HDMI, dan pastikan RAM terkunci. Perhatikan jika ada kabel longgar.",
        options: [
          { label: "Ada kabel longgar ditemukan", target: "n_kencang", correct: true, feedback: "Tersangka utama ditemukan." },
          { label: "Semua sudah rapat", target: "n_tegangan", correct: true, feedback: "Lanjut ke tegangan." },
        ],
      },
      {
        key: "n_kencang", type: "ACTION", best: true,
        text: "Pasang ulang semua kabel sampai rapat, tekan tombol power.",
        options: [
          { label: "PC menyala normal", target: "sol_pindah", correct: true, feedback: "Ya — kabel longgar saat dipindah." },
          { label: "Masih tidak menyala", target: "n_tegangan", correct: true, feedback: "Lanjut periksa sumber listrik." },
        ],
      },
      {
        key: "n_tegangan", type: "DIAGNOSTIC", best: true,
        text: "Cek saklar & coba stopkontak lain. Lokasi meja baru bisa memiliki outlet bermasalah.",
        options: [
          { label: "Stopkontak bermasalah", target: "n_outlet", correct: true, feedback: "Out, lokasi baru punya masalah listrik." },
          { label: "Stopkontak normal", target: "n_beep", correct: true, feedback: "Lanjut observasi sinyal POST." },
        ],
      },
      {
        key: "n_outlet", type: "ACTION", best: true,
        text: "Pindah ke outlet lain / perbaiki ekstensi, nyalakan PC.",
        options: [
          { label: "PC menyala normal", target: "sol_outlet2", correct: true, feedback: "Masalah di outlet meja bawah." },
          { label: "Tidak menyala", target: "n_beep", correct: true, feedback: "Lanjut observasi POST." },
        ],
      },
      {
        key: "n_beep", type: "DIAGNOSTIC", best: true,
        text: "Perhatikan bunyi beep (buzzer motherboard) dan kode LED. Informasi ini menunjukkan komponen gagal POST.",
        options: [
          { label: "Ada beep / kode LED", target: "n_reseat", correct: true, feedback: "Kode beep memandu komponen yang bermasalah (biasanya RAM/VGA)." },
          { label: "Tidak ada tanda sama sekali", target: "n_psu2", correct: true, feedback: "Tanda kosong = suplai daya paling dicurigai." },
        ],
      },
      {
        key: "n_reseat", type: "ACTION", best: true,
        text: "Reseat RAM & VGA (keluarkan, pasang ulang terkunci), nyalakan.",
        options: [
          { label: "PC menyala normal", target: "sol_pindah", correct: true, feedback: "RAM/VGA melonggar saat perpindahan." },
          { label: "Tetap tidak menyala", target: "n_psu2", correct: true, feedback: "Lanjut uji PSU." },
        ],
      },
      {
        key: "n_psu2", type: "ACTION", best: true,
        text: "Uji dengan PSU lain yang diketahui bagus (atau PSU stok lab).",
        options: [
          { label: "PC menyala normal", target: "sol_psu2", correct: true, feedback: "PSU gagal saat dipindah — ganti." },
          { label: "Tetap mati", target: "fail_board2", correct: false, feedback: "PSU bukan pelakunya — mother/CPU suspect. Ke teknisi." },
        ],
      },
      { key: "sol_pindah", type: "SOLUTION", best: true, text: "Solusi: komponen dipasang kembali rapi — PC normal." },
      { key: "sol_outlet2", type: "SOLUTION", best: true, text: "Solusi: outlet diganti — PC menyala." },
      { key: "sol_psu2", type: "SOLUTION", best: true, text: "Solusi: PSU diganti — sistem hidup normal." },
      { key: "fail_psu", type: "FAIL", text: "Kamu menebak mengganti PSU tanpa diagnosis. Proses yang benar bertahap dan hemat biaya." },
      { key: "fail_os", type: "FAIL", text: "Menginstal ulang OS saat perangkat mati total — penyebab pasti di level daya, bukan software." },
      { key: "fail_board2", type: "FAIL", text: "Tetap mati setelah PSU diganti → motherboard/CPU suspect. PHP: lanjutkan ke teknisi." },
    ],
  },

  // ============================================================= C3
  {
    title: "PC Restart Sendiri Saat Dipakai",
    scenario: "Komputer bekerja normal beberapa menit, lalu restart sendiri (atau bluescreen) terutama saat bermain game / render.",
    skill: "POWER",
    difficulty: "MEDIUM",
    targetSteps: 6,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "PC restart sendiri setelah 10–20 menit, terutama saat beban tinggi. Dari mana mulai mendiagnosis?",
        options: [
          { label: "Cek suhu CPU & kipas", target: "n_suhu", correct: true, feedback: "Benar — panas adalah penyebab restart paling umum saat beban." },
          { label: "Langsung ganti RAM", target: "fail_ram3", correct: false, feedback: "Restart di beban lebih sering panas/PSU — cek suhu dulu." },
        ],
      },
      {
        key: "n_suhu", type: "DIAGNOSTIC", best: true,
        text: "Pantau suhu CPU/GPU (BIOS / HWiNFO / CoreTemp). Periksa debu pada heatsink, kipas, dan aliran udara case.",
        detail: "Thermal shutdown terjadi saat CPU melampaui suhu kritis — sistem sengaja mati demi melindungi komponen.",
        options: [
          { label: "Overheat (suhu > 90°C saat idle/beban)", target: "n_bersih", correct: true, feedback: "Thermal throttling / shutdown." },
          { label: "Suhu normal", target: "n_psu3", correct: true, feedback: "Lanjut periksa PSU." },
        ],
      },
      {
        key: "n_bersih", type: "ACTION", best: true,
        text: "Bersihkan kipas & heatsink dari debu, pastikan fan berputar, ganti thermal paste bila perlu. Nyalakan dan uji > 30 menit.",
        detail: "Matikan listrik & gunakan anti-statik sebelum bekerja di dalam casing.",
        options: [
          { label: "Stabil lebih dari 30 menit", target: "sol_panas", correct: true, feedback: "Pendinginan memang biang keroknya." },
          { label: "Masih restart", target: "n_psu3", correct: true, feedback: "Lanjut cek PSU." },
        ],
      },
      {
        key: "n_psu3", type: "DIAGNOSTIC", best: true,
        text: "Gejala 'restart saat beban' + PSU tua/murah = kecurigaan PSU tidak sanggup. Uji dengan PSU lain, periksa kapasitor bengkak.",
        detail: "PSU yang tidak stabil memutus daya saat konsumsi naik.",
        options: [
          { label: "Cocok dengan PSU lemah/tua", target: "n_ganti_psu3", correct: true, feedback: "PSU tersangka utama." },
          { label: "Bukan PSU", target: "n_event", correct: true, feedback: "Lanjut ke analisis event log." },
        ],
      },
      {
        key: "n_ganti_psu3", type: "ACTION", best: true,
        text: "Ganti PSU dengan kapasitas yang cukup & bersertifikat. Uji stabilitas.",
        options: [
          { label: "Stabil, tidak restart lagi", target: "sol_psu3", correct: true, feedback: "PSU memang penyebab." },
          { label: "Masih restart", target: "n_event", correct: true, feedback: "PSU bukan masalah utama." },
        ],
      },
      {
        key: "n_event", type: "DIAGNOSTIC", best: true,
        text: "Cek Event Viewer: pattern 'Kernel-Power 41 (Kritikal)' tanpa pola. Jalankan memtest (RAM) untuk pelengkap.",
        detail: "Kernel-Power 41 berarti sistem mati tanpa nyenggol shutdown normal.",
        options: [
          { label: "RAM error di memtest", target: "n_ram3", correct: true, feedback: "RAM buruk bisa sebabkan crash acak." },
          { label: "RAM OK & pola acak", target: "n_ganti_psu3", correct: true, feedback: "Kembali ke PSU — pola tanpa sebab jelas sering PSU/board." },
        ],
      },
      {
        key: "n_ram3", type: "ACTION", best: true,
        text: "Ganti modul RAM yang error, uji stabilitas.",
        options: [
          { label: "Stabil, tidak restart", target: "sol_ram3", correct: true, feedback: "RAM rusak diganti." },
        ],
      },
      { key: "sol_panas", type: "SOLUTION", best: true, text: "Solusi: pendinginan diperbaiki — suhu normal dan stabil." },
      { key: "sol_psu3", type: "SOLUTION", best: true, text: "Solusi: PSU diganti — tidak ada restart lagi." },
      { key: "sol_ram3", type: "SOLUTION", best: true, text: "Solusi: RAM rusak diganti — sistem stabil." },
      { key: "fail_ram3", type: "FAIL", text: "Mengganti RAM tanpa memeriksa suhu — penyebab sebenarnya (panas) dibiarkan, kerusakan bisa permanen." },
    ],
  },

  // ============================================================= C4
  {
    title: "Matikan Saat Listrik Naik-Turun",
    scenario: "Di daerahmu listrik sering padam dan naik-turun. PC mati mendadak dan dua perangkat elektronik pernah rusak.",
    skill: "POWER",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "PC mati mendadak saat listrik naik-turun; beberapa perangkat pernah rusak. Apa rencana terbaik?",
        options: [
          { label: "Uji kestabilan tegangan & amati kedip lampu", target: "n_teg4", correct: true, feedback: "Tepat — verifikasi dulu kualitas pasokan." },
          { label: "Langsung ganti PSU lebih besar", target: "fail_psu4", correct: false, feedback: "PSU besar tidak menahan surge; proteksi perlu berlapis." },
        ],
      },
      {
        key: "n_teg4", type: "DIAGNOSTIC", best: true,
        text: "Ukur voltase (multimeter) jika bisa; amati lampu kedip saat AC / mesin hidup. Fluktuasi = penyebab paling masuk akal.",
        options: [
          { label: "Fluktuasi terdeteksi", target: "n_ups", correct: true, feedback: "Pasokan tidak stabil — butuh stabilizer/UPS." },
          { label: "Tegangan terlihat stabil", target: "n_psu4", correct: true, feedback: "Fokus ke kualitas PSU." },
        ],
      },
      {
        key: "n_ups", type: "ACTION", best: true,
        text: "Pasang UPS (dengan AVR) agar tegangan stabil dan PC mendapat shutdown bersih saat mati listrik.",
        detail: "UPS menangani surge/spike yang merusak PSU dan elektronik.",
        options: [
          { label: "Selesai: PC aman & ada shutdown bersih", target: "sol_ups", correct: true, feedback: "Proteksi pasokan terselesaikan." },
          { label: "Sudah ada UPS?", target: "n_psu4", correct: true, feedback: "Periksa kualitas PSU juga." },
        ],
      },
      {
        key: "n_psu4", type: "DIAGNOSTIC", best: true,
        text: "PSU kelas standar rentan terhadap surge. Kombinasikan PSU bersertifikat proteksi + stabilizer/UPS.",
        options: [
          { label: "Ganti ke PSU berkualitas (80+ / proteksi surge)", target: "n_psu4b", correct: true, feedback: "Lindungi komponen dari gangguan daya berlapis." },
        ],
      },
      {
        key: "n_psu4b", type: "ACTION", best: true,
        text: "Pasang PSU baru yang lebih aman; pastikan sambungan listrik rumah tidak overload.",
        options: [
          { label: "Selesai: PC stabil di tengah fluktuasi", target: "sol_ups", correct: true, feedback: "Perlindungan daya berlapis terpasang." },
        ],
      },
      { key: "sol_ups", type: "SOLUTION", best: true, text: "Solusi: UPS/AVR + PSU berkualitas — PC tahan fluktuasi listrik." },
      { key: "fail_psu4", type: "FAIL", text: "PSU besar bukan pengganti proteksi. Sumber fluktuasi tetap ada dan perangkat lain masih berisiko." },
    ],
  },

  // ============================================================= C5
  {
    title: "Windows Loop 'Preparing Automatic Repair'",
    scenario: "Saat boot, Windows menampilkan logo kemudian kembali ke layar 'Preparing Automatic Repair' secara berulang.",
    skill: "BOOT",
    difficulty: "MEDIUM",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Logo Windows berputar lalu kembali ke layar auto repair — berulang. Langkah pertama yang tepat?",
        options: [
          { label: "Masuk ke Advanced Startup Options", target: "n_adv", correct: true, feedback: "Tepat — boot ke media recovery/rescue." },
          { label: "Biarkan restart berulang", target: "fail_loop", correct: false, feedback: "Loop tidak akan selesai sendiri; butuh intervensi." },
          { label: "Cabut semua komponen", target: "fail_cek", correct: false, feedback: "Bukan pendekatan yang tepat di fase boot." },
        ],
      },
      {
        key: "n_adv", type: "ACTION", best: true,
        text: "Tekan F8/Shift+Restart dari layar boot (atau RecoveryUSB) → pilih Troubleshoot.",
        options: [
          { label: "Coba Startup Repair dulu", target: "n_repair", correct: true, feedback: "Mulai dari perbaikan otomatis." },
          { label: "Langsung ke Safe Mode / uninstall update", target: "n_safe", correct: true, feedback: "Lompat ke mengatasi penyebab rutin (update/driver)." },
        ],
      },
      {
        key: "n_repair", type: "DIAGNOSTIC", best: true,
        text: "Jalankan Startup Repair. Apakah Windows kembali normal?",
        options: [
          { label: "Ya, booting normal", target: "sol_repair", correct: true, feedback: "Perbaikan otomatis berhasil." },
          { label: "Tidak", target: "n_safe", correct: true, feedback: "Lanjut pendekatan manual." },
        ],
      },
      {
        key: "n_safe", type: "ACTION", best: true,
        text: "Boot ke Safe Mode / Command Prompt (recovery). Pilih langkah berikut.",
        options: [
          { label: "Jalankan verifikasi file sistem (SFC)", target: "n_sfc", correct: true, feedback: "Memeriksa korupsi file sistem." },
          { label: "Uninstall update/driver terakhir (System Restore)", target: "n_uninstall", correct: true, feedback: "Penyebab umum loop = update membandel." },
        ],
      },
      {
        key: "n_sfc", type: "ACTION", best: true,
        text: "Pada CMD jalankan: sfc /scannow kemudian DISM /Online /Cleanup-Image /RestoreHealth.",
        detail: "SFC memperbaiki file sistem yang korup; DISM menangani image sistem.",
        options: [
          { label: "Berhasil, boot normal", target: "sol_sfc", correct: true, feedback: "File sistem pulih." },
          { label: "Tetap tidak bisa boot", target: "n_uninstall", correct: true, feedback: "Lanjut ke update/restore." },
        ],
      },
      {
        key: "n_uninstall", type: "ACTION", best: true,
        text: "Uninstall Windows update terakhir atau kembalikan via System Restore ke titik sebelum masalah.",
        options: [
          { label: "Boot normal", target: "sol_uninstall", correct: true, feedback: "Update membandel tersingkir." },
          { label: "Masih gagal", target: "n_recovery", correct: true, feedback: "Lanjut reinstall." },
        ],
      },
      {
        key: "n_recovery", type: "ACTION", best: true,
        text: "Terakhir: reinstall/reset Windows dari media recovery — pastikan data sudah di-backup.",
        options: [
          { label: "Instal ulang selesai, normal", target: "sol_fresh5", correct: true, feedback: "OS segar kembali normal." },
          { label: "Instal ulang tetap gagal", target: "fail_disk5", correct: false, feedback: "Kecurigaan kerusakan media/disk — periksa SMART." },
        ],
      },
      { key: "sol_repair", type: "SOLUTION", best: true, text: "Solusi: Startup Repair berhasil — booting normal." },
      { key: "sol_sfc", type: "SOLUTION", best: true, text: "Solusi: file sistem diperbaiki via SFC/DISM." },
      { key: "sol_uninstall", type: "SOLUTION", best: true, text: "Solusi: update/sistem restore berhasil diselesaikan." },
      { key: "sol_fresh5", type: "SOLUTION", best: true, text: "Solusi: instal ulang bersih — OS kembali normal." },
      { key: "fail_loop", type: "FAIL", text: "Menunggu loop berulang tanpa intervensi — waktu terbuang; sistem tak akan memperbaiki diri." },
      { key: "fail_cek", type: "FAIL", text: "Menggali komponen tanpa diagnosis atas gejala di fase boot — riziko error makin besar." },
      { key: "fail_disk5", type: "FAIL", text: "Instal ulang gagal → kecurigaan disk/media. Periksa SMART & boot device." },
    ],
  },

  // ============================================================= C6
  {
    title: "BSOD 0x0000007B INACCESSIBLE_BOOT_DEVICE",
    scenario: "Setelah restart, Windows menampilkan blue screen dengan kode 0x0000007B dan gagal masuk OS.",
    skill: "BOOT",
    difficulty: "HARD",
    targetSteps: 6,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "BSOD muncul saat boot dengan kode 0x0000007B (INACCESSIBLE_BOOT_DEVICE). Strategi diagnosis?",
        detail: "Kode ini artinya Windows tidak dapat mengakses partisi boot.",
        options: [
          { label: "Identifikasi kode & fase kemunculan BSOD", target: "n_id", correct: true, feedback: "Fase (sebelum/sesudah logo) sangat informatif." },
          { label: "Format ulang langsung", target: "fail_format6", correct: false, feedback: "Format tanpa diagnosis — data berisiko & sering GAGAL jika disk rusak." },
        ],
      },
      {
        key: "n_id", type: "DIAGNOSTIC", best: true,
        text: "Catat kapan BSOD muncul & apakah ada perubahan terkini (biOS settings, instalasi, driver).",
        options: [
          { label: "Kuat dugaan mode SATA (IDE/AHCI) di BIOS", target: "n_bios", correct: true, feedback: "Ubah mode ATA sering jadi pemicu 7B." },
          { label: "Gejala lain (setelah install aplikasi/driver)", target: "n_storage", correct: true, feedback: "Lanjut periksa storage." },
        ],
      },
      {
        key: "n_bios", type: "DIAGNOSTIC", best: true,
        text: "Masuk BIOS, periksa pengaturan SATA controller (IDE/AHCI/RAID) dan urutan boot.",
        options: [
          { label: "Mode ATA tampak berubah / tidak wajar", target: "n_mode", correct: true, feedback: "Sesuaikan mode dengan sistem operasi yang terpasang." },
          { label: "Mode sudah benar", target: "n_storage", correct: true, feedback: "Bukan penyebab — lanjut storage." },
        ],
      },
      {
        key: "n_mode", type: "ACTION", best: true,
        text: "Set mode SATA sesuai kebutuhan (mis. AHCI) via BIOS, simpan & restart. (condition hanya aktif bila mode != AHCI)",
        options: [
          { label: "Boot normal", target: "sol_mode6", correct: true, feedback: "Mode ATA keliru memang pemicunya." },
          { label: "Masih BSOD", target: "n_storage", correct: true, feedback: "Lanjut periksa storage." },
        ],
      },
      {
        key: "n_storage", type: "DIAGNOSTIC", best: true,
        text: "Periksa kabel SATA, port, urutan boot, dan kesehatan disk (SMART) di BIOS/fel DPS.",
        options: [
          { label: "Kabel SATA longgar / port salah", target: "n_sata", correct: true, feedback: "Koneksi fisik boot device." },
          { label: "SMART menunjukkan disk buruk", target: "n_media", correct: true, feedback: "Media mulai gagal." },
          { label: "Semuanya terlihat OK", target: "n_bootrec", correct: true, feedback: "Lanjut perbaikan boot manager." },
        ],
      },
      {
        key: "n_sata", type: "ACTION", best: true,
        text: "Pasang ulang / ganti kabel SATA dan port lain. Restart.",
        options: [
          { label: "Boot normal", target: "sol_sata6", correct: true, feedback: "Kabel memang sejak awal jadi masalah." },
          { label: "Masih BSOD", target: "n_media", correct: true, feedback: "Lanjut cek media." },
        ],
      },
      {
        key: "n_media", type: "ACTION", best: true,
        text: "Disk suspect: backup/kloning data dulu, ganti drive yang sehat.",
        options: [
          { label: "Drive baru / kloning — boot normal", target: "sol_media6", correct: true, feedback: "Disk lama memang rusak." },
        ],
      },
      {
        key: "n_bootrec", type: "ACTION", best: true,
        text: "Jalankan dari media recovery: bootrec /fixmbr, /fixboot, /rebuildbcd.",
        options: [
          { label: "Boot normal", target: "sol_bootrec6", correct: true, feedback: "MBR/BCD diperbaiki." },
          { label: "Masih BSOD", target: "n_media", correct: true, feedback: "Masalah lebih dalam — disk/OS corrupt." },
        ],
      },
      { key: "sol_mode6", type: "SOLUTION", best: true, text: "Solusi: mode SATA diperbaiki — boot normal." },
      { key: "sol_sata6", type: "SOLUTION", best: true, text: "Solusi: kabel/port SATA diperbaiki — boot normal." },
      { key: "sol_media6", type: "SOLUTION", best: true, text: "Solusi: media drive diganti — sistem normal." },
      { key: "sol_bootrec6", type: "SOLUTION", best: true, text: "Solusi: boot record diperbaiki — boot normal." },
      { key: "fail_format6", type: "FAIL", text: "Format ulang tanpa diagnosis. Jika disk memang rusak, instalasi juga akan gagal — diagnosis selalu dulu." },
    ],
  },

  // ============================================================= C7
  {
    title: "Gagal Boot Setelah Install Driver Baru",
    scenario: "Setelah menginstal driver GPU/chipset baru, Windows tidak mau boot (layar hitam saat logo atau loading berulang).",
    skill: "BOOT",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Setelah instal driver baru, Windows gagal boot (layar hitam / loading melingkar). Mulai dari mana?",
        options: [
          { label: "Boot Safe Mode", target: "n_safe", correct: true, feedback: "Safe Mode menonaktifkan driver bermasalah." },
          { label: "Install ulang OS langsung", target: "fail_instal7", correct: false, feedback: "Rollback driver jauh lebih ringan & biasanya cukup." },
        ],
      },
      {
        key: "n_safe", type: "ACTION", best: true,
        text: "Masuk Safe Mode: Shift+Restart pada layar login → Troubleshoot → Safe Mode (atau F8).",
        options: [
          { label: "Berhasil masuk Safe Mode", target: "n_dev", correct: true, feedback: "Driver tidak di-load di Safe Mode." },
          { label: "Tidak bisa masuk", target: "n_restore", correct: true, feedback: "Langsung ke System Restore." },
        ],
      },
      {
        key: "n_dev", type: "DIAGNOSTIC", best: true,
        text: "Buka Device Manager → cari device yang baru saja di-update (GPU/NIC/Chipset).",
        options: [
          { label: "Driver teridentifikasi", target: "n_rollback", correct: true, feedback: "Rollback/uninstall driver tersebut." },
          { label: "Tidak tahu driver mana", target: "n_restore", correct: true, feedback: "Gunakan System Restore." },
        ],
      },
      {
        key: "n_rollback", type: "ACTION", best: true,
        text: "Rollback driver (properties → Driver → Roll Back Driver) atau uninstall-nya, lalu restart normal.",
        options: [
          { label: "Boot normal", target: "sol_rollback7", correct: true, feedback: "Driver baru memang konflik." },
          { label: "Masih gagal boot", target: "n_restore", correct: true, feedback: "Restore ke titik lama." },
        ],
      },
      {
        key: "n_restore", type: "ACTION", best: true,
        text: "System Restore ke titik restore sebelum instalasi driver.",
        options: [
          { label: "Boot normal", target: "sol_restore7", correct: true, feedback: "Titik restore memulihkan sistem." },
          { label: "Gagal / tidak otomatis tersedia", target: "n_instal", correct: true, feedback: "Perhentian terakhir." },
        ],
      },
      {
        key: "n_instal", type: "ACTION", best: true,
        text: "Instal ulang / reset Windows dari media recovery (backup data dulu).",
        options: [
          { label: "System normal kembali", target: "sol_fresh7", correct: true, feedback: "Instalali bersih menyelesaikan." },
        ],
      },
      { key: "sol_rollback7", type: "SOLUTION", best: true, text: "Solusi: driver di-rollback — boot normal." },
      { key: "sol_restore7", type: "SOLUTION", best: true, text: "Solusi: System Restore — sistem pulih." },
      { key: "sol_fresh7", type: "SOLUTION", best: true, text: "Solusi: instal ulang — sistem bersih & normal." },
      { key: "fail_instal7", type: "FAIL", text: "Langsung instal ulang OS saat rollback satu driver sudah cukup — waktu & data terbuang." },
    ],
  },

  // ============================================================= C8
  {
    title: "Beep 1 Panjang + 3 Pendek (RAM)",
    scenario: "Saat dinyalakan, PC membunyikan beep (1 panjang, 3 pendek) dan layar tetap hitam / tidak melakukan POST lengkap.",
    skill: "BOOT",
    difficulty: "EASY",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Terjadi 1 beep panjang + 3 pendek dan layar hitam. Kode ini pada banyak motherboard menandakan masalah RAM. Tindakan pertama?",
        options: [
          { label: "Reseat RAM & bersihkan slot", target: "n_reseat", correct: true, feedback: "Seating / kotoran adalah penyebab #1." },
          { label: "Langsung ganti RAM tanpa reseat", target: "fail_rtg", correct: false, feedback: "Periksa pemasangan dulu — mahal dan sering sia-sia." },
        ],
      },
      {
        key: "n_reseat", type: "ACTION", best: true,
        text: "Cabut modul RAM, tiup/bersihkan slot dan komponen emas (jangan sentuh langsung), pasang kembali hingga terkunci.",
        detail: "Matikan & cabut daya dulu. Gunakan gelang anti-statik bila ada.",
        options: [
          { label: "POST normal, PC boot", target: "sol_seat", correct: true, feedback: "Seating memang biang kerok." },
          { label: "Masih beep", target: "n_uji", correct: true, feedback: "Lanjut tes per modul." },
        ],
      },
      {
        key: "n_uji", type: "DIAGNOSTIC", best: true,
        text: "Tes satu modul pada satu slot. Jalankan memtest untuk menilai kesehatan masing-masing stik.",
        options: [
          { label: "Modul rusak ditemukan", target: "n_ganti", correct: true, feedback: "Stik gagal." },
          { label: "Semua stik normal tapi tetap beep", target: "n_slot", correct: true, feedback: "Kemungkinan di slot/board." },
        ],
      },
      {
        key: "n_ganti", type: "ACTION", best: true,
        text: "Ganti modul RAM yang error (perhatikan jenis & kecepatan yang didukung motherboard).",
        options: [
          { label: "POST OK, boot normal", target: "sol_ram8", correct: true, feedback: "RAM rusak diganti." },
        ],
      },
      {
        key: "n_slot", type: "ACTION", best: true,
        text: "Coba slot lain; jika tetap, kemungkinan slot/board rusak — bawa ke lab dengan bukti tes.",
        options: [
          { label: "Pindah slot berhasil", target: "sol_slot8", correct: true, feedback: "Slot lama memang rusak." },
        ],
      },
      { key: "sol_seat", type: "SOLUTION", best: true, text: "Solusi: RAM dipasang ulang — POST normal." },
      { key: "sol_ram8", type: "SOLUTION", best: true, text: "Solusi: modul RAM rusak diganti — boot normal." },
      { key: "sol_slot8", type: "SOLUTION", best: true, text: "Solusi: slot/board jadi penyebab; gunakan slot yang sehat." },
      { key: "fail_rtg", type: "FAIL", text: "Mengganti RAM tanpa reseat — masalah seating yang murah justru terlewat." },
    ],
  },

  // ============================================================= C9
  {
    title: "WiFi Tersambung tapi Internet Tidak Jalan",
    scenario: "Laptop terhubung ke WiFi (sinyal penuh) namun browser tidak bisa memuat situs apa pun.",
    skill: "NETWORK",
    difficulty: "MEDIUM",
    targetSteps: 6,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "WiFi connect penuh tapi tidak ada akses internet. Pendekatan yang benar?",
        options: [
          { label: "Diagnosa berjenjang (PING gateway → DNS → internet)", target: "n_osi", correct: true, feedback: "Model berlapis — mulai dari bagian terdekat." },
          { label: "Format ulang laptop", target: "fail_format9", correct: false, feedback: "Terlalu cepat; periksa konfigurasi jaringan dulu." },
        ],
      },
      {
        key: "n_osi", type: "DIAGNOSTIC", best: true,
        text: "Buka CMD: ipconfig → ping IP gateway → ping 8.8.8.8 → nslookup google.com.",
        detail: "Hasil berlapis memisah masalah: koneksi ke router vs DNS vs ISP.",
        options: [
          { label: "Gateway tidak bisa di-ping", target: "n_router", correct: true, feedback: "Masalah antara PC dan router." },
          { label: "Ping IP OK, DNS gagal", target: "n_dns", correct: true, feedback: "Tersangka : DNS." },
          { label: "Semua PING OK tapi web tetap gagal", target: "n_app", correct: true, feedback: "Masalah di lapis aplikasi/proxy." },
        ],
      },
      {
        key: "n_router", type: "DIAGNOSTIC", best: true,
        text: "Periksa lampu status router (WAN) dan coba perangkat lain di jaringan yang sama.",
        options: [
          { label: "ISP/WAN sedang down", target: "n_isp", correct: true, feedback: "Gangguan pada penyedia." },
          { label: "Router bermasalah", target: "n_restart", correct: true, feedback: "Coba power cycle." },
        ],
      },
      {
        key: "n_restart", type: "ACTION", best: true,
        text: "Power cycle router (matikan 30 detik, nyalakan), tunggu WAN light menyala.",
        options: [
          { label: "Internet pulih", target: "sol_router9", correct: true, feedback: "Router macet adalah biangnya." },
        ],
      },
      {
        key: "n_isp", type: "ACTION", best: true,
        text: "Hubungi ISP: cek gangguan area / tagihan / berlaku masa aktif.",
        options: [
          { label: "Pulih setelah penanganan ISP", target: "sol_router9", correct: true, feedback: "Outage pihak ISP memang ada." },
        ],
      },
      {
        key: "n_dns", type: "ACTION", best: true,
        text: "Set DNS publik di adapter (8.8.8.8 / 1.1.1.1), lalu ncflush (ipconfig /flushdns).",
        options: [
          { label: "Internet jalan", target: "sol_dns9", correct: true, feedback: "DNS server router memang lambat/gagal." },
          { label: "Masih gagal", target: "n_app", correct: true, feedback: "Lanjut lapis aplikasi." },
        ],
      },
      {
        key: "n_app", type: "DIAGNOSTIC", best: true,
        text: "Periksa proxy/VPN aktif, cache DNS browser, dan pengaturan IE/proxy Windows.",
        options: [
          { label: "Proxy/VPN penyebab", target: "n_proxy", correct: true, feedback: "Matikan proxy/VPN lalu uji." },
          { label: "Cache cookies/dns rusak", target: "n_cache", correct: true, feedback: "Flush & reset browser." },
        ],
      },
      {
        key: "n_proxy", type: "ACTION", best: true,
        text: "Matikan VPN/proxy (Settings → Network → Proxy 'off'), uji kembali.",
        options: [{ label: "Web normal", target: "sol_app9", correct: true, feedback: "Proxy/VPN memang jalan buntu." }],
      },
      {
        key: "n_cache", type: "ACTION", best: true,
        text: "Bersihkan cache DNS browser & nonaktifkan sementara ekstensi/quic.",
        options: [{ label: "Web normal", target: "sol_app9", correct: true, feedback: "State aplikasi beres." }],
      },
      { key: "sol_router9", type: "SOLUTION", best: true, text: "Solusi: koneksi router/ISP dipulihkan — internet normal." },
      { key: "sol_dns9", type: "SOLUTION", best: true, text: "Solusi: DNS publik dipasang — situs termuat." },
      { key: "sol_app9", type: "SOLUTION", best: true, text: "Solusi: konfigurasi proxy/cache dibersihkan — internet normal." },
      { key: "fail_format9", type: "FAIL", text: "Format ulang padahal masalah jaringan — data hilang, masalah tetap." },
    ],
  },

  // ============================================================= C10
  {
    title: "LAN Tidak Mendapatkan IP (APIPA)",
    scenario: "Kabel LAN terpasang (LED nyala) tetapi ipconfig menunjukkan IP 169.254.x.x — tidak dapat alamat dari DHCP.",
    skill: "NETWORK",
    difficulty: "MEDIUM",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "LED LAN menyala tapi IP menunjukkan 169.254.x.x (APIPA). Langkah pertama?",
        options: [
          { label: "Cek kabel & LED port LAN", target: "n_led", correct: true, feedback: "Mulai dari lapis fisik." },
          { label: "Instal ulang driver NIC", target: "fail_drv10", correct: false, feedback: "Habiskan lapis konfigurasi dulu." },
        ],
      },
      {
        key: "n_led", type: "DIAGNOSTIC", best: true,
        text: "LED port menyala/kedip? Coba ganti kabel & pindah port switch.",
        options: [
          { label: "LED mati / kabel sudah rusak-rapuh", target: "n_kabel", correct: true, feedback: "Perapikan kabel fisik." },
          { label: "LED dan kabel OK", target: "n_sayap", correct: true, feedback: "Lanjut konfigurasi IP." },
        ],
      },
      {
        key: "n_kabel", type: "ACTION", best: true,
        text: "Ganti kabel / pindah port, perhatikan apakah LED jadi stabil.",
        options: [
          { label: "Dapat IP (DHCP success)", target: "sol_kabel10", correct: true, feedback: "Kabel fisik memang biang." },
          { label: "Tetap APIPA", target: "n_sayap", correct: true, feedback: "Lanjut konfigurasi." },
        ],
      },
      {
        key: "n_sayap", type: "DIAGNOSTIC", best: true,
        text: "Cek: DHCP client aktif? Ada setting static salah? VLAN/port switch terkunci? Jalankan 'ipconfig /release && /renew'.",
        options: [
          { label: "Setting static salah (bukan 'Obtain automatically')", target: "n_dhcp", correct: true, feedback: "Kembalikan pengambilan otomatis." },
          { label: "Port switch blocking / VLAN salah", target: "n_port", correct: true, feedback: "Coba port lain." },
          { label: "DHCP server tidak merespons", target: "n_server", correct: true, feedback: "Periksa router/server DHCP." },
        ],
      },
      {
        key: "n_dhcp", type: "ACTION", best: true,
        text: "Set adapter ke 'Obtain an IP address automatically' + 'Obtain DNS automatically'.",
        options: [{ label: "Dapat IP", target: "sol_dhcp10", correct: true, feedback: "Static salah memang penyebabnya." }],
      },
      {
        key: "n_port", type: "ACTION", best: true,
        text: "Pindah ke port lain / perbaiki konfigurasi VLAN member.",
        options: [{ label: "Dapat IP", target: "sol_port10", correct: true, feedback: "Port lama dikunci admin/switch." }],
      },
      {
        key: "n_server", type: "ACTION", best: true,
        text: "Restart router; pastikan DHCP server aktif & tersedia IP (scope belum habis).",
        options: [{ label: "Dapat IP", target: "sol_port10", correct: true, feedback: "DHCP server memang bermasalah." }],
      },
      { key: "sol_kabel10", type: "SOLUTION", best: true, text: "Solusi: kabel/port LAN diganti — IP didapat." },
      { key: "sol_dhcp10", type: "SOLUTION", best: true, text: "Solusi: mode DHCP otomatis dipulihkan." },
      { key: "sol_port10", type: "SOLUTION", best: true, text: "Solusi: port/VLAN/DHCP server beres — IP didapat." },
      { key: "fail_drv10", type: "FAIL", text: "Mengganti driver NIC padahal lapis fisik & konfigurasi belum diperiksa." },
    ],
  },

  // ============================================================= C11
  {
    title: "Perangkat Lama Gagal Connect WiFi",
    scenario: "Laptop/HP lama tidak bisa terhubung ke SSID router meski password benar; perangkat lain bisa terhubung.",
    skill: "NETWORK",
    difficulty: "HARD",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Perangkat lama tak terhubung ke SSID router, meski password benar. Mulai diagnosis?",
        options: [
          { label: "Cek pengaturan band WiFi di router", target: "n_band", correct: true, feedback: "Cek dulu pita frekuensi SSID." },
          { label: "Ganti password SSID", target: "fail_pw11", correct: false, feedback: "Sandi bukan akar — perangkat lain masuk." },
        ],
      },
      {
        key: "n_band", type: "DIAGNOSTIC", best: true,
        text: "Apakah SSID Anda hanya 5 GHz, atau band steering aktif memaksa ke 5 GHz? Perangkat lama sering hanya 2.4 GHz.",
        options: [
          { label: "SSID khusus 5GHz / band steering", target: "n_24", correct: true, feedback: "Tersangka utama ditemukan.", condition: { signal: "BAND", equals: "5GHz" } },
          { label: "Sudah dual band", target: "n_auth", correct: true, feedback: "Cek autentikasi." },
        ],
      },
      {
        key: "n_24", type: "ACTION", best: true,
        text: "Aktifkan SSID 2.4 GHz (atau matikan band steering), uji perangkat lama.",
        options: [{ label: "Terhubung!", target: "sol_band11", correct: true, feedback: "Pita 2.4 GHz memang yang didukung." }],
      },
      {
        key: "n_auth", type: "DIAGNOSTIC", best: true,
        text: "Periksa enkripsi: WPA3-only? MAC filter aktif? Karakter password (simbol/spasi) yang salah ketik?",
        options: [
          { label: "MAC filter aktif / tidak dikenal", target: "n_mac", correct: true, feedback: "Buka MAC filtering." },
          { label: "WPA3-only & perangkat lama", target: "n_mixed", correct: true, feedback: "Perangkat lama belum dukung WPA3." },
          { label: "Kemungkinan password salah", target: "n_pw", correct: true, feedback: "Set ulang password SSID." },
        ],
      },
      {
        key: "n_mac", type: "ACTION", best: true,
        text: "Matikan MAC filter atau daftarkan MAC perangkat ke whitelist.",
        options: [{ label: "Terhubung!", target: "sol_auth11", correct: true, feedback: "MAC filter memang menahan perangkat." }],
      },
      {
        key: "n_mixed", type: "ACTION", best: true,
        text: "Ubah mode ke WPA2/WPA3 mixed (jangan WPA3-only).",
        options: [{ label: "Terhubung!", target: "sol_auth11", correct: true, feedback: "Enkripsi lama memang tak didukung WPA3." }],
      },
      {
        key: "n_pw", type: "ACTION", best: true,
        text: "Set ulang / ketik ulang password SSID dengan benar (perhatikan case & simbol).",
        options: [{ label: "Terhubung!", target: "sol_auth11", correct: true, feedback: "Password yang benar menyelesaikan." }],
      },
      { key: "sol_band11", type: "SOLUTION", best: true, text: "Solusi: SSID 2.4 GHz aktif — perangkat lama tersambung." },
      { key: "sol_auth11", type: "SOLUTION", best: true, text: "Solusi: autentikasi (WPA/mixed/MAC/password) diperbaiki." },
      { key: "fail_pw11", type: "FAIL", text: "Ganti password padahal masalahnya bukan sandi — langkah tanpa diagnosis." },
    ],
  },

  // ============================================================= C12
  {
    title: "Internet Lambat Padahal Speedtest Bagus",
    scenario: "Web terasa berat, tapi speedtest menunjukkan bandwidth jatah besar. Pengguna lain di jaringan juga komplain.",
    skill: "NETWORK",
    difficulty: "MEDIUM",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Web lambat tapi speedtest bagus. Dari sisi mana mulai?",
        options: [
          { label: "Cek beban router & jumlah perangkat", target: "n_router", correct: true, feedback: "Periksa dulu jaringan sekitar." },
          { label: "Reset PC dulu", target: "fail_reset12", correct: false, feedback: "Periksa lapis jaringan/lingkungan dulu." },
        ],
      },
      {
        key: "n_router", type: "DIAGNOSTIC", best: true,
        text: "Periksa: banyak perangkat aktif? channel WiFi padat? QoS mati?",
        options: [
          { label: "Channel WiFi padat", target: "n_channel", correct: true, feedback: "Banyak SSID bertetangga satu channel." },
          { label: "Banyak perangkat / QoS mati", target: "n_qos", correct: true, feedback: "Bandwidth 'berebut'." },
          { label: "Semua terlihat normal", target: "n_local12", correct: true, feedback: "Fokus ke sisi lokal." },
        ],
      },
      {
        key: "n_channel", type: "ACTION", best: true,
        text: "Pindah channel WiFi 2.4 GHz (1/6/11), atau jadi 5 GHz kalau perangkat mendukung.",
        options: [{ label: "Web kembali cepat", target: "sol_ch12", correct: true, feedback: "Interferensi channel memang pelakunya." }],
      },
      {
        key: "n_qos", type: "ACTION", best: true,
        text: "Aktifkan QoS / batasi perangkat berat (streaming/game), uji di jam sibuk.",
        options: [{ label: "Web normal", target: "sol_qos12", correct: true, feedback: "Beres — bandwidth tertata." }],
      },
      {
        key: "n_local12", type: "DIAGNOSTIC", best: true,
        text: "Cek perangkat: proses latar (download/miner), cache DNS lambat, antivirus scan berat.",
        options: [
          { label: "Background download / virus", target: "n_bersih12", correct: true, feedback: "Bersihkan proses berat." },
          { label: "DNS terasa lambat", target: "n_dns12", correct: true, feedback: "Ganti DNS cepat." },
        ],
      },
      {
        key: "n_bersih12", type: "ACTION", best: true,
        text: "Matikan proses latar / scan malware, hentikan download besar saat browsing.",
        options: [{ label: "Web normal", target: "sol_local12", correct: true, feedback: "Proses lokal memang menyedot." }],
      },
      {
        key: "n_dns12", type: "ACTION", best: true,
        text: "Ganti DNS ke yang cepat (8.8.8.8 / 1.1.1.1) di router atau adapter.",
        options: [{ label: "Web normal", target: "sol_local12", correct: true, feedback: "DNS resolusi memang lambat." }],
      },
      { key: "sol_ch12", type: "SOLUTION", best: true, text: "Solusi: channel WiFi dioptimalkan — web cepat." },
      { key: "sol_qos12", type: "SOLUTION", best: true, text: "Solusi: QoS/bandwidth tertata — web normal." },
      { key: "sol_local12", type: "SOLUTION", best: true, text: "Solusi: penyebab lokal dibereskan — web normal." },
      { key: "fail_reset12", type: "FAIL", text: "Reset PC saat masalah di lapis jaringan/lingkungan — langkah salah sasaran." },
    ],
  },

  // ============================================================= C13
  {
    title: "Disk Penuh • PC Lemot",
    scenario: "Drive C: menunjukkan penggunaan > 90% dan komputer terasa sangat lambat.",
    skill: "STORAGE",
    difficulty: "EASY",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "C: penuh > 90% dan PC lemot. Apa yang benar dilakukan?",
        options: [
          { label: "Cek pemakaian disk & bersihkan", target: "n_cek", correct: true, feedback: "Mulai dari pembersihan." },
          { label: "Format ulang Windows", target: "fail_format13", correct: false, feedback: "Data hilang; biasanya pembersihan sudah cukup." },
        ],
      },
      {
        key: "n_cek", type: "DIAGNOSTIC", best: true,
        text: "Lihat pemakaian besar (WinDirStat/TreeSize): temp, hibernasi, update lama, bloatware, pagefile.",
        options: [
          { label: "File sampah/temp besar", target: "n_clean", correct: true, feedback: "Bersihkan kini." },
          { label: "Kapasitas memang kecil", target: "n_pindah", correct: true, feedback: "Tambahkan ruang." },
        ],
      },
      {
        key: "n_clean", type: "ACTION", best: true,
        text: "Jalankan Disk Cleanup + hapus temp/hibernation file + uninstall bloatware.",
        options: [{ label: "Ruang longgar, PC lebih responsif", target: "sol_clean13", correct: true, feedback: "Ruang kembali lega." }],
      },
      {
        key: "n_pindah", type: "ACTION", best: true,
        text: "Pindahkan data besar/user profile ke HDD eksternal atau upgrade ke SSD.",
        options: [{ label: "Sudah direlokasi / SSD baru terpasang", target: "sol_pindah13", correct: true, feedback: "Kapasitas & kinerja bertambah." }],
      },
      { key: "sol_clean13", type: "SOLUTION", best: true, text: "Solusi: disk dibersihkan — sistem lebih cepat." },
      { key: "sol_pindah13", type: "SOLUTION", best: true, text: "Solusi: kapasitas ditambah — sistem lega." },
      { key: "fail_format13", type: "FAIL", text: "Format menghilangkan data untuk masalah yang biasanya cukup dibersihkan." },
    ],
  },

  // ============================================================= C14
  {
    title: "Drive RAW / File Terkorupsi",
    scenario: "Sebuah partisi muncul sebagai RAW di Disk Management — Windows tidak bisa membuka file di dalamnya.",
    skill: "STORAGE",
    difficulty: "HARD",
    targetSteps: 6,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Disk tampak sebagai RAW (tidak terbaca). Data penting di dalamnya. Apa langkah pertama?",
        options: [
          { label: "Jangan format dulu — cek koneksi & health", target: "n_cek", correct: true, feedback: "Format = data hilang permanen, hindari sebelum diagnosis." },
          { label: "Format drive langsung", target: "fail_format14", correct: false, feedback: "Format menghapus data secara permanen — hindari." },
        ],
      },
      {
        key: "n_cek", type: "DIAGNOSTIC", best: true,
        text: "Cek fisik: kabel SATA/USB, port, dan lihat status SMART drive.",
        options: [
          { label: "Kabel/port bermasalah", target: "n_kabel", correct: true, feedback: "Sambungan fisik dulu." },
          { label: "SMART menunjukkan kesehatan buruk", target: "n_backup", correct: true, feedback: "Kegagalan media." },
          { label: "Kesehatan disk normal", target: "n_recover", correct: true, feedback: "File system, bukan fisik." },
        ],
      },
      {
        key: "n_kabel", type: "ACTION", best: true,
        text: "Ganti kabel/port. Perangkat lunak lalu lintas — apakah partisi terbaca normal?",
        options: [
          { label: "Terbaca normal", target: "sol_kabel14", correct: true, feedback: "Kabel jelek membuat RAW." },
          { label: "Masih RAW", target: "n_recover", correct: true, feedback: "Lanjut recovery." },
        ],
      },
      {
        key: "n_backup", type: "ACTION", best: true,
        text: "Prioritaskan clone/backup (ddrescue merasakan sektor baik) LALU ganti drive.",
        options: [{ label: "Backup & ganti drive selesai", target: "sol_back14", correct: true, feedback: "Data selamat & drive sehat." }],
      },
      {
        key: "n_recover", type: "ACTION", best: true,
        text: "Scan file system read-only (chkdsk /f hanya bila aman) + tool recovery (TestDisk/Recuva) untuk mengembalikan akses.",
        options: [
          { label: "File berhasil diakses kembali", target: "sol_rec14", correct: true, feedback: "Struktur partisi diangkat." },
          { label: "Tetap RAW (file system rusak parah)", target: "n_recovery14", correct: true, feedback: "Langkah lanjutan." },
        ],
      },
      {
        key: "n_recovery14", type: "ACTION", best: true,
        text: "Amankan data via recovery tool, lalu partisi ulang (format) seperlunya.",
        options: [{ label: "Data terselamatkan & partisi sehat", target: "sol_rec14", correct: true, feedback: "Recovery sukses." }],
      },
      { key: "sol_kabel14", type: "SOLUTION", best: true, text: "Solusi: kabel diganti — partisi kembali normal." },
      { key: "sol_back14", type: "SOLUTION", best: true, text: "Solusi: data di-backup, drive diganti — selamat." },
      { key: "sol_rec14", type: "SOLUTION", best: true, text: "Solusi: filesystem dipulihkan — partisi terbaca." },
      { key: "fail_format14", type: "FAIL", text: "Memformat drive RAW tanpa backup = data hilang permanen. Reservoir yang benar: diagnosa dulu." },
    ],
  },

  // ============================================================= C15
  {
    title: "HDD Berbunyi Klik-Klik",
    scenario: "Hard disk mengeluarkan bunyi 'klik-klik' berulang. Data penting (skripsi) ada di dalamnya.",
    skill: "STORAGE",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "HDD bunyi klik-klik berulang — tanda kegagalan fisik. Prioritas utama?",
        options: [
          { label: "Segera backup data kritis", target: "n_backup", correct: true, feedback: "Waktu adalah musuh — backup dulu." },
          { label: "Pakai terus & berharap normal", target: "fail_pakai", correct: false, feedback: "Bunyi klik = head mekanik gagal; pemakaian memperparah." },
        ],
      },
      {
        key: "n_backup", type: "DIAGNOSTIC", best: true,
        text: "Evaluasi: bisa clone? Suara selama akses? (ddrescue/Hdclone untuk sektor baik).",
        options: [
          { label: "Backup/clone selesai", target: "n_ganti", correct: true, feedback: "Syarat penuh — data aman." },
          { label: "Backup gagal sebagian", target: "n_tool", correct: true, feedback: "Perlu alat profesional." },
        ],
      },
      {
        key: "n_ganti", type: "ACTION", best: true,
        text: "Ganti HDD baru, clone/restore data dari backup.",
        options: [{ label: "Drive baru aktif, data utuh", target: "sol_back15", correct: true, feedback: "Migrasi sukses." }],
      },
      {
        key: "n_tool", type: "ACTION", best: true,
        text: "Hentikan pemakaian drive; bawa ke layanan recovery profesional (mengatasi head stuck).",
        options: [{ label: "Recovery profesional selesai", target: "sol_back15", correct: true, feedback: "Data penting terselamatkan." }],
      },
      { key: "sol_back15", type: "SOLUTION", best: true, text: "Solusi: data aman — drive baru / recovery sukses." },
      { key: "fail_pakai", type: "FAIL", text: "Memakai HDD yang berdecak hanya memperbesar kerusakan sektor — data bisa hilang total." },
    ],
  },

  // ============================================================= C16
  {
    title: "Disk Selalu 100% Aktivitas",
    scenario: "Task Manager menunjukkan disk 100% aktivitas meski PC tampak idle — sistem sering membeku.",
    skill: "STORAGE",
    difficulty: "MEDIUM",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Disk 100% saat idle dan PC membeku. Langkah pertama yang tepat?",
        options: [
          { label: "Identifikasi proses penyebab (Resource Monitor)", target: "n_tsk", correct: true, feedback: "Cari proses yang melakukan I/O besar." },
          { label: "Reset BIOS", target: "fail_bios16", correct: false, feedback: "Masalah terletak pada lapisan sistem, bukan BIOS." },
        ],
      },
      {
        key: "n_tsk", type: "DIAGNOSTIC", best: true,
        text: "Lihat proses dengan aktivitas disk tertinggi: Windows Search/indexing, antivirus ganda, defrag otomatis.",
        options: [
          { label: "Search/indeks Windows", target: "n_idx", correct: true, feedback: "Indexing sering rewel." },
          { label: "Antivirus ganda terpasang", target: "n_av", correct: true, feedback: "Dua antivirus saling memindai." },
          { label: "Disk tua (HDD) / perlu defrag", target: "n_defrag", correct: true, feedback: "Perawatan rutin HDD." },
          { label: "RAM kecil — banyak swapping", target: "n_ram", correct: true, feedback: "Sistem memakai disk sbg RAM." },
        ],
      },
      {
        key: "n_idx", type: "ACTION", best: true,
        text: "Rebuild / disable indeks pencarian Windows (services → WSearch atau Indexing Options).",
        options: [{ label: "Disk turun ke normal", target: "sol_idx16", correct: true, feedback: "Index bug teratasi." }],
      },
      {
        key: "n_av", type: "ACTION", best: true,
        text: "Uninstall antivirus ke-2 (sisakan satu yang baik).",
        options: [{ label: "Disk normal", target: "sol_av16", correct: true, feedback: "Konflik antivirus hilang." }],
      },
      {
        key: "n_defrag", type: "ACTION", best: true,
        text: "Jadwalkan defragmentasi (hanya HDD; SSD cukup TRIM).",
        options: [{ label: "Disk normal", target: "sol_dfr16", correct: true, feedback: "Defrag selesai." }],
      },
      {
        key: "n_ram", type: "ACTION", best: true,
        text: "Tambah RAM (atau ReadyBoost untuk HDD) untuk kurangi swapping.",
        options: [{ label: "Disk jauh lebih tenang", target: "sol_ram16", correct: true, feedback: "RAM cukup meredam." }],
      },
      { key: "sol_idx16", type: "SOLUTION", best: true, text: "Solusi: indexing dibereskan — disk normal." },
      { key: "sol_av16", type: "SOLUTION", best: true, text: "Solusi: satu antivirus tersisa — disk normal." },
      { key: "sol_dfr16", type: "SOLUTION", best: true, text: "Solusi: HDD defrag — disk normal." },
      { key: "sol_ram16", type: "SOLUTION", best: true, text: "Solusi: RAM ditambah — swapping berkurang." },
      { key: "fail_bios16", type: "FAIL", text: "Reset BIOS tidak menyentuh penyebab di lapis sistem (index/antivirus/defrag)." },
    ],
  },

  // ============================================================= C17
  {
    title: "Monitor Menampilkan 'No Signal'",
    scenario: "Monitor menyala 'No Signal' padahal PC tampak hidup (kipas berputar, LED menyala).",
    skill: "DISPLAY",
    difficulty: "EASY",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Monitor 'No Signal', PC nyala. Mulai dari mana?",
        options: [
          { label: "Cek kabel & sumber input monitor", target: "n_cek", correct: true, feedback: "Mulai dari jalur sinyal yang paling terlihat." },
          { label: "Langsung beli monitor baru", target: "fail_beli17", correct: false, feedback: "Diagnosis sederhana dulu — sering bukan monitor." },
        ],
      },
      {
        key: "n_cek", type: "DIAGNOSTIC", best: true,
        text: "Periksa: kabel di port GPU (bukan onboard), sumber input benar, kabel tidak putus.",
        options: [
          { label: "Sumber input / kabel salah", target: "n_ganti", correct: true, feedback: "Sering cuma ini." },
          { label: "Semua terpasang benar", target: "n_pc", correct: true, feedback: "Periksa sisi PC." },
        ],
      },
      {
        key: "n_ganti", type: "ACTION", best: true,
        text: "Ganti kabel/port, pilih input yang benar di monitor (HDMI/DP/VGA).",
        options: [{ label: "Tampilan muncul", target: "sol_kabel17", correct: true, feedback: "Kabel/input memang biang." }],
      },
      {
        key: "n_pc", type: "DIAGNOSTIC", best: true,
        text: "Pastikan PC benar-benar boot: ada beep/kode LED normal? RAM/VGA seating kunci benar?",
        options: [
          { label: "Beep panjang/kode LED mengindikasikan RAM/VGA", target: "n_reseat", correct: true, feedback: "Lanjut seating." },
          { label: "Tidak ada tanda aneh", target: "n_gpu", correct: true, feedback: "Fokus GPU." },
        ],
      },
      {
        key: "n_reseat", type: "ACTION", best: true,
        text: "Reseat RAM + kartu grafis, nyalakan ulang.",
        options: [{ label: "Tampil normal", target: "sol_res17", correct: true, feedback: "Seating menyelesaikan." }],
      },
      {
        key: "n_gpu", type: "DIAGNOSTIC", best: true,
        text: "GPU tak terdeteksi? Cabut & pasang ulang GPU ke slot, atau coba GPU lain.",
        options: [
          { label: "Setelah reseat GPU — tampil!", target: "sol_gpu17", correct: true, feedback: "Slot/kartu rapi." },
          { label: "GPU tetap tidak terdeteksi", target: "n_ganti_gpu", correct: true, feedback: "Uji kartu lain." },
        ],
      },
      {
        key: "n_ganti_gpu", type: "ACTION", best: true,
        text: "Uji dengan GPU lain (atau integrasi) — pastikan PSU cukup daya.",
        options: [{ label: "Tampil normal dengan GPU pengganti", target: "sol_gpu17", correct: true, feedback: "GPU lama rusak — ganti." }],
      },
      { key: "sol_kabel17", type: "SOLUTION", best: true, text: "Solusi: kabel/input monitor dibereskan — tampilan normal." },
      { key: "sol_res17", type: "SOLUTION", best: true, text: "Solusi: RAM/VGA di-reseat — tampil normal." },
      { key: "sol_gpu17", type: "SOLUTION", best: true, text: "Solusi: GPU sehat terpasang — tampilan normal." },
      { key: "fail_beli17", type: "FAIL", text: "Membeli monitor baru saat masalah sebenarnya di kabel/GPU — pengeluaran sia-sia." },
    ],
  },

  // ============================================================= C18
  {
    title: "Laptop Menyala tapi Layar Gelap",
    scenario: "Laptop menyala (kipas & suara normal) namun layar pekat gelap pekat.",
    skill: "DISPLAY",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Laptop hidup tapi layar gelap total. Pertama kali?",
        options: [
          { label: "Cek kecerahan (Fn + brightness)", target: "n_bright", correct: true, feedback: "Sering hanya kecerahan 0." },
          { label: "Langsung bongkar layar", target: "fail_bongkar18", correct: false, feedback: "Mulai dari cek non-invasif." },
        ],
      },
      {
        key: "n_bright", type: "ACTION", best: true,
        text: "Tekan tombol kecerahan / atur lewat Win+I → System → Display. Muncul?",
        options: [
          { label: "Ya, layar menyala kembali", target: "sol_bright18", correct: true, feedback: "Kecerahan memang 0." },
          { label: "Tetap gelap", target: "n_senter", correct: true, feedback: "Uji backlight." },
        ],
      },
      {
        key: "n_senter", type: "DIAGNOSTIC", best: true,
        text: "Sorot layar dengan senter — apakah ada gambar samar?",
        options: [
          { label: "Samar terlihat = backlight mati", target: "n_bl", correct: true, feedback: "Panel bekerja, lampu mati." },
          { label: "Benar-benar hitam", target: "n_ext", correct: true, feedback: "Uji eksternal." },
        ],
      },
      {
        key: "n_bl", type: "ACTION", best: true,
        text: "Periksa kabel backlight/inverter (sambungan longgar) — perbaiki/ganti.",
        options: [{ label: "Layar menyala terang", target: "sol_bl18", correct: true, feedback: "Kabel backlight memang lepas." }],
      },
      {
        key: "n_ext", type: "DIAGNOSTIC", best: true,
        text: "Sambungkan monitor eksternal (mirror). Apakah tampil?",
        options: [
          { label: "Eksternal tampil", target: "n_int", correct: true, feedback: "Kabel internal/panel layar." },
          { label: "Eksternal juga hitam", target: "n_gpu18", correct: true, feedback: "Masalah GPU." },
        ],
      },
      {
        key: "n_int", type: "ACTION", best: true,
        text: "Perbaiki/ganti kabel layar internal (eDP) atau panel.",
        options: [{ label: "Layar normal", target: "sol_int18", correct: true, feedback: "Interface panel diperbaiki." }],
      },
      {
        key: "n_gpu18", type: "ACTION", best: true,
        text: "Reset driver GPU / resetselamat inference → jika tetap, service GPU/board.",
        options: [{ label: "Layar hidup", target: "sol_gpu18", correct: true, feedback: "GPU dibereskan." }],
      },
      { key: "sol_bright18", type: "SOLUTION", best: true, text: "Solusi: kecerahan dipulihkan — layar menyala." },
      { key: "sol_bl18", type: "SOLUTION", best: true, text: "Solusi: backlight diperbaiki — layar terang." },
      { key: "sol_int18", type: "SOLUTION", best: true, text: "Solusi: kabel/panel layar diganti — normal." },
      { key: "sol_gpu18", type: "SOLUTION", best: true, text: "Solusi: GPU/board dipulihkan — layar hidup." },
      { key: "fail_bongkar18", type: "FAIL", text: "Membongkar layar tanpa cek kecerahan & tes non-invasif dulu — risiko kerusakan baru." },
    ],
  },

  // ============================================================= C19
  {
    title: "Gambar Pecah Setelah Update Driver GPU",
    scenario: "Setelah update driver grafis, resolusi tampilan aneh / artefak muncul saat bermain game.",
    skill: "DISPLAY",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Setelah update driver GPU: resolusi berantakan / artefak. Langkah paling tepat?",
        options: [
          { label: "Rollback/reinstall driver (DDU)", target: "n_drv", correct: true, feedback: "Software dulu — paling sering." },
          { label: "Beli GPU baru", target: "fail_beli19", correct: false, feedback: "Versi software belum dinegasikan." },
        ],
      },
      {
        key: "n_drv", type: "ACTION", best: true,
        text: "Gunakan DDU (Safe Mode) untuk bersihkan driver, install versi stabil yang dikenal baik.",
        options: [
          { label: "Tampilan normal", target: "sol_drv19", correct: true, feedback: "Driver baru memang buggy." },
          { label: "Masih artefak", target: "n_set", correct: true, feedback: "Periksa pengaturan." },
        ],
      },
      {
        key: "n_set", type: "DIAGNOSTIC", best: true,
        text: "Cek resolusi native monitor & refresh rate yang didukung.",
        options: [
          { label: "Resolusi/refresh salah", target: "n_rr", correct: true, feedback: "Atur ulang." },
          { label: "Sudah benar", target: "n_suhu19", correct: true, feedback: "Cek suhu GPU." },
        ],
      },
      {
        key: "n_rr", type: "ACTION", best: true,
        text: "Set resolusi native & refresh (mis. kurangi 144→60 sementara).",
        options: [{ label: "Tampilan normal", target: "sol_set19", correct: true, feedback: "Pengaturan keliru tadi." }],
      },
      {
        key: "n_suhu19", type: "DIAGNOSTIC", best: true,
        text: "GPU overheat saat load? (HWiNFO saat game). Debu/thermal paste.",
        options: [
          { label: "GPU panas saat beban", target: "n_term", correct: true, feedback: "Perbaiki pendinginan." },
        ],
      },
      {
        key: "n_term", type: "ACTION", best: true,
        text: "Bersihkan fan/heat sink GPU, ganti thermal paste bila perlu.",
        options: [{ label: "Artefak hilang", target: "sol_term19", correct: true, feedback: "GPUs sehat kembali." }],
      },
      { key: "sol_drv19", type: "SOLUTION", best: true, text: "Solusi: driver stabil dipasang — tampilan normal." },
      { key: "sol_set19", type: "SOLUTION", best: true, text: "Solusi: resolusi/refresh diatur benar — normal." },
      { key: "sol_term19", type: "SOLUTION", best: true, text: "Solusi: pendinginan GPU diperbaiki — artefak hilang." },
      { key: "fail_beli19", type: "FAIL", text: "Membeli GPU baru padahal penyebabnya software (driver/settings) — pengeluaran besar sia-sia." },
    ],
  },

  // ============================================================= C20
  {
    title: "Printer Tidak Terdeteksi / Antrean Macet",
    scenario: "Printer tidak muncul di daftar perangkat, atau pekerjaan cetak menggantung di antrean.",
    skill: "PERIPHERAL",
    difficulty: "MEDIUM",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START", best: true,
        text: "Printer tidak terdeteksi / print queue macet. Dari mana mulai?",
        options: [
          { label: "Cek kabel & listrik printer (USB/power)", target: "n_cek", correct: true, feedback: "Fisik dulu." },
          { label: "Hapus semua antrean langsung", target: "n_spool", correct: true, feedback: "Bersihkan spooler." },
          { label: "Instal ulang Windows", target: "fail_win20", correct: false, feedback: "Terlalu jauh untuk masalah periferal." },
        ],
      },
      {
        key: "n_cek", type: "DIAGNOSTIC", best: true,
        text: "Ganti kabel/port USB, pastikan print power nyala, lampu status normal.",
        options: [
          { label: "Kabel/port USB bermasalah", target: "n_kabel", correct: true, feedback: "Sambungan fisik." },
          { label: "Perangkat menyala & kabel OK", target: "n_spool", correct: true, feedback: "Lanjut software." },
        ],
      },
      {
        key: "n_kabel", type: "ACTION", best: true,
        text: "Ganti kabel / port USB (jangan pakai hub bermasalah), coba perangkat lain.",
        options: [{ label: "Printer terdeteksi", target: "sol_kabel20", correct: true, feedback: "Kabel/port memang biang." }],
      },
      {
        key: "n_spool", type: "ACTION", best: true,
        text: "Restart spooler & bersihkan file SPOOL: Services → Print Spooler → Stop, hapus isi C:\\Windows\\System32\\spool\\PRINTERS, Start.",
        options: [
          { label: "Queue bersih, cetak uji masuk", target: "n_driver", correct: true, feedback: "Lanjut driver." },
          { label: "Masih macet / tidak muncul", target: "n_driver", correct: true, feedback: "Tetap lanjut driver." },
        ],
      },
      {
        key: "n_driver", type: "ACTION", best: true,
        text: "Install ulang/update driver resmi printer, set port benar (USB/network).",
        options: [
          { label: "Cetak uji berhasil", target: "sol_drv20", correct: true, feedback: "Driver beres." },
          { label: "Belum berhasil", target: "n_hw", correct: true, feedback: "Uji hardware printer." },
        ],
      },
      {
        key: "n_hw", type: "DIAGNOSTIC", best: true,
        text: "Cetak mandiri (self-test print dari tombol/pit). Apakah printer mencetak tanpa PC?",
        options: [
          { label: "Self-test OK → masalah di sisi koneksi/PC", target: "sol_hw20", correct: true, feedback: "Printer sehat; benahi koneksi/software." },
          { label: "Self-test gagal → printer bermasalah", target: "sol_svc20", correct: true, feedback: "Perlu servis printer." },
        ],
      },
      { key: "sol_kabel20", type: "SOLUTION", best: true, text: "Solusi: kabel/port diperbaiki — printer terdeteksi." },
      { key: "sol_drv20", type: "SOLUTION", best: true, text: "Solusi: driver & antrean dibereskan — cetak normal." },
      { key: "sol_hw20", type: "SOLUTION", best: true, text: "Solusi: printer sehat — benahi lapisan koneksi/PC." },
      { key: "sol_svc20", type: "SOLUTION", best: true, text: "Solusi: printer perlu servis — fresh ke layanan resmi." },
      { key: "fail_win20", type: "FAIL", text: "Instal ulang OS untuk printer yang tidak terdeteksi — waktu & data terbuang tanpa diagnosis." },
    ],
  },
];