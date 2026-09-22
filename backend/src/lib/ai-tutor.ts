// TechTutor AI — Mock tutor with rule-based intent router.

export const SYSTEM_PROMPT = `
Kamu adalah "TechTutor AI", asisten tutor personal untuk mata kuliah Troubleshooting IT di aplikasi TechTutor. Berbahasa Indonesia, ramah, sabar, dan khas guru pembimbing.

PRINSIP UTAMA:
1. JANGAN pernah memberikan jawaban/solusi langkah-langkah UNTUK langkah yang sedang dihadapi siswa SEBELUM siswa mencoba dan menunjukkan usahanya minimal 1×.
2. Gunakan eskalasi: (a) pertanyaan pemancing (socratic), (b) hint konsep, (c) hint area, (d) baru langkah eksplisit — tiap level harus diminta atau muncul setelah kegagalan yang cukup.
3. Jika siswa bertanya jawaban langsung (misal "jawabannya apa"), tolak dengan lembut, beri satu pertanyaan pemancing, dan tawarkan hint level 2; JANGAN mempermalukan siswa.
4. Anggap semua gejala pada kasus berasal dari data kasus yang ada. Jangan mengarang gejala baru.
5. Keselamatan: jika solusi menyentuh hardware/tegangan, ingatkan untuk matikan daya dan gunakan antistatik SEBELUM menjelaskan.
6. Jawaban maksimal ~150 kata, terstruktur, dan selalu diakhiri satu pertanyaan atau satu langkah kecil yang bisa siswa coba.
7. Jika siswa di luar konteks kasus (bertanya konsep umum), jelaskan konsep dengan contoh analogi, lalu kaitkan ke troubleshooting.
`;

export type TutorIntent = "cheat" | "concept" | "hint" | "symptom" | "casual" | "unknown";

const CHEAT = /jawab(annya|an)\s*apa|kasih\s*tahu\s*(jawaban|solusi)|langsung\s*(bilang|kasih)|solusi\s*beserta|buka\s*jawabannya|donk\s*banget\s*jawaban/i;
const CONCEPT = /^.*(apa\s*(itu|sih)|kenapa|bagaimana\s*cara\s*kerja|perbedaan|manfaat|pengertian|macam[- ]?macam)/i;
const HINT = /\b(petunjuk|hint|bantu\s*aku|bisa\s*bantu|minta\s*hints?)\b/i;
const SYMPTOM = /\b(saya\s*(berpikir|curiga|menduga)|menurut\s*saya|kalau|jika|kemungkinan|aku\s*(pikir|curiga)|punya\s*ide)\b/i;
const CASUAL = /^(hai|halo|hey|hi|selamat|good\s*morning|hello|terima\s*kasih|makasih|oke|ok|sip)\b/i;

function detectIntent(message: string): TutorIntent {
  const m = message.toLowerCase();
  if (CHEAT.test(m)) return "cheat";
  if (HINT.test(m)) return "hint";
  if (CONCEPT.test(m)) return "concept";
  if (SYMPTOM.test(m)) return "symptom";
  if (CASUAL.test(m)) return "casual";
  return "unknown";
}

function wafResponse() {
  const picks = [
    "Sebelum saya menjelaskan lebih jauh, coba sebutkan dulu satu kemungkinan yang kamu pikirkan dari gejala yang ada.",
    "Bagus kamu bertanya! Tapi supaya pemahamanmu kokoh, coba jawab: dari deskripsi kasus ini, bagian mana yang paling berpotensi bermasalah?",
    "Saya tidak bisa langsung memberi jawabannya — tapi saya akan bantu: pikirkan urutan pemeriksaan logis dari gejala yang paling jelas dulu.",
  ];
  return picks[Math.floor(Math.random() * picks.length)];
}

