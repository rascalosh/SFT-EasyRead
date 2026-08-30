// Data tiruan (mock) untuk prototipe EasyRead AI.
// Semua konten "AI" di prototipe ini disimulasikan dari data ini.

export const user = {
  name: "Jiro-kun",
  level: 3,
  levelLabel: "Sedang Berkembang",
}

// Teks demo yang dipakai konsisten di seluruh layar.
export const demoTitle = "Perjuangan Bangsa Indonesia"

export const demoParagraphs = [
  "Perjuangan bangsa Indonesia untuk merdeka sangat panjang dan penuh rintangan.",
  "Para pahlawan tidak menyerah meskipun banyak cobaan yang datang.",
  "Mereka berjuang demi masa depan yang lebih baik bagi generasi selanjutnya.",
  "Semangat persatuan menjadi kunci utama untuk meraih kemerdekaan.",
]

export const originalText =
  "Proklamasi Kemerdekaan Indonesia dikumandangkan pada hari Jumat, 17 Agustus 1945, pukul 10.00 pagi di Jalan Pegangsaan Timur No. 56, Jakarta. Teks proklamasi dibacakan oleh Ir. Soekarno atas nama bangsa Indonesia, dengan didampingi oleh Drs. Mohammad Hatta. Peristiwa bersejarah ini merupakan puncak dari perjuangan panjang rakyat Indonesia melawan penjajahan selama lebih dari tiga setengah abad."

export const simplifiedText =
  "Proklamasi Kemerdekaan Indonesia terjadi pada 17 Agustus 1945, pukul 10 pagi di Jalan Pegangsaan Timur No. 56, Jakarta. Ir. Soekarno membacakan teks proklamasi. Drs. Mohammad Hatta mendampinginya. Peristiwa ini adalah perjuangan panjang rakyat Indonesia melawan penjajah lebih dari 350 tahun."

export const summaryPoints = [
  "Proklamasi dibacakan pada 17 Agustus 1945 oleh Ir. Soekarno.",
  "Drs. Mohammad Hatta mendampingi saat pembacaan proklamasi.",
  "Peristiwa ini puncak perjuangan panjang melawan penjajahan lebih dari 350 tahun.",
  "Kemerdekaan menjadi awal berdirinya negara Indonesia.",
]

export type ReadingHistory = {
  id: string
  title: string
  meta: string
  progress: number
  pages: number
}

export const readingHistory: ReadingHistory[] = [
  { id: "r1", title: "Perjuangan Bangsa Indonesia", meta: "Dibaca 2 menit lalu", progress: 60, pages: 12 },
  { id: "r2", title: "Manfaat Membaca Setiap Hari", meta: "Dibaca 8 menit lalu", progress: 40, pages: 8 },
  { id: "r3", title: "Sejarah Indonesia Singkat", meta: "Dibaca 2 hari lalu", progress: 55, pages: 16 },
  { id: "r4", title: "Teknologi di Masa Depan", meta: "Dibaca 5 hari lalu", progress: 30, pages: 10 },
]

const SESSION_KEY = "easyread-materials"

export function getSessionMaterials(): ReadingHistory[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as ReadingHistory[]) : []
  } catch {
    return []
  }
}

export function saveSessionMaterial(material: ReadingHistory) {
  if (typeof window === "undefined") return
  const next = [material, ...getSessionMaterials().filter((item) => item.id !== material.id)]
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
}

export function listMaterials(): ReadingHistory[] {
  const extra = getSessionMaterials()
  const extraIds = new Set(extra.map((item) => item.id))
  return [...extra, ...readingHistory.filter((item) => !extraIds.has(item.id))]
}

export function findMaterial(id: string): ReadingHistory | undefined {
  return listMaterials().find((item) => item.id === id)
}

export const readingTips = [
  { title: "Ketuk kata yang sulit", body: "Ketuk kata untuk melihat pemecahan suku kata, pengucapan, dan arti sederhana." },
  { title: "Baca perlahan", body: "Ucapkan suku kata satu per satu untuk membantu pemahaman." },
  { title: "Ulangi jika perlu", body: "Dengarkan pengucapan dan baca ulang sampai kamu lebih lancar." },
]

export type Syllable = {
  word: string
  breakdown: string
  meaning: string
  checkedAgo: string
}

