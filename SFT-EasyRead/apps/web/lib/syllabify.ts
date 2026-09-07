/**
 * Pemecah suku kata Bahasa Indonesia — rule-based, tanpa AI.
 *
 * PLAN.md meminta pemecahan suku kata dikerjakan aturan, bukan Gemini, supaya
 * hasilnya deterministik dan tidak memakan kuota. Fungsi ini murni (tidak
 * menyentuh jaringan atau DOM) sehingga bisa diuji langsung.
 *
 * Urutan keputusan:
 *   1. Kamus pengecualian.
 *   2. Kupas akhiran (-nya, -kan, -an) bila sisa katanya masih masuk akal.
 *   3. Kupas awalan meng-/peng- bila diikuti vokal.
 *   4. Aturan fonotaktik pada sisa kata.
 */

const VOWELS = new Set(["a", "i", "u", "e", "o"])

/** Digraf yang bunyinya satu konsonan, jadi tidak boleh dipisah. */
const DIGRAPHS = ["ng", "ny", "sy", "kh"]

/** Diftong hanya dianggap satu inti suku kata di akhir kata (san-tai, pu-lau). */
const DIPHTHONGS = ["ai", "au", "oi"]

/**
 * Kata yang aturannya meleset. Sebagian besar karena batas morfem tidak bisa
 * ditebak tanpa kamus akar kata (mis. "beracun" = ber+racun, bukan ber+acun).
 */
const EXCEPTIONS: Record<string, string[]> = {
    perempuan: ["pe", "rem", "pu", "an"],
    beracun: ["be", "ra", "cun"],
    berakhir: ["ber", "a", "khir"],
    berapa: ["be", "ra", "pa"],
    keluarga: ["ke", "lu", "ar", "ga"],
    manusia: ["ma", "nu", "si", "a"],
    indonesia: ["in", "do", "ne", "si", "a"],
    proklamasi: ["prok", "la", "ma", "si"],
    kemerdekaan: ["ke", "mer", "de", "ka", "an"],
    pengetahuan: ["pe", "nge", "ta", "hu", "an"],
    // ter-/ber- sebelum vokal ambigu: "terangkat" = ter+angkat tapi "terasa" =
    // te+rasa dan "terang" kata dasar. Tidak ada aturan aman tanpa kamus akar.
    terangkat: ["ter", "ang", "kat"],
    terambil: ["ter", "am", "bil"],
    terikat: ["ter", "i", "kat"],
    teringat: ["ter", "ing", "at"],
}

/** Akhiran yang layak dikupas, diurutkan dari yang terpanjang. */
const SUFFIXES = ["nya", "kan", "an"]

/**
 * Sisa kata minimal setelah akhiran dikupas. Angka 4 dipilih karena membedakan
 * akhiran sungguhan dari kata dasar yang kebetulan berakhiran sama:
 * "lapangan" → "lapang" (6, dikupas) tapi "makan" → "mak" (3, tidak dikupas).
 */
const MIN_STEM_LENGTH = 4

type Unit = { text: string; isVowel: boolean }

/** Pecah kata jadi unit bunyi: digraf & diftong akhir dihitung satu unit. */
function toUnits(word: string): Unit[] {
    const units: Unit[] = []
    let i = 0

    while (i < word.length) {
        const pair = word.slice(i, i + 2)

        if (DIGRAPHS.includes(pair)) {
            units.push({ text: pair, isVowel: false })
            i += 2
            continue
        }

        // Diftong hanya di akhir kata: "pu-lau" tapi "ma-in".
        if (DIPHTHONGS.includes(pair) && i + 2 === word.length) {
            units.push({ text: pair, isVowel: true })
            i += 2
            continue
        }

        const char = word[i]!
        units.push({ text: char, isVowel: VOWELS.has(char) })
        i += 1
    }

    return units
}

/**
 * Aturan fonotaktik: setiap inti vokal jadi satu suku kata, konsonan di
 * antaranya dibagi — satu konsonan jadi awalan suku berikutnya (ba-ngun), dua
 * atau lebih menyisakan satu sebagai penutup (man-di, in-stru-men).
 */
function syllabifyCore(word: string): string[] {
    const units = toUnits(word)
    const nuclei = units.map((u, i) => (u.isVowel ? i : -1)).filter((i) => i >= 0)

    if (nuclei.length === 0) return [word]

    // Titik mulai tiap suku kata. Batas suku kata n adalah titik mulai suku n+1,
    // sehingga konsonan penutup ikut ke suku sebelumnya dan tidak hilang.
    const starts = nuclei.map((nucleus, n) => {
        if (n === 0) return 0

        const prevNucleus = nuclei[n - 1]!
        const gap = nucleus - prevNucleus - 1

        // 0 konsonan → pisah tepat setelah inti sebelumnya.
        // 1 konsonan → jadi awalan suku ini.
        // ≥2 konsonan → satu jadi penutup suku sebelumnya, sisanya ke sini.
        return gap <= 1 ? prevNucleus + 1 : prevNucleus + 2
    })

    return starts.map((start, n) => {
        const end = n === starts.length - 1 ? units.length : starts[n + 1]!

        return units
            .slice(start, end)
            .map((u) => u.text)
            .join("")
    })
}

function hasVowel(word: string) {
    return [...word].some((c) => VOWELS.has(c))
}

function startsWithVowel(word: string) {
    return VOWELS.has(word[0] ?? "")
}

/** Pecah satu kata jadi daftar suku kata. */
export function syllabify(rawWord: string): string[] {
    const word = rawWord.toLowerCase().replace(/[^a-z]/g, "")

    if (!word) return []
    if (word.length <= 3 && !hasVowel(word)) return [word]

    const exception = EXCEPTIONS[word]
    if (exception) return [...exception]

    // Awalan meng-/peng- sebelum vokal: nasalnya tetap menempel di awalan
    // (meng-am-bil), berbeda dari meny- yang justru luruh ke suku berikutnya
    // (me-nye-rah) sehingga sengaja tidak dikupas.
    for (const prefix of ["meng", "peng"]) {
        if (!word.startsWith(prefix)) continue

        const stem = word.slice(prefix.length)
        if (stem.length < 3 || !startsWithVowel(stem)) continue

        return [prefix, ...syllabify(stem)]
    }

    // Akhiran: hanya dikupas kalau sisa katanya cukup panjang dan masih bervokal.
    for (const suffix of SUFFIXES) {
        if (!word.endsWith(suffix)) continue

        const stem = word.slice(0, -suffix.length)
        if (stem.length < MIN_STEM_LENGTH || !hasVowel(stem)) continue
        if (/[wy]$/.test(stem)) continue

        return [...syllabify(stem), suffix]
    }

    return syllabifyCore(word)
}

/** Format yang dirender komponen: "per - ju - ang - an". */
export function formatBreakdown(syllables: string[]) {
    return syllables.join(" - ")
}

/** Pemecahan siap pakai untuk satu kata. */
export function breakdownOf(word: string) {
    return formatBreakdown(syllabify(word))
}
