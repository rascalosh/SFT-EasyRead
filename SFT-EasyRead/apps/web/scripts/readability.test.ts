/**
 * Uji deterministik untuk metrik keterbacaan dan penjagaan ringkasan.
 * Tidak ada panggilan Gemini.
 *
 *   cd apps/web
 *   node --experimental-strip-types --test scripts/readability.test.ts
 *
 * Memakai node:test bawaan: vitest tidak terdaftar di package.json mana pun,
 * dan menambahnya butuh `npm install` yang diblokir devEngines.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { difficultySchema } from "@repo/schemas/summary"
import { syllabify } from "@repo/web/lib/syllabify"
import {
    countSyllables,
    fleschKincaidId,
    fleschReadingEaseId,
    hardWords,
    isAlreadyTerse,
    levelFromFk,
    measureDifficulty,
    offendingSentences,
    splitSentences,
} from "@repo/web/lib/readability"

// Modul ringkasan memuat klien Gemini saat di-import; kunci palsu hanya
// membungkam peringatan SDK — uji ini tidak pernah memanggil API.
process.env.GEMINI_API_KEY ??= "unused-in-tests"
const { inventedNumbers, readingSurface } = await import("@repo/web/lib/summarize")

type Anchor = { id: string; minLevel: number; maxLevel: number; text: string }

const anchors = JSON.parse(
    readFileSync(new URL("./fixtures/anchors.json", import.meta.url), "utf8"),
) as Anchor[]

function anchor(id: string) {
    const found = anchors.find((a) => a.id === id)
    if (!found) throw new Error(`Anchor ${id} tidak ada di fixtures/anchors.json`)
    return found.text
}

const NOTES = [
    "Rapat tim hari Senin",
    "- cek ulang desain halaman baca",
    "- siapkan data uji untuk kuis",
    "- jadwal demo minggu depan",
].join("\n")

function summary(summaryText: string, bulletPoints: string[]) {
    return { title: "Judul", summary: summaryText, bulletPoints }
}

test("rumus FK-id benar pada titik terukur", () => {
    // Catatan rapat SFT Day 2 dan esai Parkinson Law dari korpus EasyRead.
    assert.ok(Math.abs(fleschKincaidId(6.5, 2.241) - 2.8) < 0.05)
    assert.ok(Math.abs(fleschKincaidId(33.43, 2.656) - 16.3) < 0.06)

    // measureDifficulty memakai rumus yang sama dengan rata-rata mentahnya.
    const d = measureDifficulty(anchor("berita-sederhana"))
    assert.ok(Math.abs(d.fkId - fleschKincaidId(d.wordsPerSentence, d.syllablesPerWord)) < 0.02)
})

test("FRE-id masuk 0–100 tanpa dijepit, padahal tanpa koreksi negatif", () => {
    for (const id of ["berita-sederhana", "artikel-populer", "hukum"]) {
        const d = measureDifficulty(anchor(id))
        const uncorrected = 206.835 - 1.015 * d.wordsPerSentence - 84.6 * d.syllablesPerWord

        assert.ok(uncorrected < 0, `${id}: FRE tanpa koreksi ${uncorrected} mestinya negatif`)
        assert.ok(d.freId >= 0 && d.freId <= 100, `${id}: FRE-id ${d.freId} di luar 0–100`)
        assert.ok(Math.abs(d.freId - fleschReadingEaseId(d.wordsPerSentence, d.syllablesPerWord)) < 0.1)
    }

    for (const id of ["anak-sd-awal", "cerita-anak"]) {
        const { freId } = measureDifficulty(anchor(id))
        assert.ok(freId >= 0 && freId <= 100, `${id}: FRE-id ${freId} di luar 0–100`)
    }
})

test("FK-id 7 memetakan ke level 4 (ambang target tim)", () => {
    assert.equal(levelFromFk(7), 4)
    assert.equal(levelFromFk(3), 1)
    assert.equal(levelFromFk(15), 10)
    assert.equal(levelFromFk(-20), 1)
    assert.equal(levelFromFk(80), 10)
})

test("teks jangkar masuk rentang level yang diharapkan", () => {
    for (const { id, minLevel, maxLevel, text } of anchors) {
        const { level, fkId } = measureDifficulty(text)
        assert.ok(
            level >= minLevel && level <= maxLevel,
            `${id}: level ${level} (FK-id ${fkId}) di luar ${minLevel}–${maxLevel}`,
        )
    }
})

test("level naik seiring kalimat & kata memberat", () => {
    const short = measureDifficulty("Ibu pergi ke pasar. Ayah baca buku. Adik main bola di rumah.")
    const longerSentences = measureDifficulty(
        "Ibu pergi ke pasar dan ayah baca buku sementara adik main bola di rumah bersama teman.",
    )
    const longerWords = measureDifficulty(
        "Pemerintah memberlakukan pembatasan perdagangan. Masyarakat mempertanyakan kebijakan tersebut. Pengusaha mengkhawatirkan penurunan pendapatan.",
    )

    assert.ok(longerSentences.level > short.level, "kalimat lebih panjang harus lebih sulit")
    assert.ok(longerWords.level > short.level, "kata lebih panjang harus lebih sulit")

    const ladder = ["anak-sd-awal", "berita-sederhana", "artikel-populer", "hukum"]
        .map((id) => measureDifficulty(anchor(id)).fkId)
    for (let i = 1; i < ladder.length; i += 1) {
        assert.ok(ladder[i]! > ladder[i - 1]!, `urutan FK-id jangkar tidak naik: ${ladder.join(" -> ")}`)
    }
})

test("level selalu 1..10, termasuk teks kosong dan tanpa titik", () => {
    const noPunctuation = Array.from({ length: 500 }, () => "pembelajaran").join(" ")
    const samples = ["", "   \n\n ", "123 456.", noPunctuation, ...anchors.map((a) => a.text)]

    for (const text of samples) {
        const { level } = measureDifficulty(text)
        assert.ok(Number.isInteger(level) && level >= 1 && level <= 10, `level ${level} tidak sah`)
    }

    assert.equal(measureDifficulty("").level, 1)
    assert.equal(measureDifficulty(noPunctuation).level, 10)
})

test("hasil measureDifficulty selalu lolos skema yang disimpan", () => {
    for (const text of ["", NOTES, ...anchors.map((a) => a.text)]) {
        assert.doesNotThrow(() => difficultySchema.parse(measureDifficulty(text)))
    }
})

test("pemecah kalimat sadar singkatan dan angka berdesimal", () => {
    assert.deepEqual(
        splitSentences("Rapat dimulai pukul 10.00 pagi. Teksnya singkat, dll. tetapi bermakna. Rp 5.000 itu murah."),
        ["Rapat dimulai pukul 10.00 pagi.", "Teksnya singkat, dll. tetapi bermakna.", "Rp 5.000 itu murah."],
    )

    assert.equal(
        splitSentences("Teks dibacakan oleh Ir. Soekarno dan Drs. Mohammad Hatta. Semua orang bersorak gembira.").length,
        2,
    )
})

test("tiap baris daftar dihitung satu kalimat", () => {
    assert.deepEqual(splitSentences(NOTES), NOTES.split("\n"))

    const d = measureDifficulty(NOTES)
    assert.equal(d.sentences, 4)
    assert.ok(d.wordsPerSentence < 6, "daftar tidak boleh terbaca sebagai satu kalimat raksasa")
})

test("jumlah suku kata sama dengan Syllable Breaker", () => {
    const expected: Record<string, number> = { perjuangan: 4, menyerah: 3, indonesia: 5, pulau: 2 }

    for (const [word, count] of Object.entries(expected)) {
        assert.equal(countSyllables(word), count, word)
        assert.equal(countSyllables(word), syllabify(word).length, word)
    }
})

test("isAlreadyTerse membedakan catatan dari prosa", () => {
    assert.equal(isAlreadyTerse(NOTES), true)
    assert.equal(isAlreadyTerse(anchor("artikel-populer")), false)
    assert.equal(isAlreadyTerse(""), false)
})

test("offendingSentences hanya mengembalikan kalimat di atas batas", () => {
    const long = "Kucing kecil itu berlari cepat mengejar bola merah yang menggelinding di halaman rumah nenek kemarin sore."
    const text = `Kucing itu tidur di atas meja. ${long}`

    assert.deepEqual(offendingSentences(text, 12), [long])
    assert.deepEqual(offendingSentences("Kucing itu tidur di atas meja.", 12), [])
})

test("hardWords melewati nama diri, bukan kata di awal kalimat", () => {
    const words = hardWords("Kemerdekaan diproklamasikan oleh Soekarno di Pegangsaan.")

    assert.ok(words.includes("kemerdekaan"), "kata sulit di awal kalimat harus tetap tertangkap")
    assert.ok(words.includes("diproklamasikan"))
    assert.ok(!words.includes("soekarno"))
    assert.ok(!words.includes("pegangsaan"))

    // Penanda butir bukan kata: kata sesudahnya yang mengawali kalimat.
    assert.ok(hardWords("- Mengimplementasikan aturan baru di sekolah.").includes("mengimplementasikan"))
})

test("angka yang ditulis ulang bukan halusinasi", () => {
    const source = "Rapat dimulai pukul 10.00 pagi. Tiketnya seharga Rp 5.000 per orang."
    const candidate = summary("Rapat mulai jam 10 pagi.", [
        "Tiket 5000 per orang.",
        "Harga tiket Rp 5.000.",
        "Rapat diadakan pagi hari.",
    ])

    assert.deepEqual(inventedNumbers(source, candidate), [])
})

test("angka yang benar-benar baru tertangkap, termasuk di butir", () => {
    const source = "Warga berkumpul di balai desa untuk membahas rencana kerja bakti."

    assert.deepEqual(
        inventedNumbers(source, summary("Terjadi gempa 6 skala richter.", ["Warga berkumpul.", "Ada rapat.", "Kerja bakti."])),
        ["6"],
    )
    assert.deepEqual(
        inventedNumbers(source, summary("Warga berkumpul.", ["Ada 7 orang hadir.", "Ada rapat.", "Kerja bakti."])),
        ["7"],
    )
})

test("readingSurface memuat ringkasan dan semua butir, tanpa judul", () => {
    const parts = [
        "Ringkasan ini cukup pendek.",
        "Butir pertama berisi fakta.",
        "Butir kedua berisi contoh.",
        "Butir ketiga berisi saran.",
    ]
    const surface = readingSurface(summary(parts[0]!, parts.slice(1)))

    for (const part of parts) assert.ok(surface.includes(part), part)
    assert.ok(!surface.includes("Judul"))
    assert.equal(measureDifficulty(surface).sentences, 4, "butir ikut diukur, bukan cuma ringkasan")
})