export const syllableWords: Syllable[] = [
  { word: "perjuangan", breakdown: "per - ju - ang - an", meaning: "usaha atau proses untuk mencapai sesuatu yang penting.", checkedAgo: "Baru saja" },
  { word: "kemerdekaan", breakdown: "ke - mer - de - ka - an", meaning: "keadaan bebas dari penjajahan.", checkedAgo: "2 menit lalu" },
  { word: "mengorbankan", breakdown: "meng - or - ban - kan", meaning: "memberikan sesuatu yang berharga demi tujuan.", checkedAgo: "5 menit lalu" },
  { word: "rintangan", breakdown: "rin - tang - an", meaning: "hal yang menghalangi atau mempersulit.", checkedAgo: "8 menit lalu" },
  { word: "inspirasi", breakdown: "in - spi - ra - si", meaning: "dorongan atau ide yang muncul untuk berbuat sesuatu.", checkedAgo: "10 menit lalu" },
]

export type QuizQuestion = {
  prompt: string
  keywords: string[]
}

export const quizQuestions: QuizQuestion[] = [
  { prompt: "Apa ide utama dari bacaan tersebut?", keywords: ["perjuangan", "merdeka", "kemerdekaan", "pahlawan"] },
  { prompt: "Mengapa para pahlawan tetap berjuang?", keywords: ["masa depan", "generasi", "baik", "menyerah"] },
  { prompt: "Apa kunci untuk meraih kemerdekaan menurut bacaan?", keywords: ["persatuan", "semangat", "bersatu"] },
]

// Skor penilaian membaca (Personalized Mode).
export const readingScores = [
  { label: "Kelancaran Membaca", score: 85, note: "Baik" },
  { label: "Kecepatan Membaca", score: 92, note: "Sangat Baik" },
  { label: "Jeda", score: 70, note: "Cukup" },
  { label: "Pengulangan Kata", score: 88, note: "Baik" },
  { label: "Akurasi Pengucapan", score: 90, note: "Sangat Baik" },
]

export const progressStats = [
  { label: "Level Membaca", value: "Level 3", note: "Sedang Berkembang" },
  { label: "Total Sesi", value: "18 Sesi", note: "12 jam 45 menit" },
  { label: "Rata-rata Pemahaman", value: "86%", note: "Sangat Baik" },
  { label: "Streak Aktivitas", value: "7 Hari", note: "Pertahankan semangat!" },
]

export const comprehensionTrend = [
  { week: "Minggu 1", value: 62 },
  { week: "Minggu 2", value: 70 },
  { week: "Minggu 3", value: 78 },
  { week: "Minggu 4", value: 86 },
]

export const achievements = [
  { title: "Pembaca Konsisten", body: "Aktif membaca 7 hari berturut-turut.", date: "20 Mei 2026" },
  { title: "Pemahaman Hebat", body: "Capai rata-rata pemahaman ≥ 80%.", date: "18 Mei 2026" },
  { title: "Kelancaran Meningkat", body: "Kelancaran membaca naik ≥ 30%.", date: "15 Mei 2026" },
]

export const practiceRecs = [
  { title: "Kuis Pemahaman: Energi Terbarukan", body: "Latih pemahaman dengan bacaan baru." },
  { title: "Latihan Membaca: Cuaca Ekstrem", body: "Tingkatkan kelancaran dan akurasi pengucapan." },
  { title: "Latihan Kata: Imbuhan", body: "Pecah kata panjang jadi suku kata." },
]

export const recentActivity = [
  { date: "20 Mei 2026", activity: "Kuis Pemahaman", mode: "Standar", task: "Perjuangan Bangsa Indonesia", result: "86%", status: "Paham" as const },
  { date: "19 Mei 2026", activity: "Penilaian Membaca", mode: "Personalized", task: "Manfaat Membaca Setiap Hari", result: "88%", status: "Paham" as const },
  { date: "18 Mei 2026", activity: "Kuis Pemahaman", mode: "Standar", task: "Teknologi di Masa Depan", result: "58%", status: "Belum Paham" as const },
  { date: "16 Mei 2026", activity: "Penilaian Membaca", mode: "Personalized", task: "Sejarah Indonesia", result: "82%", status: "Paham" as const },
]