function conceptResponse(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("dhcp"))
    return "DHCP (Dynamic Host Configuration Protocol) adalah layanan jaringan yang memberikan IP secara otomatis ke perangkat yang terhubung. Tanpa DHCP, kita harus set IP statis di setiap perangkat — rentan salah dan tidak praktis di jaringan besar. Pernahkah kamu melihat IP 169.254.x.x? Itu artinya DHCP tidak merespons. Coba cek layanan DHCP di routermu.";
  if (lower.includes("safe mode"))
    return "Safe Mode hanya memuat driver dan layanan dasar Windows. Berguna untuk memperbaiki masalah boot tanpa driver pihak ketiga yang mungkin konflik. Untuk masuk: Shift+Restart dari layar login. Kamu masuk Safe Mode di kasus yang mana?";
  if (lower.includes("post"))
    return "POST (Power On Self Test) adalah tes diri BIOS saat komputer baru menyala — memeriksa RAM, CPU, VGA, sebelum boot OS. Kode beep atau LED indikator memberi tahu komponen mana yang gagal. Kamu sedang menghadapi kode beep seperti apa?";
  if (lower.includes("ups"))
    return "UPS (Uninterruptible Power Supply) adalah baterai cadangan yang memberi daya beberapa menit saat listrik padam. Fungsi utamanya: menyalakan listrik sementara dan memberi waktu PC mati dengan benar. Kamu merencanakan instalasi UPS di mana?";
  if (lower.includes("usb"))
    return "USB Enumeration adalah proses OS mengenali perangkat saat dicolok. Gagal enum = device tidak terdeteksi. Coba ganti port, kabel, atau gunakan perangkat lain di port yang sama. Perangkatmu menggunakan port apa?";
  return "Konsep yang bagus! Untuk menjelaskannya secara praktis, bisa tolong sebutkan di konteks kasus troubleshooting yang mana kamu ingin memahami konsep ini? Saya akan mengaitkannya dengan contoh nyata.";
}

function symptomResponse(message: string, skillName?: string) {
  return `Hipotesismu menarik. Alasan di balik dugaan itu apa? Coba urutkan bukti-bukti dari gejala kasus yang kamu lihat. Setelah itu kita bisa memilih langkah diagnosis yang tepat bersama. Kamu berpikir itu masalah di ${skillName || "lapisan mana"}?`;
}

function casualResponse(name?: string) {
  const picks = [
    `Halo${name ? ", " + name : ""}! Siap belajar troubleshooting IT hari ini. Ada kasus atau materi yang mau kita mulai?`,
    `Hai! Hari ini mau perkuat skill troubleshooting yang mana? Coba cek rekomendasi di dashboard.`,
    `Mantap! Jangan ragu bertanya kalau ada yang stuck di kasus atau konsep. TechTutor AI siap bantu dengan petunjuk.`,
  ];
  return picks[Math.floor(Math.random() * picks.length)];
}

function unknownResponse() {
  return "Bisa tolong jelaskan lebih lanjut apa yang kamu butuhkan? Misalnya 'minta petunjuk' untuk soal ini, atau tanyakan konsep tertentu. Saya ingin membantu dengan tepat.";
}

export interface TutorRequest {
  message: string;
  skillName?: string;
  contextPage?: string;
}

export interface TutorResponse {
  reply: string;
  intent: TutorIntent;
}

export function respondToUser(req: TutorRequest): TutorResponse {
  const intent = detectIntent(req.message);
  switch (intent) {
    case "cheat":
      return { reply: wafResponse(), intent };
    case "concept":
      return { reply: conceptResponse(req.message), intent };
    case "hint":
      return { reply: "Untuk petunjuk yang lebih tepat, gunakan tombol '💡 Petunjuk' pada halaman kasus/simulasi — sistem akan memberi hint bertahap sesuai dengan langkahmu. Atau ceritakan bagian mana yang bikin stuck?", intent };
    case "symptom":
      return { reply: symptomResponse(req.message, req.skillName), intent };
    case "casual":
      return { reply: casualResponse(), intent };
    default:
      return { reply: unknownResponse(), intent };
  }
}