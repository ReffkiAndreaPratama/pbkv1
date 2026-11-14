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
];
