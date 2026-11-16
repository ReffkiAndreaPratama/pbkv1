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
  deviceType?: "PC" | "LAPTOP";
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

  // ============================================================ LAPTOP
  {
    title: "Laptop Mati Total Tanpa Daya",
    scenario:
      "Laptop milik mahasiswa tidak menyala sama sekali. Lampu indikator charger mati, dan laptop hanya hidup sebentar saat charger digerakkan. Baterai sudah lama tidak pernah diganti.",
    symptom: "Laptop tidak menyala; LED charger mati dan tidak ada respons saat tombol power ditekan.",
    skill: "POWER",
    deviceType: "LAPTOP",
    difficulty: "EASY",
    timeLimitSec: 170,
    maxHearts: 3,
    components: [
      {
        key: "charger", name: "Adaptor Charger", category: "POWER", slot: "charger",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Adaptor charger mati — tidak mengeluarkan tegangan",
        replacementName: "Adaptor charger 65W baru",
        inspectClue: "Lampu LED pada adaptor charger tidak menyala saat dicolok.",
        readings: {
          VISUAL: "Adaptor terasa dingin dan LED mati.",
          MULTIMETER: "Output adaptor 0.0V (seharusnya 19V). Adaptor rusak.",
        },
      },
      {
        key: "dc_jack", name: "Port DC Jack", category: "POWER", slot: "dc_jack",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Port DC jack longgar — koneksi terputus",
        replacementName: "DC jack laptop baru",
        inspectClue: "Konektor charger goyang di port dan sesekali memutus kontak.",
        readings: {
          VISUAL: "Pin tengah DC jack terlihat miring.",
          MULTIMETER: "Kontinuitas port terputus saat kabel charger digerakkan.",
        },
      },
      {
        key: "battery", name: "Baterai Laptop", category: "POWER", slot: "battery",
        fixType: "RESEAT",
        inspectClue: "Baterai terpasang benar, tetapi kapasitasnya sudah menurun.",
        readings: { VISUAL: "Tidak ada tanda baterai menggembung." },
      },
      {
        key: "power_button", name: "Tombol Power", category: "POWER", slot: "power_button",
        fixType: "RECONNECT",
        inspectClue: "Tombol power terasa normal saat ditekan.",
        readings: { VISUAL: "Tombol tidak macet." },
      },
      {
        key: "mobo", name: "Motherboard Laptop", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard bersih, tidak ada bekas korsleting.",
        readings: { VISUAL: "Tidak ada komponen gosong." },
      },
      {
        key: "laptop_fan", name: "Kipas Laptop", category: "CORE", slot: "laptop_fan",
        fixType: "CLEAN",
        inspectClue: "Kipas berdebu tipis tetapi masih bisa berputar.",
        readings: { VISUAL: "Debu ringan pada sirip kipas." },
      },
    ],
  },
  {
    title: "Layar Laptop Blank Saat Dibuka",
    scenario:
      "Laptop menyala dan lampu power aktif, tetapi layar tetap gelap. Saat tutup layar digerakkan sedikit, tampilan kadang muncul lalu hilang lagi.",
    symptom: "Layar blank; tampilan kadang muncul saat engsel layar digerakkan.",
    skill: "DISPLAY",
    deviceType: "LAPTOP",
    difficulty: "MEDIUM",
    timeLimitSec: 210,
    maxHearts: 3,
    components: [
      {
        key: "lcd_cable", name: "Kabel Flex LCD", category: "CABLE", slot: "lcd_cable",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel flex LCD longgar di engsel",
        inspectClue: "Kabel flex terjepit di area engsel dan konektornya tidak terkunci.",
        readings: {
          VISUAL: "Kabel flex terlipat tajam di dekat engsel.",
          MULTIMETER: "Kontinuitas kabel flex terputus saat engsel digerakkan.",
        },
      },
      {
        key: "hinge", name: "Engsel Layar", category: "CORE", slot: "hinge",
        isFaulty: true, fixType: "RESEAT", faultLabel: "Engsel kendor — menjepit kabel flex",
        inspectClue: "Engsel kiri terasa sangat kendor dan menekan jalur kabel.",
        readings: { VISUAL: "Engsel kiri goyang dan bautnya longgar." },
      },
      {
        key: "lcd", name: "Panel LCD", category: "DISPLAY", slot: "lcd",
        fixType: "REPLACE",
        inspectClue: "Panel LCD tidak retak dan tidak ada garis permanen.",
        readings: { VISUAL: "Tidak ada dead pixel atau retakan." },
      },
      {
        key: "webcam", name: "Kamera Webcam", category: "PERIPHERAL", slot: "webcam",
        fixType: "RECONNECT",
        inspectClue: "Webcam terpasang normal pada bezel atas.",
        readings: { VISUAL: "Lensa webcam bersih." },
      },
      {
        key: "mobo", name: "Motherboard Laptop", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal dan tidak ada kerusakan.",
        readings: { VISUAL: "Konektor display di motherboard utuh." },
      },
      {
        key: "battery", name: "Baterai Laptop", category: "POWER", slot: "battery",
        fixType: "RESEAT",
        inspectClue: "Baterai normal, tidak menggembung.",
        readings: { VISUAL: "Kondisi fisik baterai baik." },
      },
    ],
  },
  {
    title: "Laptop Cepat Panas & Mati Sendiri",
    scenario:
      "Laptop mati mendadak setelah 10–15 menit dipakai, terutama saat membuka banyak tab browser. Bagian bawah terasa sangat panas dan kipas terdengar berisik.",
    symptom: "Laptop overheat lalu mati sendiri; kipas berisik dan bagian bawah panas.",
    skill: "POWER",
    deviceType: "LAPTOP",
    difficulty: "MEDIUM",
    timeLimitSec: 220,
    maxHearts: 3,
    components: [
      {
        key: "laptop_fan", name: "Kipas Laptop", category: "CORE", slot: "laptop_fan",
        isFaulty: true, fixType: "CLEAN", faultLabel: "Kipas tersumbat debu — aliran udara tersendat",
        inspectClue: "Sirip kipas dipenuhi debu tebal dan putarannya berat.",
        readings: {
          VISUAL: "Debu menumpuk menutup sirip heatsink.",
          SOFTWARE: "Suhu CPU 95°C saat idle, kipas berputar tidak stabil.",
        },
      },
      {
        key: "thermal_paste", name: "Thermal Paste CPU", category: "CORE", slot: "thermal_paste",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Thermal paste kering — perpindahan panas buruk",
        replacementName: "Thermal paste baru",
        inspectClue: "Pasta thermal di atas CPU sudah kering dan retak.",
        readings: {
          VISUAL: "Pasta thermal mengeras dan tidak merata.",
          SOFTWARE: "Suhu CPU naik cepat meski beban ringan.",
        },
      },
      {
        key: "battery", name: "Baterai Laptop", category: "POWER", slot: "battery",
        fixType: "RESEAT",
        inspectClue: "Baterai tidak menggembung.",
        readings: { VISUAL: "Kondisi baterai normal." },
      },
      {
        key: "ram_sodimm", name: "RAM SODIMM", category: "CORE", slot: "ram_sodimm",
        fixType: "RESEAT",
        inspectClue: "RAM SODIMM terpasang rapi.",
        readings: { SOFTWARE: "Memori lulus uji dasar." },
      },
      {
        key: "ssd", name: "SSD NVMe", category: "STORAGE", slot: "ssd",
        fixType: "RESEAT",
        inspectClue: "SSD terpasang kencang dan tidak panas berlebih.",
        readings: { SOFTWARE: "SMART SSD: status sehat." },
      },
      {
        key: "charger", name: "Adaptor Charger", category: "POWER", slot: "charger",
        fixType: "REPLACE",
        inspectClue: "Charger mengeluarkan tegangan normal.",
        readings: { MULTIMETER: "Output 19.2V stabil." },
      },
    ],
  },
  {
    title: "Keyboard & Touchpad Laptop Mati",
    scenario:
      "Setelah laptop dibersihkan, keyboard dan touchpad sama sekali tidak merespons. Keyboard eksternal lewat USB tetap berfungsi normal.",
    symptom: "Keyboard internal dan touchpad tidak merespons; perangkat USB eksternal normal.",
    skill: "PERIPHERAL",
    deviceType: "LAPTOP",
    difficulty: "EASY",
    timeLimitSec: 180,
    maxHearts: 3,
    components: [
      {
        key: "keyboard_ribbon", name: "Kabel Ribbon Keyboard", category: "CABLE", slot: "keyboard_ribbon",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel ribbon keyboard tidak terkunci",
        inspectClue: "Konektor ribbon keyboard setengah keluar dari soket ZIF.",
        readings: {
          VISUAL: "Klip ZIF terbuka dan ribbon miring.",
          MULTIMETER: "Kontinuitas ribbon terputus pada beberapa pin.",
        },
      },
      {
        key: "touchpad_ribbon", name: "Kabel Ribbon Touchpad", category: "CABLE", slot: "touchpad_ribbon",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel ribbon touchpad terlepas",
        inspectClue: "Ribbon touchpad tidak terpasang pada soketnya.",
        readings: { VISUAL: "Konektor ribbon touchpad kosong." },
      },
      {
        key: "laptop_keyboard", name: "Keyboard Laptop", category: "PERIPHERAL", slot: "laptop_keyboard",
        fixType: "REPLACE",
        inspectClue: "Tombol keyboard tidak macet dan tidak ada cairan.",
        readings: { VISUAL: "Keycap lengkap, tidak ada kerusakan." },
      },
      {
        key: "touchpad", name: "Touchpad", category: "PERIPHERAL", slot: "touchpad",
        fixType: "RECONNECT",
        inspectClue: "Permukaan touchpad bersih dan tidak retak.",
        readings: { VISUAL: "Touchpad tidak penyok." },
      },
      {
        key: "usb_port", name: "Port USB", category: "PERIPHERAL", slot: "usb_port",
        fixType: "CLEAN",
        inspectClue: "Port USB berfungsi normal saat dites dengan mouse eksternal.",
        readings: { SOFTWARE: "Perangkat USB eksternal terdeteksi." },
      },
      {
        key: "battery", name: "Baterai Laptop", category: "POWER", slot: "battery",
        fixType: "RESEAT",
        inspectClue: "Baterai normal.",
        readings: { VISUAL: "Tidak ada kerusakan." },
      },
    ],
  },
  {
    title: "Laptop Tidak Menemukan Wi-Fi",
    scenario:
      "Laptop tidak menampilkan satu pun jaringan Wi-Fi. Ikon Wi-Fi hilang dari taskbar, tetapi koneksi LAN lewat adaptor USB berjalan normal.",
    symptom: "Tidak ada jaringan Wi-Fi terdeteksi; ikon Wi-Fi hilang dari taskbar.",
    skill: "NETWORK",
    deviceType: "LAPTOP",
    difficulty: "MEDIUM",
    timeLimitSec: 200,
    maxHearts: 3,
    components: [
      {
        key: "wifi_card", name: "Kartu Wi-Fi (M.2)", category: "NETWORK", slot: "wifi_card",
        isFaulty: true, fixType: "REPLACE", faultLabel: "Kartu Wi-Fi rusak — tidak terdeteksi sistem",
        replacementName: "Kartu Wi-Fi M.2 baru",
        inspectClue: "Kartu Wi-Fi terpasang, tetapi tidak muncul di Device Manager.",
        readings: {
          VISUAL: "Kartu Wi-Fi terpasang miring pada slot M.2.",
          SOFTWARE: "Adapter Wi-Fi tidak terdeteksi (code 10).",
          POST_CARD: "Perangkat jaringan nirkabel tidak terdaftar.",
        },
      },
      {
        key: "wifi_antenna", name: "Kabel Antena Wi-Fi", category: "CABLE", slot: "wifi_antenna",
        isFaulty: true, fixType: "RECONNECT", faultLabel: "Kabel antena Wi-Fi terlepas",
        inspectClue: "Kedua konektor antena (MAIN/AUX) terlepas dari kartu Wi-Fi.",
        readings: {
          VISUAL: "Kabel antena menggantung di samping kartu.",
          MULTIMETER: "Kontinuitas antena terputus.",
        },
      },
      {
        key: "router", name: "Router Wi-Fi", category: "CORE", slot: "router",
        fixType: "RECONNECT",
        inspectClue: "Router menyala dan memancarkan SSID normal.",
        readings: { VISUAL: "Lampu Wi-Fi router aktif." },
      },
      {
        key: "mobo", name: "Motherboard Laptop", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Slot M.2 bersih." },
      },
      {
        key: "battery", name: "Baterai Laptop", category: "POWER", slot: "battery",
        fixType: "RESEAT",
        inspectClue: "Baterai normal.",
        readings: { VISUAL: "Kondisi baik." },
      },
      {
        key: "charger", name: "Adaptor Charger", category: "POWER", slot: "charger",
        fixType: "REPLACE",
        inspectClue: "Charger normal.",
        readings: { MULTIMETER: "Tegangan output normal." },
      },
    ],
  },
  {
    title: "Laptop Lambat & SSD Nyaris Penuh",
    scenario:
      "Laptop bekas milik staf lambat saat booting dan sering freeze saat membuka file besar. Kapasitas penyimpanan tersisa sangat sedikit dan RAM terdeteksi lebih kecil dari yang seharusnya.",
    symptom: "Booting lambat, sering freeze, kapasitas storage nyaris penuh.",
    skill: "STORAGE",
    deviceType: "LAPTOP",
    difficulty: "HARD",
    timeLimitSec: 240,
    maxHearts: 3,
    components: [
      {
        key: "ssd", name: "SSD NVMe", category: "STORAGE", slot: "ssd",
        isFaulty: true, fixType: "REPLACE", faultLabel: "SSD rusak — banyak bad block dan kapasitas penuh",
        replacementName: "SSD NVMe 1TB baru",
        inspectClue: "SMART SSD menunjukkan banyak bad block dan sisa kapasitas < 3%.",
        readings: {
          VISUAL: "Stiker SSD menghitam, suhu tinggi saat diakses.",
          SOFTWARE: "SMART: Reallocated Blocks tinggi, status WARNING. Sisa kapasitas 2%.",
        },
      },
      {
        key: "ram_sodimm", name: "RAM SODIMM", category: "CORE", slot: "ram_sodimm",
        isFaulty: true, fixType: "RESEAT", faultLabel: "RAM SODIMM longgar — hanya 4GB terdeteksi",
        inspectClue: "Modul RAM kedua tidak terkunci penuh pada slot.",
        readings: {
          VISUAL: "Klip slot RAM bawah terbuka.",
          SOFTWARE: "RAM terdeteksi 4GB dari 8GB terpasang.",
        },
      },
      {
        key: "laptop_fan", name: "Kipas Laptop", category: "CORE", slot: "laptop_fan",
        fixType: "CLEAN",
        inspectClue: "Kipas berdebu dan putarannya sedikit berat.",
        readings: { VISUAL: "Debu menutup sebagian sirip kipas." },
      },
      {
        key: "battery", name: "Baterai Laptop", category: "POWER", slot: "battery",
        fixType: "RESEAT",
        inspectClue: "Baterai normal.",
        readings: { VISUAL: "Tidak menggembung." },
      },
      {
        key: "mobo", name: "Motherboard Laptop", category: "CORE", slot: "mobo",
        fixType: "RESEAT",
        inspectClue: "Motherboard normal.",
        readings: { VISUAL: "Slot RAM dan M.2 bersih." },
      },
      {
        key: "charger", name: "Adaptor Charger", category: "POWER", slot: "charger",
        fixType: "REPLACE",
        inspectClue: "Charger normal.",
        readings: { MULTIMETER: "Tegangan output stabil." },
      },
    ],
  },
];
