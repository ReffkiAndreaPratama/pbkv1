// TechTutor seed data - "Bengkel PC" repair simulation jobs.
// Setiap job = satu PC rusak. Pemain mendiagnosis komponen dengan alat,
// lalu memperbaikinya (ganti / reseat / bersihkan / sambung ulang) dan
// akhirnya menekan "Tes Nyala" untuk menyelesaikan misi.

export type RepairTool = "VISUAL" | "MULTIMETER" | "POST_CARD" | "SOFTWARE";
export type RepairFixType = "REPLACE" | "RESEAT" | "CLEAN" | "RECONNECT";

export type SeedRepairComponent = {
  key: string;
  name: string;
  category: "POWER" | "CORE" | "STORAGE" | "DISPLAY" | "PERIPHERAL" | "CABLE" | "NETWORK";
  slot: string;
  isFaulty?: boolean;
  fixType: RepairFixType;
  faultLabel?: string;
  inspectClue: string;
  readings?: Partial<Record<RepairTool, string>>;
  replacementName?: string;
};

export type SeedRepairJob = {
  title: string;
  scenario: string;
  symptom: string;
  skill: string; // Skill.code
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSec: number;
  maxHearts: number;
  components: SeedRepairComponent[];
};

export const REPAIR_JOBS: SeedRepairJob[] = [
  // ============================================================ POWER
  {
    title: "PC Mati Total di Lab",
    scenario:
      "Kamu dipanggil ke lab komputer. Satu unit PC sama sekali tidak bereaksi saat tombol power ditekan. Tidak ada LED, kipas tidak berputar, dan tidak ada bunyi beep.",
    symptom: "Tidak ada daya sama sekali — LED mati, kipas mati, tanpa beep.",
    skill: "POWER",
    difficulty: "EASY",
    timeLimitSec: 150,
    maxHearts: 3,
    components: [
      {
        key: "cable_power", name: "Kabel Power", category: "CABLE", slot: "cable_power",
        fixType: "RECONNECT",
        inspectClue: "Kabel power terpasang rapat di PSU dan stopkontak.",
        readings: { VISUAL: "Tidak ada luka atau kabel terkelupas." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        isFaulty: true, fixType: "REPLACE", faultLabel: "PSU mati — tidak mengeluarkan tegangan",
        replacementName: "PSU 500W baru",
        inspectClue: "Kipas PSU tidak berputar saat tombol power ditekan.",
        readings: {
          VISUAL: "Tidak ada LED indikator pada PSU.",
          MULTIMETER: "Output 12V = 0.0V, 5V = 0.0V. PSU tidak menghasilkan daya.",
        },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard bersih, tidak ada kapasitor menggembung.",
        readings: {
          VISUAL: "Tidak ada LED standby pada motherboard.",
          POST_CARD: "POST card tidak menyala karena tidak ada suplai daya.",
        },
      },
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        fixType: "RESEAT",
        inspectClue: "RAM terpasang kencang dan klip pengunci menutup.",
        readings: { POST_CARD: "Belum bisa diuji — daya belum tersedia." },
      },
      {
        key: "fan", name: "Kipas CPU", category: "CORE", slot: "fan",
        fixType: "CLEAN",
        inspectClue: "Kipas CPU berputar bebas, hanya sedikit debu.",
        readings: { VISUAL: "Debu ringan, tidak menghalangi putaran." },
      },
      {
        key: "monitor", name: "Monitor", category: "DISPLAY", slot: "monitor",
        fixType: "RECONNECT",
        inspectClue: "Monitor dan kabel display terpasang dengan benar.",
        readings: { VISUAL: "Monitor menyala normal saat dites di perangkat lain." },
      },
    ],
  },

  // ============================================================ BOOT
  {
    title: "Beep 3x & Tidak Mau Boot",
    scenario:
      "PC menyala — kipas berputar dan lampu power menyala — tetapi terdengar bunyi beep 3x dan layar tetap gelap. Sistem tidak pernah sampai ke logo Windows.",
    symptom: "Bunyi beep 3x berulang, tidak ada tampilan di layar.",
    skill: "BOOT",
    difficulty: "MEDIUM",
    timeLimitSec: 210,
    maxHearts: 3,
    components: [
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        isFaulty: true, fixType: "RESEAT", faultLabel: "RAM longgar — kontak tidak sempurna",
        inspectClue: "Modul RAM terlihat sedikit keluar dari slot; klip kiri tidak mengunci.",
        readings: {
          VISUAL: "Klip pengunci RAM kiri terbuka.",
          POST_CARD: "Kode beep 3x = kegagalan memori. POST card menampilkan kode 53 (memory error).",
        },
      },
      {
        key: "cmos", name: "Baterai CMOS", category: "CORE", slot: "cmos",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Baterai CMOS lemah — setting BIOS reset",
        replacementName: "Baterai CR2032 baru",
        inspectClue: "Baterai CMOS berkarat dan jam sistem selalu kembali ke tahun 2010.",
        readings: {
          VISUAL: "Baterai CMOS terlihat berkarat.",
          MULTIMETER: "Tegangan baterai CMOS 1.2V (seharusnya ±3V).",
        },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard bersih, tidak ada kerusakan fisik.",
        readings: { POST_CARD: "POST card hidup dan menampilkan kode." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU menyala normal, kipas berputar.",
        readings: { MULTIMETER: "Output 12V = 12.1V, 5V = 5.0V — normal." },
      },
      {
        key: "cpu", name: "Processor (CPU)", category: "CORE", slot: "cpu",
        fixType: "RESEAT",
        inspectClue: "CPU terpasang benar, thermal paste masih layak.",
        readings: { VISUAL: "Tidak ada pin bengkok." },
      },
      {
        key: "fan", name: "Kipas CPU", category: "CORE", slot: "fan",
        fixType: "CLEAN",
        inspectClue: "Kipas CPU berputar normal.",
        readings: { VISUAL: "Putaran normal, debu tipis." },
      },
      {
        key: "gpu", name: "Kartu VGA", category: "DISPLAY", slot: "gpu",
        fixType: "RESEAT",
        inspectClue: "VGA terpasang rapi pada slot PCIe.",
        readings: { VISUAL: "Kipas VGA berputar." },
      },
      {
        key: "cable_display", name: "Kabel Display", category: "CABLE", slot: "cable_display",
        fixType: "RECONNECT",
        inspectClue: "Kabel HDMI terpasang rapat.",
        readings: { VISUAL: "Konektor tidak bengkok." },
      },
    ],
  },

  // ============================================================ NETWORK
  {
    title: "Komputer Tidak Bisa Internet",
    scenario:
      "Komputer menyala normal dan bisa membuka aplikasi lokal, tetapi tidak bisa membuka internet. Ikon jaringan di taskbar bertanda silang merah.",
    symptom: "Tidak ada koneksi internet; ikon jaringan bertanda silang.",
    skill: "NETWORK",
    difficulty: "MEDIUM",
    timeLimitSec: 200,
    maxHearts: 3,
    components: [
      {
        key: "cable_lan", name: "Kabel LAN", category: "CABLE", slot: "cable_lan",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel LAN longgar / tidak terkunci",
        inspectClue: "Konektor RJ45 pada NIC tidak terkunci dan mudah lepas.",
        readings: {
          VISUAL: "Klip konektor RJ45 patah.",
          MULTIMETER: "Uji kontinuitas: pin 1 dan 2 putus. Kabel LAN rusak/longgar.",
        },
      },
      {
        key: "nic", name: "Kartu Jaringan (NIC)", category: "NETWORK", slot: "nic",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Kartu jaringan (NIC) rusak",
        replacementName: "NIC Gigabit PCIe baru",
        inspectClue: "LED indikator pada port LAN tidak menyala.",
        readings: {
          VISUAL: "Tidak ada lampu aktivitas pada port LAN.",
          SOFTWARE: "Adapter Ethernet tidak terdeteksi oleh sistem operasi.",
          POST_CARD: "NIC tidak muncul pada daftar perangkat.",
        },
      },
      {
        key: "router", name: "Router / Switch", category: "CORE", slot: "router",
        fixType: "RECONNECT",
        inspectClue: "Router menyala dan lampu LAN berkedip.",
        readings: { VISUAL: "Indikator router normal, port aktif." },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Tidak ada kerusakan." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan 12V dan 5V normal." },
      },
      {
        key: "cable_power", name: "Kabel Power", category: "CABLE", slot: "cable_power",
        fixType: "RECONNECT",
        inspectClue: "Kabel power rapat.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ STORAGE
  {
    title: "Windows Lambat & Bunyi Klik",
    scenario:
      "PC milik staf administrasi sangat lambat saat booting dan sering freeze. Dari dalam casing terdengar bunyi klik berulang setiap kali disk diakses.",
    symptom: "Booting sangat lama, sering freeze, bunyi klik dari casing.",
    skill: "STORAGE",
    difficulty: "HARD",
    timeLimitSec: 240,
    maxHearts: 3,
    components: [
      {
        key: "hdd", name: "Hard Disk (HDD)", category: "STORAGE", slot: "hdd",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Hard disk rusak — bad sector & bunyi klik",
        replacementName: "SSD 480GB baru",
        inspectClue: "Bunyi klik berulang dari HDD; status SMART menunjukkan peringatan.",
        readings: {
          VISUAL: "Bunyi mekanik klik saat disk diakses.",
          SOFTWARE: "SMART: Reallocated Sectors Count tinggi. Status: FAILED.",
        },
      },
      {
        key: "cable_data", name: "Kabel SATA", category: "CABLE", slot: "cable_data",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel SATA longgar",
        inspectClue: "Konektor SATA pada HDD tidak terkunci penuh.",
        readings: {
          VISUAL: "Konektor SATA miring.",
          MULTIMETER: "Kontinuitas kabel SATA terputus pada pin data.",
        },
      },
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        fixType: "RESEAT",
        inspectClue: "RAM normal.",
        readings: { SOFTWARE: "Memori lulus uji dasar." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan stabil." },
      },
      {
        key: "fan", name: "Kipas CPU", category: "CORE", slot: "fan",
        fixType: "CLEAN",
        inspectClue: "Kipas berdebu tetapi berputar.",
        readings: { VISUAL: "Debu ringan." },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ DISPLAY
  {
    title: "Layar Blank, PC Menyala",
    scenario:
      "PC menyala dan kipas berputar, tetapi monitor menampilkan 'No Signal' dan layar tetap hitam. Pengguna sempat memindahkan casing sebelum masalah muncul.",
    symptom: "PC menyala, monitor blank / No Signal.",
    skill: "DISPLAY",
    difficulty: "MEDIUM",
    timeLimitSec: 190,
    maxHearts: 3,
    components: [
      {
        key: "cable_display", name: "Kabel Display", category: "CABLE", slot: "cable_display",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel display longgar",
        inspectClue: "Kabel HDMI terlihat longgar pada port VGA.",
        readings: {
          VISUAL: "Konektor HDMI bengkok.",
          MULTIMETER: "Kontinuitas kabel display terputus.",
        },
      },
      {
        key: "gpu", name: "Kartu VGA", category: "DISPLAY", slot: "gpu",
        isFaulty: true, fixType: "RESEAT", faultLabel: "VGA tidak duduk sempurna",
        inspectClue: "Kartu VGA sedikit miring; klip PCIe tidak mengunci.",
        readings: {
          VISUAL: "Klip PCIe terbuka.",
          POST_CARD: "POST card berhenti pada kode VGA (kode 62).",
        },
      },
      {
        key: "monitor", name: "Monitor", category: "DISPLAY", slot: "monitor",
        fixType: "RECONNECT",
        inspectClue: "Monitor menyala dan menampilkan 'No Signal'.",
        readings: { VISUAL: "Monitor normal saat dites dengan laptop." },
      },
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        fixType: "RESEAT",
        inspectClue: "RAM normal.",
        readings: { POST_CARD: "Memori lolos POST." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan normal." },
      },
      {
        key: "fan", name: "Kipas CPU", category: "CORE", slot: "fan",
        fixType: "CLEAN",
        inspectClue: "Kipas normal.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ PERIPHERAL
  {
    title: "Printer Tidak Terdeteksi",
    scenario:
      "Printer di ruang guru menyala, tetapi komputer tidak mendeteksinya saat mencetak. Dokumen tertahan di antrean dan lampu error pada printer berkedip.",
    symptom: "Printer menyala tetapi tidak terdeteksi komputer.",
    skill: "PERIPHERAL",
    difficulty: "HARD",
    timeLimitSec: 220,
    maxHearts: 3,
    components: [
      {
        key: "cable_usb", name: "Kabel USB Printer", category: "CABLE", slot: "cable_usb",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel USB longgar",
        inspectClue: "Konektor USB terasa longgar di port printer.",
        readings: {
          VISUAL: "Konektor USB penyok.",
          MULTIMETER: "Kontinuitas kabel USB terputus.",
        },
      },
      {
        key: "printer", name: "Unit Printer", category: "PERIPHERAL", slot: "printer",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Unit printer rusak",
        replacementName: "Printer pengganti",
        inspectClue: "Printer mengeluarkan bunyi aneh dan lampu error berkedip.",
        readings: {
          VISUAL: "Lampu error berkedip merah.",
          SOFTWARE: "Printer tidak merespons perintah; status: offline/error.",
        },
      },
      {
        key: "keyboard", name: "Keyboard", category: "PERIPHERAL", slot: "keyboard",
        fixType: "RECONNECT",
        inspectClue: "Keyboard berfungsi normal.",
        readings: { SOFTWARE: "Input keyboard terdeteksi." },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Normal." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan normal." },
      },
      {
        key: "cable_power", name: "Kabel Power", category: "CABLE", slot: "cable_power",
        fixType: "RECONNECT",
        inspectClue: "Kabel power printer rapat.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ POWER (2)
  {
    title: "PC Restart Sendiri Saat Beban Berat",
    scenario:
      "PC di ruang multimedia tiba-tiba restart sendiri setiap kali dipakai untuk rendering video. Setelah restart, PC bisa menyala lagi seperti biasa.",
    symptom: "Restart mendadak saat beban tinggi; suhu terasa sangat panas.",
    skill: "POWER",
    difficulty: "MEDIUM",
    timeLimitSec: 210,
    maxHearts: 3,
    components: [
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        isFaulty: true, fixType: "REPLACE", faultLabel: "PSU tidak mampu menahan beban — tegangan drop",
        replacementName: "PSU 650W 80+ Bronze baru",
        inspectClue: "Tegangan 12V turun drastis saat CPU diberi beban penuh.",
        readings: {
          MULTIMETER: "12V drop ke 10.8V saat load; rail 5V ikut tidak stabil.",
          VISUAL: "Kipas PSU berputar pelan dan casing terasa panas.",
        },
      },
      {
        key: "fan", name: "Kipas CPU & Heatsink", category: "CORE", slot: "fan",
        isFaulty: true, fixType: "CLEAN", faultLabel: "Debu menumpuk — heatsink tersumbat",
        inspectClue: "Sirip heatsink CPU tertutup debu tebal; suhu idle sudah 78°C.",
        readings: {
          VISUAL: "Debu menutupi sirip heatsink dan kipas.",
          SOFTWARE: "Suhu CPU 92°C saat beban penuh; thermal throttling terdeteksi.",
        },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal, tidak ada kapasitor menggembung.",
        readings: { VISUAL: "Normal." },
      },
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        fixType: "RESEAT",
        inspectClue: "RAM terpasang rapat.",
        readings: { SOFTWARE: "Memori lulus uji beban." },
      },
      {
        key: "hdd", name: "Hard Disk (HDD)", category: "STORAGE", slot: "hdd",
        fixType: "REPLACE",
        inspectClue: "Disk sehat, suhu normal.",
        readings: { SOFTWARE: "SMART: OK." },
      },
      {
        key: "cable_power", name: "Kabel Power", category: "CABLE", slot: "cable_power",
        fixType: "RECONNECT",
        inspectClue: "Kabel power rapat.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ BOOT (2)
  {
    title: "Restart Loop Setelah Upgrade RAM",
    scenario:
      "Setelah menambah satu modul RAM, PC terus restart sebelum sempat menampilkan logo Windows. Pengguna panik dan mencabut colokan listrik.",
    symptom: "Restart berulang sebelum logo Windows; tidak ada bunyi beep panjang.",
    skill: "BOOT",
    difficulty: "MEDIUM",
    timeLimitSec: 200,
    maxHearts: 3,
    components: [
      {
        key: "ram", name: "RAM Baru", category: "CORE", slot: "ram",
        isFaulty: true, fixType: "RESEAT", faultLabel: "Modul RAM baru tidak terkunci sempurna",
        inspectClue: "Klip pengunci modul RAM baru belum menutup rapat.",
        readings: {
          VISUAL: "Klip kanan RAM masih terbuka.",
          POST_CARD: "POST berhenti di kode memori (kode 53).",
        },
      },
      {
        key: "cmos", name: "Baterai CMOS", category: "CORE", slot: "cmos",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Baterai CMOS lemah — setting BIOS kacau",
        replacementName: "Baterai CR2032 baru",
        inspectClue: "Jam BIOS kembali ke tahun 2010 setiap kali listrik dicabut.",
        readings: {
          MULTIMETER: "Tegangan baterai CMOS 1.1V (seharusnya ±3V).",
          VISUAL: "Baterai CMOS terlihat kusam.",
        },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Normal." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan 12V dan 5V normal." },
      },
      {
        key: "cpu", name: "Processor (CPU)", category: "CORE", slot: "cpu",
        fixType: "RESEAT",
        inspectClue: "CPU terpasang benar.",
        readings: { VISUAL: "Tidak ada pin bengkok." },
      },
      {
        key: "cable_display", name: "Kabel Display", category: "CABLE", slot: "cable_display",
        fixType: "RECONNECT",
        inspectClue: "Kabel display rapat.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ NETWORK (2)
  {
    title: "Internet Putus, IP Bentrok",
    scenario:
      "Dua komputer di ruang lab memakai alamat IP yang sama. Koneksi internet keduanya putus-nyambung dan muncul notifikasi IP conflict.",
    symptom: "Internet putus-nyambung; notifikasi IP address conflict.",
    skill: "NETWORK",
    difficulty: "MEDIUM",
    timeLimitSec: 200,
    maxHearts: 3,
    components: [
      {
        key: "router", name: "Router / Switch", category: "CORE", slot: "router",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "DHCP router bermasalah — IP ganda",
        inspectClue: "Lampu indikator router berkedip tidak beraturan dan DHCP gagal membagi IP.",
        readings: {
          VISUAL: "Indikator router berkedip kacau.",
          SOFTWARE: "IP conflict terdeteksi: dua host memakai alamat yang sama.",
        },
      },
      {
        key: "cable_lan", name: "Kabel LAN", category: "CABLE", slot: "cable_lan",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Konektor LAN longgar",
        inspectClue: "Konektor RJ45 pada switch tidak terkunci penuh.",
        readings: {
          VISUAL: "Klip RJ45 longgar.",
          MULTIMETER: "Kontinuitas pin data terputus-putus saat kabel digerakkan.",
        },
      },
      {
        key: "nic", name: "Kartu Jaringan (NIC)", category: "NETWORK", slot: "nic",
        fixType: "REPLACE",
        inspectClue: "NIC terdeteksi dan lampu port menyala.",
        readings: { SOFTWARE: "Adapter Ethernet aktif." },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Normal." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan normal." },
      },
      {
        key: "cable_power", name: "Kabel Power", category: "CABLE", slot: "cable_power",
        fixType: "RECONNECT",
        inspectClue: "Kabel power rapat.",
        readings: { VISUAL: "Normal." },
      },
    ],
  },

  // ============================================================ STORAGE (2)
  {
    title: "Drive D Hilang Setelah Casing Dibersihkan",
    scenario:
      "Setelah casing dibersihkan, drive D berisi data tugas tidak muncul lagi di Windows. Drive C tetap normal dan Windows bisa boot.",
    symptom: "Drive D tidak terdeteksi di File Explorer.",
    skill: "STORAGE",
    difficulty: "MEDIUM",
    timeLimitSec: 200,
    maxHearts: 3,
    components: [
      {
        key: "cable_data", name: "Kabel SATA Data", category: "CABLE", slot: "cable_data",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel SATA data terlepas",
        inspectClue: "Konektor SATA data pada drive D terlihat miring dan tidak terkunci.",
        readings: {
          VISUAL: "Konektor SATA data keluar sebagian dari drive.",
          MULTIMETER: "Kontinuitas kabel data terputus.",
        },
      },
      {
        key: "cable_sata_power", name: "Kabel Power SATA", category: "CABLE", slot: "cable_sata_power",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel power SATA tidak terpasang",
        inspectClue: "Drive D tidak mendapat suplai daya; konektor power SATA menggantung.",
        readings: {
          VISUAL: "Konektor power SATA lepas dari drive.",
          MULTIMETER: "Tidak ada tegangan 5V pada konektor power drive D.",
        },
      },
      {
        key: "hdd", name: "Drive D (HDD)", category: "STORAGE", slot: "hdd",
        fixType: "REPLACE",
        inspectClue: "Drive berputar normal saat diberi daya.",
        readings: { SOFTWARE: "SMART: OK; drive sehat." },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Normal." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan normal." },
      },
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        fixType: "RESEAT",
        inspectClue: "RAM normal.",
        readings: { SOFTWARE: "Memori lulus uji." },
      },
    ],
  },

  // ============================================================ DISPLAY (2)
  {
    title: "Layar Bergaris & Artefak",
    scenario:
      "Monitor menampilkan garis-garis warna dan artefak kotak-kotak, terutama saat membuka aplikasi grafis. PC sendiri tetap menyala dan tidak restart.",
    symptom: "Garis dan artefak di layar saat aplikasi grafis dibuka.",
    skill: "DISPLAY",
    difficulty: "HARD",
    timeLimitSec: 230,
    maxHearts: 3,
    components: [
      {
        key: "gpu", name: "Kartu VGA", category: "DISPLAY", slot: "gpu",
        isFaulty: true, fixType: "REPLACE", faultLabel: "GPU rusak — artefak & VRAM error",
        replacementName: "VGA GT 1030 baru",
        inspectClue: "Artefak muncul bahkan di BIOS; suhu GPU melonjak saat beban.",
        readings: {
          VISUAL: "Garis warna dan artefak di layar.",
          SOFTWARE: "GPU artifact test gagal; suhu GPU 95°C.",
          POST_CARD: "POST card menampilkan kode VGA (kode 62).",
        },
      },
      {
        key: "fan", name: "Kipas Casing", category: "CORE", slot: "fan",
        isFaulty: true, fixType: "CLEAN", faultLabel: "Aliran udara tersumbat debu",
        inspectClue: "Kipas casing dan filter depan tertutup debu tebal.",
        readings: {
          VISUAL: "Debu menutupi filter dan kipas casing.",
          SOFTWARE: "Suhu internal casing 48°C; aliran udara buruk.",
        },
      },
      {
        key: "monitor", name: "Monitor", category: "DISPLAY", slot: "monitor",
        fixType: "RECONNECT",
        inspectClue: "Monitor normal saat dites dengan laptop lain.",
        readings: { VISUAL: "Tidak ada garis saat memakai sumber lain." },
      },
      {
        key: "cable_display", name: "Kabel Display", category: "CABLE", slot: "cable_display",
        fixType: "RECONNECT",
        inspectClue: "Kabel HDMI terpasang rapat.",
        readings: { MULTIMETER: "Kontinuitas kabel display baik." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan normal." },
      },
      {
        key: "ram", name: "RAM", category: "CORE", slot: "ram",
        fixType: "RESEAT",
        inspectClue: "RAM normal.",
        readings: { POST_CARD: "Memori lolos POST." },
      },
    ],
  },

  // ============================================================ PERIPHERAL (2)
  {
    title: "Keyboard & Mouse Tidak Merespons",
    scenario:
      "Setelah kabel USB dipindah ke port depan, keyboard dan mouse berhenti merespons. Lampu Num Lock mati dan kursor tidak bergerak.",
    symptom: "Keyboard dan mouse mati; tidak ada input sama sekali.",
    skill: "PERIPHERAL",
    difficulty: "EASY",
    timeLimitSec: 180,
    maxHearts: 3,
    components: [
      {
        key: "cable_usb", name: "Kabel USB Hub", category: "CABLE", slot: "cable_usb",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel USB hub longgar",
        inspectClue: "Konektor USB hub tidak masuk penuh ke port depan.",
        readings: {
          VISUAL: "Konektor USB hub miring dan longgar.",
          MULTIMETER: "Kontinuitas kabel USB terputus saat digerakkan.",
        },
      },
      {
        key: "keyboard", name: "Keyboard", category: "PERIPHERAL", slot: "keyboard",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Keyboard rusak — tidak mengirim input",
        replacementName: "Keyboard USB baru",
        inspectClue: "Lampu Num Lock keyboard tidak menyala meski dites di port lain.",
        readings: {
          VISUAL: "Tidak ada lampu indikator keyboard.",
          SOFTWARE: "Perangkat USB tidak dikenali (unknown device).",
        },
      },
      {
        key: "mouse", name: "Mouse", category: "PERIPHERAL", slot: "mouse",
        fixType: "RECONNECT",
        inspectClue: "Mouse menyala dan sensor bekerja.",
        readings: { SOFTWARE: "Mouse terdeteksi normal." },
      },
      {
        key: "mobo", name: "Motherboard", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Normal." },
      },
      {
        key: "psu", name: "Power Supply (PSU)", category: "POWER", slot: "psu",
        fixType: "REPLACE",
        inspectClue: "PSU normal.",
        readings: { MULTIMETER: "Tegangan normal." },
      },
      {
        key: "monitor", name: "Monitor", category: "DISPLAY", slot: "monitor",
        fixType: "RECONNECT",
        inspectClue: "Monitor menampilkan desktop normal.",
        readings: { VISUAL: "Tampilan normal." },
      },
    ],
  },
];
