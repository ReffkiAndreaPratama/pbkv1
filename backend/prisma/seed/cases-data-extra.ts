// TechTutor seed data - batch lanjutan: kasus (simulasi) tambahan.
// Dipakai oleh prisma/seed.ts bersama CASES utama.
import type { SeedCase } from "./cases-data";

export const EXTRA_CASES: SeedCase[] = [
  // ------------------------------------------------ POWER +2
  {
    title: "Laptop Nyala Sesaat Lalu Mati Total",
    scenario:
      "Laptop menyala sekitar 2-3 detik (LED hidup, kipas berputar) lalu mati total. Pengguna mengaku baru mencabut adaptor saat baterai tinggal sedikit.",
    skill: "POWER",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "Laptop nyala sesaat lalu mati. Dari mana mulai memeriksa?",
        options: [
          { label: "Cek adaptor & kabel listrik", target: "n_adapt", correct: true, feedback: "Mulai dari suplai voltase." },
          { label: "Langsung bongkar casing", target: "fail_mech", correct: false, feedback: "Membongkar tanpa data berisiko & mengurangi garansi." },
        ],
      },
      {
        key: "n_adapt", type: "DIAGNOSTIC", best: true,
        text: "Sambungkan adaptor asli, periksa LED charger dan posisi konektor DC.",
        options: [
          { label: "LED adaptor mati / adaptor bermasalah", target: "n_ganti", correct: true, feedback: "Suplai benar-benar nyaris tidak ada." },
          { label: "Adaptor normal", target: "n_batt", correct: true, feedback: "Lanjut ke lapisan pengisian." },
        ],
      },
      {
        key: "n_ganti", type: "ACTION", best: true,
        text: "Ganti adaptor/kabel untuk menguji, pastikan konektor DC terpasang penuh.",
        options: [
          { label: "Hidup normal", target: "sol_ganti", correct: true, feedback: "Adaptor memang biang masalah." },
          { label: "Masih mati", target: "n_batt", correct: true, feedback: "Adaptor bukan satu-satunya tersangka." },
        ],
      },
      {
        key: "n_batt", type: "DIAGNOSTIC", best: true,
        text: "Lepas baterai (atau tahan tombol power tanpa baterai), nyalakan hanya dengan adaptor.",
        options: [
          { label: "Menyala tanpa baterai", target: "sol_batt", correct: true, feedback: "Baterai/pengisian yang bermasalah." },
          { label: "Tetap mati", target: "n_ram", correct: true, feedback: "Lanjut cek komponen sistem." },
        ],
      },
      {
        key: "n_ram", type: "ACTION", best: true,
        text: "Umumkan: reseat RAM dan lepas perangkat yang mudah dilepas satu per satu (hematu pengujian).",
        options: [
          { label: "Menyala setelah komponen di-reset", target: "sol_ram", correct: true, feedback: "Kontak longgar / short sementara teratasi." },
          { label: "Masih mati", target: "n_psu", correct: true, feedback: "Kemungkinan besar listrik internal." },
        ],
      },
      {
        key: "n_psu", type: "DIAGNOSTIC", best: true,
        text: "Curiga short/PSU internal: dengarkan beep, periksa bau, dan jika tidak ada perbaikan, serahkan ke servis.",
        options: [{ label: "Tidak ada perbaikan", target: "sol_svc", correct: true, feedback: "Lapisan tegangan mahal, biar yang berpengalaman." }],
      },
      { key: "sol_ganti", type: "SOLUTION", best: true, text: "Solusi: adaptor normal kembali - laptop hidup dengan suplai yang benar." },
      { key: "sol_batt", type: "SOLUTION", best: true, text: "Solusi: baterai terindikasi rusak - PC normal saat tanpa baterai." },
      { key: "sol_ram", type: "SOLUTION", best: true, text: "Solusi: komponen di-reset dengan benar - nyala kembali normal." },
      { key: "sol_svc", type: "SOLUTION", best: true, text: "Solusi: serahkan pengecekan PSU/board internal ke servis terpercaya." },
      { key: "fail_mech", type: "FAIL", text: "Membongkar tanpa diagnosis - berisiko merusak lebih lanjut dan mengurangi garansi." },
    ],
  },
  {
    title: "Bau Hangus dari Casing Saat Dipakai Berat",
    scenario:
      "Selama bermain game, pengguna mencium bau gosong dari casing dan kipas PSU berbunyi kasar. Komputer belum mati tetapi pengguna ragu untuk melanjutkan.",
    skill: "POWER",
    difficulty: "HARD",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START",
        text: "Bau hangus + fan PSU berisik saat beban. Tindakan pertama yang benar?",
        options: [
          { label: "Matikan, cabut listrik, biarkan dingin", target: "n_off", correct: true, feedback: "Menghentikan risiko pertama." },
          { label: "Teruskan sampai selesai bermain", target: "fail_lanjut", correct: false, feedback: "Resiko kerusakan permanen komponen." },
        ],
      },
      {
        key: "n_off", type: "DIAGNOSTIC", best: true,
        text: "Cabut listrik, tunggu 5 menit, lalu periksa visual unit daya dan bagian dalam blower.",
        options: [
          { label: "Ada tanda (bekas, deformasi, kapasitor menggembung)", target: "sol_ganti", correct: true, feedback: "Bukti fisik kerusakan listrik." },
          { label: "Tampak bersih", target: "n_teg", correct: true, feedback: "Perlu pengukuran tegangan." },
        ],
      },
      {
        key: "n_teg", type: "DIAGNOSTIC", best: true,
        text: "Ukur tegangan rel +12V/+5V dengan multimeter saat PC idle ringan.",
        options: [
          { label: "Ada rel yang drop jauh", target: "sol_ganti", correct: true, feedback: "PSU sudah tidak sanggup menopang." },
          { label: "Tegangan normal", target: "n_load", correct: true, feedback: "Uji bertahap dengan beban." },
        ],
      },
      {
        key: "n_load", type: "DIAGNOSTIC", best: true,
        text: "Coba beban bertahap sambil memantau suhu & suara fan; bila bau/abnormal muncul saat load.",
        options: [
          { label: "Bau/abnormal muncul lagi saat beban", target: "sol_ganti", correct: true, feedback: "Bukti melemah di bawah tekanan." },
          { label: "Stabil, bau tidak muncul", target: "sol_bersih", correct: true, feedback: "Kemungkinan disembunyikan oleh debu baru terbakar." },
        ],
      },
      { key: "sol_ganti", type: "SOLUTION", best: true, text: "Solusi: ganti PSU - gejala hangus membuktikan melebihi batas aman." },
      { key: "sol_bersih", type: "SOLUTION", best: true, text: "Solusi: bersihkan debu & pastikan sirkulasi; pantau bila bau muncul lagi." },
      { key: "fail_lanjut", type: "FAIL", text: "Memaksa beban pada sumber daya abnormal - komponen mahal dapat ikut rusak." },
    ],
  },

  // ------------------------------------------------ BOOT +2
  {
    title: "Boot Loop setelah Install Update",
    scenario:
      "Setelah Windows melakukan update malam, komputer restart dan langsung menggulir ke logo Windows lalu restart lagi sebelum sempat login. Siklus berulang tanpa henti.",
    skill: "BOOT",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "Boot loop berulang pasca-update. Langkah awal yang aman?",
        options: [
          { label: "Masuk ke Recovery (WinRE) lewat opsi 'Repair'", target: "n_recovery", correct: true, feedback: "Akses runtime tanpa memuat Windows." },
          { label: "Matikan secara paksa saat logo, berulang kali", target: "fail_paksa", correct: false, feedback: "Pengulangan paksa tidak memperbaiki dan berisiko pada disk." },
        ],
      },
      {
        key: "n_recovery", type: "DIAGNOSTIC", best: true,
        text: "Di WinRE, gelar pilihan: Startup Repair atau masuk ke Command Prompt.",
        options: [
          { label: "Jalankan Startup Repair dulu", target: "n_repair", correct: true, feedback: "Terkadang cukup untuk update yang macet." },
          { label: "Langsung ke troubleshooting lanjutan", target: "n_cmd", correct: true, feedback: "Untuk kontrol penuh." },
        ],
      },
      {
        key: "n_repair", type: "ACTION", best: true,
        text: "Jalankan Startup Repair, tunggu analisis selesai.",
        options: [
          { label: "Windows berhasil masuk", target: "sol_repair", correct: true, feedback: "Update/BCD diperbaiki otomatis." },
          { label: "Masih boot loop", target: "n_cmd", correct: true, feedback: "Lanjut ke konfirmasi disk & bootloader." },
        ],
      },
      {
        key: "n_cmd", type: "ACTION", best: true,
        text: "Dari Command Prompt WinRE: cek kesehatan disk & bootloader (chkdsk lalu bootrec fixmbr/fixboot/rebuildbcd).",
        options: [
          { label: "Masuk Windows", target: "sol_boot", correct: true, feedback: "Bootloader/driver pulih." },
          { label: "Masih loop namun disk sehat", target: "n_driver", correct: true, feedback: "Arah baru: driver & update yang gagal." },
        ],
      },
      {
        key: "n_driver", type: "ACTION", best: true,
        text: "Masuk Safe Mode (atau Last Known Good) dan uninstall update / driver terakhir yang bermasalah.",
        options: [
          { label: "Normal kembali", target: "sol_driv", correct: true, feedback: "Driver/update penyebabnya." },
          { label: "Tetap gagal masuk", target: "fail_driv", correct: false, feedback: "Waktu untuk pertimbangan install repair." },
        ],
      },
      { key: "sol_repair", type: "SOLUTION", best: true, text: "Solusi: Startup Repair menyelesaikan update yang macet." },
      { key: "sol_boot", type: "SOLUTION", best: true, text: "Solusi: bootloader & disk ditata ulang - Windows masuk kembali." },
      { key: "sol_driv", type: "SOLUTION", best: true, text: "Solusi: driver/update terakhir disingkirkan - sistem stabil." },
      { key: "fail_paksa", type: "FAIL", text: "Paksa mati berulang memperbesar risiko kerusakan file sistem." },
      { key: "fail_driv", type: "FAIL", text: "Repair-level lanjutan diperlukan - hindari menyerah ke format langsung tanpa backup." },
    ],
  },
  {
    title: "Setiap Nyalakan Selalu Masuk ke BIOS",
    scenario:
      "Setiap menyalakan komputer, langsung masuk ke setelan UEFI/BIOS tanpa pernah menampilkan logo Windows. Hard disk terlihat di list storage.",
    skill: "BOOT",
    difficulty: "EASY",
    targetSteps: 3,
    nodes: [
      {
        key: "start", type: "START",
        text: "Komputer selalu masuk BIOS walau disk terdeteksi. Langkah terbaik?",
        options: [
          { label: "Atur boot order ke drive Windows", target: "n_order", correct: true, feedback: "Langkah pertama paling masuk akal." },
          { label: "Format disk", target: "fail_fmt", correct: false, feedback: "Data hilang tanpa perlu - belum ada diagnosis." },
        ],
      },
      {
        key: "n_order", type: "ACTION", best: true,
        text: "Pada menu Boot, tempatkan drive Windows pertama, simpan (F10), dan restart.",
        options: [
          { label: "Windows masuk", target: "sol_order", correct: true, feedback: "Boot order memang penyebab." },
          { label: "Masih masuk BIOS", target: "n_mode", correct: true, feedback: "Kemungkinan lain: mode boot tidak cocok." },
        ],
      },
      {
        key: "n_mode", type: "DIAGNOSTIC", best: true,
        text: "Periksa apakah mode UEFI/Legacy sesuai skema partisi (MBR vs GPT) - ubah bila bertentangan.",
        options: [
          { label: "Sesuaikan mode lalu simpan", target: "sol_mode", correct: true, feedback: "Ketidakcocokan boot mode." },
          { label: "Tetap tidak boot", target: "n_disk", correct: true, feedback: "Kemungkinan kabel/preferensi disk." },
        ],
      },
      {
        key: "n_disk", type: "DIAGNOSTIC", best: true,
        text: "Cek kabel SATA/power & port disk di BIOS storage details.",
        options: [
          { label: "Reseat kabel menyelesaikan", target: "sol_kabel", correct: true, feedback: "Kontak listrik mental." },
          { label: "Masih gagal", target: "fail_disk", correct: false, feedback: "Arah berikut: uji disk di PC lain." },
        ],
      },
      { key: "sol_order", type: "SOLUTION", best: true, text: "Solusi: boot order diperbaiki - sistem dapat menge-boot." },
      { key: "sol_mode", type: "SOLUTION", best: true, text: "Solusi: mode boot disetel cocok dengan tipe partisi." },
      { key: "sol_kabel", type: "SOLUTION", best: true, text: "Solusi: kabel disk dipasang ulang - drive terdeteksi konsisten." },
      { key: "fail_fmt", type: "FAIL", text: "Memformat sebelum diagnosis menghapus data tanpa menyelesaikan akar masalah." },
      { key: "fail_disk", type: "FAIL", text: "Disk/board mencurigakan - uji drive di PC lain sebelum memutuskan." },
    ],
  },

  // ------------------------------------------------ NETWORK +2
  {
    title: "WiFi Sering Putus Setiap Beberapa Menit",
    scenario:
      "WiFi terhubung penuh namun koneksi 'drop' sendiri setiap beberapa menit, lalu tersambung lagi. Kecepatan saat tersambung terasa normal.",
    skill: "NETWORK",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "WiFi drop berkala. Dari mana memahami polanya?",
        options: [
          { label: "Pantau sinyal & kapan drop terjadi", target: "n_sinyal", correct: true, feedback: "Data pola memandu langkah berikut." },
          { label: "Ganti router baru sekarang", target: "fail_ganti", correct: false, feedback: "Investasi tanpa diagnosis bisa jadi percuma." },
        ],
      },
      {
        key: "n_sinyal", type: "DIAGNOSTIC", best: true,
        text: "Catat kekuatan sinyal di lokasi pemakaian dan saat jarak dekat router.",
        options: [
          { label: "Sinyal lemah saat berjauhan", target: "n_posisi", correct: true, feedback: "Masalah coverage/interferensi jarak." },
          { label: "Drop juga di dekat router", target: "n_channel", correct: true, feedback: "Kemungkinan interferensi channel/router." },
        ],
      },
      {
        key: "n_posisi", type: "ACTION", best: true,
        text: "Posisikan ulang modem/router lebih sentral, hindari lemari logam dan dinding rapat.",
        options: [
          { label: "Stabil", target: "sol_posisi", correct: true, feedback: "Coverage yang buruk menjadi biang." },
          { label: "Masih drop", target: "n_channel", correct: true, feedback: "Lanjut analisis channel." },
        ],
      },
      {
        key: "n_channel", type: "DIAGNOSTIC", best: true,
        text: "Gunakan scanner WiFi untuk melihat kepadatan channel 2.4GHz di sekitar.",
        options: [
          { label: "Channel ramai / bentrok", target: "n_set", correct: true, feedback: "Interferensi antar-tetangga." },
          { label: "Channel relatif sepi", target: "n_band", correct: true, feedback: "Coba band 5GHz." },
        ],
      },
      {
        key: "n_set", type: "ACTION", best: true,
        text: "Setel channel non-overlap (1/6/11) pada 2.4GHz dan reboot AP.",
        options: [
          { label: "Stabil", target: "sol_ch", correct: true, feedback: "Channel yang benar menghentikan tabrakan." },
          { label: "Masih drop", target: "n_band", correct: true, feedback: "Beralih ke 5GHz." },
        ],
      },
      {
        key: "n_band", type: "DIAGNOSTIC", best: true,
        text: "Uji koneksi pada band 5GHz (SSID terpisah/band steering).",
        options: [
          { label: "5GHz stabil", target: "sol_band", correct: true, feedback: "Solusi: pakai band lebih bersih." },
          { label: "Drop di kedua band", target: "n_fw", correct: true, feedback: "Curiga firmware/hardware router." },
        ],
      },
      {
        key: "n_fw", type: "ACTION", best: true,
        text: "Perbarui firmware (atau uji AP lain) dan ulangi uji koneksi.",
        options: [
          { label: "Stabil setelah update", target: "sol_fw", correct: true, feedback: "Bug firmware berlangsung." },
          { label: "Tetap bermasalah", target: "fail_ap", correct: false, feedback: "Waktunya penggantian AP yang wajar." },
        ],
      },
      { key: "sol_posisi", type: "SOLUTION", best: true, text: "Solusi: penempatan diperbaiki - drop tidak muncul lagi." },
      { key: "sol_ch", type: "SOLUTION", best: true, text: "Solusi: channel non-overlap diterapkan - interferensi hilang." },
      { key: "sol_band", type: "SOLUTION", best: true, text: "Solusi: perangkat dialihkan ke 5GHz yang lebih bersih." },
      { key: "sol_fw", type: "SOLUTION", best: true, text: "Solusi: firmware diperbarui - koneksi stabil." },
      { key: "fail_ganti", type: "FAIL", text: "Mengganti router tanpa diagnosis menambah biaya tanpa memastikan akar masalah." },
      { key: "fail_ap", type: "FAIL", text: "Kalian sudah isolasi: perangkat akses adalah penyebab - ganti yang wajar." },
    ],
  },
  {
    title: "Switch Kantor: Aplikasi Internal Tiba-tiba Terputus",
    scenario:
      "Seluruh divisi keuangan tidak bisa mengakses server internal. Beberapa komputer di divisi lain normal. Di panel switch, LED port bagian keuangan berkedip tidak menentu.",
    skill: "NETWORK",
    difficulty: "HARD",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START",
        text: "Sebagian klien kehilangan akses internal. Mulai dari mana?",
        options: [
          { label: "Peta segmen: ping dari beberapa titik", target: "n_seg", correct: true, feedback: "Menentukan cakupan masalah." },
          { label: "Restart semua switch sekarang", target: "fail_restart", correct: false, feedback: "Gangguan tak perlu bagi divisi lain." },
        ],
      },
      {
        key: "n_seg", type: "DIAGNOSTIC", best: true,
        text: "Ping gateway internal dari divisi keuangan, divisi lain, dan server.",
        options: [
          { label: "Hanya area keuangan yang gagal", target: "n_link", correct: true, feedback: "Fokus ke segmen switch mereka." },
          { label: "Banyak segmen yang terdampak", target: "n_core", correct: true, feedback: "Kemungkinan core/serangan besar." },
        ],
      },
      {
        key: "n_link", type: "DIAGNOSTIC", best: true,
        text: "Amati LED uplink switch divisi keuangan - stabil atau berkedip (flapping)?",
        options: [
          { label: "LED uplink berkedip / tidak stabil", target: "n_kabel", correct: true, feedback: "Indikasi link layer bermasalah." },
          { label: "LED uplink normal", target: "n_vlan", correct: true, feedback: "Cek lapisan konfigurasi." },
        ],
      },
      {
        key: "n_kabel", type: "ACTION", best: true,
        text: "Ganti kabel uplink dan patch panel yang menghubungkan switch ke core.", "detail": "Periksa juga konektor yang kendor.",
        options: [
          { label: "Akses pulih", target: "sol_kabel", correct: true, feedback: "Physical link memang putus-nyambung." },
          { label: "Masih gagal", target: "n_vlan", correct: true, feedback: "Lanjut konfigurasi." },
        ],
      },
      {
        key: "n_vlan", type: "DIAGNOSTIC", best: true,
        text: "Periksa VLAN assignment & kondisi spanning-tree (STP) pada port keuangan.",
        options: [
          { label: "Terlihat loop / port STP blocking", target: "n_stp", correct: true, feedback: "Loop membunuh switch segmen." },
          { label: "Konfigurasi tampak benar", target: "n_log", correct: true, feedback: "Perlu bukti dari log." },
        ],
      },
      {
        key: "n_stp", type: "ACTION", best: true,
        text: "Nonaktifkan port yang membuat loop, aktifkan STP yang benar.",
        options: [
          { label: "Akses pulih", target: "sol_stp", correct: true, feedback: "Panic loop berakhir." },
          { label: "Masih tidak pulih", target: "n_log", correct: true, feedback: "Kumpulkan bukti lebih lanjut." },
        ],
      },
      {
        key: "n_log", type: "DIAGNOSTIC", best: true,
        text: "Baca log switch (CRC/drop) dan cek total packet loss menuju core.",
        options: [
          { label: "Ada polah CRC/drop pada satu port", target: "sol_log", correct: true, feedback: "Neurologic: interface-switch yang rusak." },
          { label: "Data bersih", target: "sol_monitor", correct: true, feedback: "Pantau terlebih dahulu." },
        ],
      },
      { key: "n_core", type: "DIAGNOSTIC", best: true, text: "Periksa core switch & uplink pusat; mulai dari LED dan log di perangkat inti.", options: [{ label: "Temukan akar di core", target: "sol_log", correct: true, feedback: "Perbaikan di lapisan inti." }] },
      { key: "sol_kabel", type: "SOLUTION", best: true, text: "Solusi: kabel/patch diperbaiki - link stabil, akses pulih." },
      { key: "sol_stp", type: "SOLUTION", best: true, text: "Solusi: loop diberhentikan dengan STP benar - segmen hidup kembali." },
      { key: "sol_log", type: "SOLUTION", best: true, text: "Solusi: perangkat/interface bermasalah diidentifikasi dari log & diganti." },
      { key: "sol_monitor", type: "SOLUTION", best: true, text: "Solusi: tidak ada bukti kerusakan lanjut - aktifkan monitoring berkala." },
      { key: "fail_restart", type: "FAIL", text: "Restart massal mengganggu area normal tanpa menjawab akar masalah." },
    ],
  },

  // ------------------------------------------------ STORAGE +2
  {
    title: "Drive Data Tidak Muncul Setelah Restart",
    scenario:
      "Setelah restart, drive D: (HDD SATA) tidak muncul di File Explorer. Pengguna memastikan drive itu berisi data arsip penting.",
    skill: "STORAGE",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "Drive D: raib setelah restart. Pertama-tama kita cek apa?",
        options: [
          { label: "Lihat kondisi di Disk Management", target: "n_dm", correct: true, feedback: "Mencari tahu apakah disk masih terdeteksi." },
          { label: "Langsung format drive", target: "fail_fmt", correct: false, feedback: "Format = menghapus data di hard disk yang belum tentu rusak." },
        ],
      },
      {
        key: "n_dm", type: "DIAGNOSTIC", best: true,
        text: "Di Disk Management, apakah disk terlihat?",
        options: [
          { label: "Disk tidak terdeteksi sama sekali", target: "n_kabel", correct: true, feedback: "Lapisan fisik/kabel pertama." },
          { label: "Disk terdeteksi tapi tanpa huruf drive", target: "n_huruf", correct: true, feedback: "Sering cuma kehilangan huruf." },
        ],
      },
      {
        key: "n_kabel", type: "ACTION", best: true,
        text: "Reseat kabel SATA/power, cek jumlah disk di BIOS/UEFI storage.",
        options: [
          { label: "Drive terdeteksi kembali", target: "sol_kabel", correct: true, feedback: "Kontak kabel yang bermasalah." },
          { label: "Masih hilang", target: "n_smart", correct: true, feedback: "Bagian bisa jadi menyangkut kesehatan drive." },
        ],
      },
      {
        key: "n_huruf", type: "ACTION", best: true,
        text: "Beri/ubah huruf drive melalui Change Drive Letter and Paths.",
        options: [
          { label: "Drive muncul normal", target: "sol_huruf", correct: true, feedback: "Huruf hilang setelah update/restart." },
          { label: "Muncul tapi prosesnya aneh", target: "n_smart", correct: true, feedback: "Periksa kesehatan." },
        ],
      },
      {
        key: "n_smart", type: "DIAGNOSTIC", best: true,
        text: "Baca SMART & error ratio drive dengan alat (mis. CrystalDiskInfo).",
        options: [
          { label: "Ada reallocated/uncorrectable yang tumbuh", target: "n_backup", correct: true, feedback: "Disk menunjukkan kegagalan progresif." },
          { label: "SMART sehat", target: "sol_awet", correct: true, feedback: "Kemungkinan kasus kontak/going." },
        ],
      },
      {
        key: "n_backup", type: "ACTION", best: true,
        text: "Segera amankan data (klon/backup) dan siapkan penggantian drive.",
        options: [
          { label: "Data berhasil diselamatkan", target: "sol_backup", correct: true, feedback: "Data aman adalah prioritas utama." },
          { label: "Data tidak terbaca", target: "fail_rec", correct: false, feedback: "Evaluasi recovery profesional bila nilai data tinggi." },
        ],
      },
      { key: "sol_kabel", type: "SOLUTION", best: true, text: "Solusi: kabel/port diperbaiki - drive terdeteksi kembali." },
      { key: "sol_huruf", type: "SOLUTION", best: true, text: "Solusi: huruf drive dipulihkan - data kembali normal." },
      { key: "sol_awet", type: "SOLUTION", best: true, text: "Solusi: disk sehat - sistem timbul kembali normal." },
      { key: "sol_backup", type: "SOLUTION", best: true, text: "Solusi: data di-backup, drive siap diganti sebelum mati total." },
      { key: "fail_fmt", type: "FAIL", text: "Memformat menghapus data yang mungkin saja masih bisa diselamatkan." },
      { key: "fail_rec", type: "FAIL", text: "Disk sangat lemah - hentikan pemakaian, pertimbangkan recovery profesional." },
    ],
  },
  {
    title: "File Tiba-tiba Korup Saat Dibuka",
    scenario:
      "Beberapa dokumen dan foto di laptop mulai tidak bisa dibuka atau tampil rusak. Kejadian meningkat selama dua minggu. Sistem masih berjalan normal.",
    skill: "STORAGE",
    difficulty: "HARD",
    targetSteps: 5,
    nodes: [
      {
        key: "start", type: "START",
        text: "File korup makin sering. Prioritas tertinggi berikut?",
        options: [
          { label: "Lindungi data & baca SMART tanpa menulis", target: "n_smart", correct: true, feedback: "Semakin dahulu data jelas." },
          { label: "Terus bekerja lalu backup nanti", target: "fail_banding", correct: false, feedback: "Setiap menit pemakaian menambah risiko." },
        ],
      },
      {
        key: "n_smart", type: "DIAGNOSTIC", best: true,
        text: "Baca SMART & health disk (CrystalDiskInfo/HWiNFO).",
        options: [
          { label: "Banyak reallocated / pending sector", target: "n_klon", correct: true, feedback: "Media fisik perlu tindakan cepat." },
          { label: "Sehat, tanpa error", target: "n_ram", correct: true, feedback: "Kemungkinan di luar disk." },
        ],
      },
      {
        key: "n_klon", type: "ACTION", best: true,
        text: "Boot dari media eksternal (Live USB) lalu klon/bacakan data ke media sehat dengan ddrescue.",
        options: [
          { label: "Sebagian besar salinan berhasil", target: "n_verif", correct: true, feedback: "Amankan hasil, cek integritas." },
          { label: "Disk mati di tengah proses", target: "fail_mati", correct: false, feedback: "Recovery profesional bila nilai tinggi." },
        ],
      },
      {
        key: "n_verif", type: "DIAGNOSTIC", best: true,
        text: "Verifikasi integritas file penting pada hasil klon.",
        options: [
          { label: "Lengkap dan terbaca", target: "sol_selamat", correct: true, feedback: "Data aman, lanjut ke penyebab." },
          { label: "Sebagian tetap rusak", target: "n_recovery", correct: true, feedback: "Coba targeted recovery." },
        ],
      },
      {
        key: "n_recovery", type: "ACTION", best: true,
        text: "Gunakan tool recovery (mis. PhotoRec/TestDisk) untuk file penting tertentu.",
        options: [
          { label: "File penting pulih", target: "sol_rec", correct: true, feedback: "Sebagian file bisa diternakkan ulang." },
          { label: "Tidak semua", target: "sol_loss", correct: true, feedback: "Dokumentasikan kehilangan untuk mitigasi ke depan." },
        ],
      },
      {
        key: "n_ram", type: "DIAGNOSTIC", best: true,
        text: "SMART sehat tapi file korup - uji RAM (memtest/Windows Memory Diagnostic).",
        options: [
          { label: "RAM ditemukan error", target: "sol_ram", correct: true, feedback: "Korupsi bisa berasal dari RAM." },
          { label: "RAM aman", target: "sol_soft", correct: true, feedback: "Cek layer software/disk di lingkungan lain." },
        ],
      },
      { key: "sol_selamat", type: "SOLUTION", best: true, text: "Solusi: data diamankan - media asli dirawat/diganti sesuai tingkat kerusakan." },
      { key: "sol_rec", type: "SOLUTION", best: true, text: "Solusi: file penting dipulihkan target - mitigasi kehilangan tercatat." },
      { key: "sol_loss", type: "SOLUTION", best: true, text: "Solusi: sebagian file tak terbaca - jadikan pelajaran kebutuhan backup 3-2-1." },
      { key: "sol_ram", type: "SOLUTION", best: true, text: "Solusi: RAM bermasalah diganti - korupsi berhenti." },
      { key: "sol_soft", type: "SOLUTION", best: true, text: "Solusi: pemeriksaan lanjutan (software/disk lain) menemukan sumber lain." },
      { key: "fail_banding", type: "FAIL", text: "Menunda backup saat media sekarat - kerugian data permanen." },
      { key: "fail_mati", type: "FAIL", text: "Disk macet total - hentikan semua percobaan, serahkan ke spesialis bila berharga." },
    ],
  },

  // ------------------------------------------------ DISPLAY +2
  {
    title: "Layar 'No Signal' Setelah Update Driver Grafis",
    scenario:
      "Setelah pembaruan driver GPU, monitor tidak menerima sinyal 'No Signal'. Komputer berbunyi normal dan keyboard terlihat aktif (Caps Lock berkedip).",
    skill: "DISPLAY",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "No Signal persis setelah update driver. Jalur paling cepat?",
        options: [
          { label: "Boot Safe Mode / driver dasar", target: "n_safe", correct: true, feedback: "Sementara menonaktifkan driver biasa." },
          { label: "Uninstall driver dari mode normal", target: "fail_visual", correct: false, feedback: "Tanpa tampilan, percobaan berisiko buta." },
        ],
      },
      {
        key: "n_safe", type: "ACTION", best: true,
        text: "Restart berulang saat boot untuk masuk Recovery, lalu pilih Safe Mode.",
        options: [
          { label: "Tampil di Safe Mode", target: "n_rollback", correct: true, feedback: "Driver adalah tersangka." },
          { label: "Tetap No Signal di Safe Mode", target: "n_kabel", correct: true, feedback: "Jalur sinyal/kabel ikut dicurigai." },
        ],
      },
      {
        key: "n_rollback", type: "ACTION", best: true,
        text: "Rollback ke driver sebelumnya (atau bersihkan dengan DDU lalu pasang versi stabil).",
        options: [
          { label: "Tampil normal", target: "sol_drv", correct: true, feedback: "Driver baru tidak cocok." },
          { label: "Masih bermasalah", target: "n_hw", correct: true, feedback: "Curiga hardware." },
        ],
      },
      {
        key: "n_kabel", type: "DIAGNOSTIC", best: true,
        text: "Ganti kabel/port; coba port lain GPU dan iGPU (bila ada) untuk memisahkan jalur.",
        options: [
          { label: "Tampil di port lain", target: "sol_kabel", correct: true, feedback: "Port/kabel adalah sekat." },
          { label: "Tidak tampil juga", target: "n_hw", correct: true, feedback: "Mendekat ke GPU/panel." },
        ],
      },
      {
        key: "n_hw", type: "DIAGNOSTIC", best: true,
        text: "Uji GPU di komputer lain / reseat GPU & kabel power GPU.",
        options: [
          { label: "GPU terbukti rusak", target: "sol_gpu", correct: true, feedback: "Ternyata hardware." },
          { label: "GPU aman", target: "sol_drv", correct: true, feedback: "Kembali ke lapisan software." },
        ],
      },
      { key: "sol_drv", type: "SOLUTION", best: true, text: "Solusi: driver dikembalikan ke versi stabil - tampilan pulih." },
      { key: "sol_kabel", type: "SOLUTION", best: true, text: "Solusi: kabel/port diganti - sinyal normal kembali." },
      { key: "sol_gpu", type: "SOLUTION", best: true, text: "Solusi: GPU yang bermasalah diidentifikasi - rencanakan penggantian." },
      { key: "fail_visual", type: "FAIL", text: "Bekerja tanpa tampilan berisiko merusak pengaturan lebih jauh." },
    ],
  },
  {
    title: "Artefak Kotak-Kotak yang Semakin Sering",
    scenario:
      "Memunculkan artefak kotak-kotak di layar, awalnya hanya saat game berat, kini semakin sering bahkan saat desktop. Suhu GPU dilaporkan tinggi.",
    skill: "DISPLAY",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "Artefak kotak-kotak yang memburuk. Data apa yang dikumpulkan dulu?",
        options: [
          { label: "Catat suhu GPU saat idle & saat load", target: "n_suhu", correct: true, feedback: "Suhu menuntun ke panas vs driver." },
          { label: "Langsung ganti GPU", target: "fail_gpu", correct: false, feedback: "Bisa jadi hanya driver/panas." },
        ],
      },
      {
        key: "n_suhu", type: "DIAGNOSTIC", best: true,
        text: "Catat hasil HWMonitor/MSI Afterburner: suhu idle vs saat artefak muncul.",
        options: [
          { label: "Suhu tinggi saat artefak (>85C)", target: "n_termal", correct: true, feedback: "Panas memicu ketidakstabilan." },
          { label: "Suhu normal", target: "n_drv", correct: true, feedback: "Fokus evaluasi driver/clock." },
        ],
      },
      {
        key: "n_termal", type: "ACTION", best: true,
        text: "Bersihkan kipas/heatsink, periksa thermal paste GPU (atau vendor untuk kartu garansi).",
        options: [
          { label: "Stabil setelah dibersihkan", target: "sol_termal", correct: true, feedback: "Panas membuat VRAM tidak stabil." },
          { label: "Artefak masih muncul", target: "n_vram", correct: true, feedback: "Transisi ke cek VRAM/GPU." },
        ],
      },
      {
        key: "n_drv", type: "DIAGNOSTIC", best: true,
        text: "Pasang driver bersih (DDU) dan kembalikan clock ke default.",
        options: [
          { label: "Artefak hilang", target: "sol_drv", correct: true, feedback: "Driver/overclock yang bermasalah." },
          { label: "Masih muncul", target: "n_vram", correct: true, feedback: "Arah ke hardware." },
        ],
      },
      {
        key: "n_vram", type: "DIAGNOSTIC", best: true,
        text: "Turunkan clock VRAM/GPU dan jalankan uji stabilitas (mis. FurMark) untuk melihat batas.",
        options: [
          { label: "Menurunkan clock mengurangi artefak", target: "sol_limit", correct: true, feedback: "Batasi clock atau ganti kartu." },
          { label: "Artefak tetap meski clock rendah", target: "sol_gpu2", correct: true, feedback: "Kerusakan VRAM permanen." },
        ],
      },
      { key: "sol_termal", type: "SOLUTION", best: true, text: "Solusi: termal dibersihkan - GPU stabil di bawah beban." },
      { key: "sol_drv", type: "SOLUTION", best: true, text: "Solusi: driver bersih & clock default - artefak hilang." },
      { key: "sol_limit", type: "SOLUTION", best: true, text: "Solusi: batasi clock hingga stabil, atau rencanakan penggantian kartu." },
      { key: "sol_gpu2", type: "SOLUTION", best: true, text: "Solusi: VRAM terbukti rusak - GPU perlu diganti." },
      { key: "fail_gpu", type: "FAIL", text: "Mengganti GPU tanpa isolasi biaya tidak perlu bila akar adalah panas/driver." },
    ],
  },

  // ------------------------------------------------ PERIPHERAL +2
  {
    title: "Flashdisk Putus Koneksi Saat Menyalin Besar",
    scenario:
      "Flashdisk 64GB sering terputus ('disconnect') di tengah penyalinan file besar. Huruf drive muncul dan hilang berulang. Di port lain kadang lebih lama bertahan.",
    skill: "PERIPHERAL",
    difficulty: "EASY",
    targetSteps: 3,
    nodes: [
      {
        key: "start", type: "START",
        text: "Flashdisk putus saat transfer besar. Mulai dari mana?",
        options: [
          { label: "Uji di port lain & ganti kabel/hub", target: "n_port", correct: true, feedback: "Kemungkinan suplai arus terkecil biaya." },
          { label: "Langsung ganti flashdisk", target: "fail_media", correct: false, feedback: "Bisa jadi penyebabnya bukan media." },
        ],
      },
      {
        key: "n_port", type: "DIAGNOSTIC", best: true,
        text: "Colokkan ke port motherboard (belakang) langsung, ganti kabel ekstensi/hub.",
        options: [
          { label: "Stabil di port motherboard", target: "sol_port", correct: true, feedback: "Arus port mancuran yang lemah." },
          { label: "Masih putus", target: "n_power", correct: true, feedback: "Lanjut cek suplai daya." },
        ],
      },
      {
        key: "n_power", type: "DIAGNOSTIC", best: true,
        text: "Gunakan hub USB dengan power sendiri atau port dengan arus lebih besar (USB3, atau dual-head cable).",
        options: [
          { label: "Stabil setelah arus cukup", target: "sol_hub", correct: true, feedback: "Permintaan arus melebihi suplai." },
          { label: "Masih putus di mana pun", target: "n_media", correct: true, feedback: "Kemungkinan media." },
        ],
      },
      {
        key: "n_media", type: "DIAGNOSTIC", best: true,
        text: "Uji flashdisk di komputer lain yang sehat.",
        options: [
          { label: "Rusak juga di PC lain", target: "sol_media", correct: true, feedback: "Media memang bermasalah." },
          { label: "Normal di PC lain", target: "sol_isolasi", correct: true, feedback: "Masalah menempel di PC pertama." },
        ],
      },
      { key: "sol_port", type: "SOLUTION", best: true, text: "Solusi: port/kabel diperbaiki - transfer stabil." },
      { key: "sol_hub", type: "SOLUTION", best: true, text: "Solusi: arus ditingkatkan - putus koneksi hilang." },
      { key: "sol_media", type: "SOLUTION", best: true, text: "Solusi: flashdisk bermasalah - amankan data dan ganti." },
      { key: "sol_isolasi", type: "SOLUTION", best: true, text: "Solusi: masalah ada di sisi PC pertama - cek lebih lanjut kontroler USB." },
      { key: "fail_media", type: "FAIL", text: "Mengganti media tanpa diagnosis berbiaya percuma bila akar adalah port." },
    ],
  },
  {
    title: "Printer Jaringan 'Offline' di Semua Komputer",
    scenario:
      "Printer kantor berbasis jaringan menampilkan status 'Offline' di semua komputer sejak kemarin. Alarm LED printer menyala, dan halaman status tidak dicetak.",
    skill: "PERIPHERAL",
    difficulty: "MEDIUM",
    targetSteps: 4,
    nodes: [
      {
        key: "start", type: "START",
        text: "Printer offline di semua klien. Langkah pertama yang ampuh?",
        options: [
          { label: "Cetak halaman konfigurasi dari panel printer", target: "n_cfg", correct: true, feedback: "Membuktikan printer & jaringan itu sendiri." },
          { label: "Hapus semua printer di semua PC", target: "fail_hapus", correct: false, feedback: "Mengganggu banyak klien tanpa diagnosis." },
        ],
      },
      {
        key: "n_cfg", type: "DIAGNOSTIC", best: true,
        text: "Halaman konfigurasi berhasil/tidak? Cek IP printer tercetak di sana.",
        options: [
          { label: "Config page keluar dan IP printer BERUBAH", target: "n_ip", correct: true, feedback: "DHCP memberi IP baru - driver masih IP lama." },
          { label: "Config page keluar, IP SAMA", target: "n_ping", correct: true, feedback: "Lain: jalur jaringan / spooler." },
        ],
      },
      {
        key: "n_ip", type: "ACTION", best: true,
        text: "Perbarui port TCP/IP pada driver cetak semua klien ke IP printer yang baru.",
        options: [
          { label: "Cetak normal kembali", target: "sol_ip", correct: true, feedback: "Offline palsu karena IP lama." },
          { label: "Masih offline", target: "n_ping", correct: true, feedback: "Lanjut cek jalur jaringan." },
        ],
      },
      {
        key: "n_ping", type: "DIAGNOSTIC", best: true,
        text: "Ping IP printer dan amati LED LAN printer.",
        options: [
          { label: "Ping gagal / LED LAN mati", target: "n_kabel", correct: true, feedback: "Masalah di lapisan jaringan printer." },
          { label: "Ping berhasil / LED normal", target: "n_spool", correct: true, feedback: "Printer terhubung - masalah sisi OS." },
        ],
      },
      {
        key: "n_kabel", type: "ACTION", best: true,
        text: "Ganti kabel LAN & port switch printer, pastikan link LED menyala.",
        options: [
          { label: "Ping hidup & cetak OK", target: "sol_kabel", correct: true, feedback: "Link fisik diperbaiki." },
          { label: "Masih tidak terhubung", target: "fail_net", correct: false, feedback: "Cek setting jaringan printer / NIC." },
        ],
      },
      {
        key: "n_spool", type: "ACTION", best: true,
        text: "Restart spooler & bersihkan file SPOOL di komputer (atau server print).",
        options: [
          { label: "Cetak normal", target: "sol_spool", correct: true, feedback: "Queue/spooler macet." },
          { label: "Masih bermasalah", target: "n_drv", correct: true, feedback: "Pasang ulang driver printer." },
        ],
      },
      {
        key: "n_drv", type: "ACTION", best: true,
        text: "Install ulang driver printer (versi resmi) dan set port yang benar.",
        options: [
          { label: "Normal kembali", target: "sol_drv2", correct: true, feedback: "Driver rusak." },
          { label: "Masih gagal", target: "fail_drv", correct: false, feedback: "Book service atau ganti printer." },
        ],
      },
      { key: "sol_ip", type: "SOLUTION", best: true, text: "Solusi: IP driver diperbarui - offline palsu hilang." },
      { key: "sol_kabel", type: "SOLUTION", best: true, text: "Solusi: kabel/port LAN diperbaiki - printer online." },
      { key: "sol_spool", type: "SOLUTION", best: true, text: "Solusi: spooler di-bersihkan - antrean cetak normal." },
      { key: "sol_drv2", type: "SOLUTION", best: true, text: "Solusi: driver dipasang ulang - cetak stabil." },
      { key: "fail_hapus", type: "FAIL", text: "Menghapus konfigurasi semua klien tanpa diagnosis menambah pekerjaan." },
      { key: "fail_net", type: "FAIL", text: "Lapisan jaringan printer tersangka - dokumentasikan untuk perbaikan mendalam." },
      { key: "fail_drv", type: "FAIL", text: "Driver tidak menyelesaikan - dirujuk ke servis." },
    ],
  },
];