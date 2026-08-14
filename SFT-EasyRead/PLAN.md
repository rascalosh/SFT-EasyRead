# EasyRead AI — Skenario A dengan Turborepo

## Ringkasan

EasyRead AI dibangun sebagai monorepo menggunakan Turborepo dan pnpm:

- Next.js PWA untuk aplikasi pengguna.
- FastAPI untuk inference model open-source pada laptop tim.
- Supabase untuk autentikasi dan penyimpanan.
- Gemini free API hanya untuk simplifikasi, ringkasan, dan kuis.
- PP-OCRv5 untuk OCR Bahasa Indonesia.
- faster-whisper untuk asesmen membaca.
- Rule-based engine untuk suku kata, metrik membaca, dan rekomendasi.
- Deadline MVP final: 20 September 2026.

## Struktur Monorepo

```text
easyread-ai/
├── apps/
│   ├── web/                       # Next.js PWA
│   └── ml-api/                    # FastAPI + model open source
├── packages/
│   ├── ui/                        # Komponen UI aksesibel
│   ├── api-client/                # Generated TypeScript client
│   ├── schemas/                   # Zod schemas dan shared constants
│   ├── eslint-config/
│   └── typescript-config/
├── tooling/
│   ├── scripts/                   # Model setup dan benchmark
│   └── docker/                    # Docker configuration
├── docs/
│   ├── architecture.md
│   ├── model-card.md
│   ├── evaluation.md
│   └── demo-runbook.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── compose.yaml
└── .env.example
```

### `apps/web`

Menangani:

- Autentikasi dan onboarding.
- Dashboard.
- Upload teks, gambar, dan PDF.
- Reading interface ramah disleksia.
- TTS dan highlight.
- Simplifikasi serta ringkasan.
- Syllable breaker.
- Kuis pemahaman.
- Perekaman asesmen suara.
- Progress dan achievement.
- Server routes untuk Gemini dan database.

### `apps/ml-api`

FastAPI Python yang menangani:

- PP-OCRv5 Bahasa Indonesia.
- Ekstraksi teks PDF.
- faster-whisper.
- Word alignment.
- Perhitungan WPM dan WER.
- Deteksi jeda, kata terlewat, dan pengulangan.
- Semantic similarity.
- Syllable breaker.
- Model health check.

Folder ini memiliki:

- `pyproject.toml` untuk dependency Python.
- `package.json` tipis agar perintah Python dapat dijalankan melalui Turbo.
- `uv.lock` untuk dependency yang reproducible.
- Test unit dan integration Python.

Contoh script wrapper:

```json
{
  "scripts": {
    "dev": "uv run uvicorn easyread_ml.main:app --reload",
    "build": "uv run python -m compileall easyread_ml",
    "lint": "uv run ruff check .",
    "typecheck": "uv run mypy easyread_ml",
    "test": "uv run pytest"
  }
}
```

### Shared packages

`packages/ui` berisi komponen aksesibel:

- Button.
- Dialog.
- Reading toolbar.
- Focus ruler.
- Audio controls.
- Progress card.
- Error dan loading state.

`packages/schemas` berisi:

- Zod schemas Gemini.
- Shared enum.
- Batas ukuran dan durasi.
- Tipe hasil kuis.
- Tipe preferensi membaca.

`packages/api-client` dihasilkan dari OpenAPI FastAPI menggunakan `openapi-typescript`. FastAPI menjadi sumber kebenaran kontrak ML API sehingga tipe frontend tidak ditulis manual.

## Konfigurasi Turborepo

Pipeline utama:

```text
dev
build
lint
typecheck
test
test:e2e
contracts:generate
models:verify
```

Aturan dependency:

- `build` menunggu `^build`.
- `typecheck` menunggu `contracts:generate`.
- `test:e2e` menunggu build web dan health check ML API.
- `dev` bersifat persistent dan tidak di-cache.
- `lint`, `typecheck`, serta unit test dapat di-cache.
- Model ML, audio sementara, `.next`, cache Python, dan secrets tidak masuk Turbo cache.

Environment variable yang harus dideklarasikan di `turbo.json`:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ML_API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `ML_API_TOKEN`
- `ML_DEVICE`
- `WHISPER_MODEL`
- `MODEL_CACHE_DIR`

Secret hanya tersedia pada aplikasi yang memerlukannya dan tidak dimasukkan ke output cache.

## Arsitektur Runtime

```text
Browser
   │
   ├── Next.js web
   │     ├── Supabase
   │     └── Gemini API
   │
   └── HTTPS tunnel
          └── FastAPI pada laptop
                ├── PP-OCRv5
                ├── faster-whisper
                ├── MiniLM
                └── Rule-based analyzer
```

### Mode demo utama

- Web di-deploy ke Vercel.
- FastAPI berjalan pada laptop tim.
- ML API dibuka melalui HTTPS tunnel.
- Frontend menggunakan `NEXT_PUBLIC_ML_API_URL`.
- CORS hanya menerima frontend resmi dan localhost.
- ML API membutuhkan bearer token demo.
- Semua model sudah diunduh sebelum presentasi.

### Mode fallback

Seluruh monorepo dapat dijalankan lokal:

```text
pnpm dev
```

Perintah tersebut menjalankan:

- Next.js.
- FastAPI.
- Pemeriksaan model.
- Local reverse proxy.

Browser mengakses Next.js lokal sehingga aplikasi tetap berjalan tanpa tunnel. Respons Gemini yang diperlukan untuk skenario demo disiapkan dalam cache.

## Pipeline AI/ML

### OCR

- Gunakan PP-OCRv5 Mobile dengan `lang=id`.
- Input: JPG, PNG, atau PDF maksimal 10 MB dan 10 halaman.
- Koreksi orientasi dan normalisasi gambar sebelum inference.
- Urutkan hasil OCR menjadi baris dan paragraf.
- Tampilkan hasil pada editor sebelum disimpan.
- Simpan confidence dan warning.

PP-OCRv5 menyediakan konfigurasi Bahasa Indonesia melalui `lang=id`. [Dokumentasi PaddleOCR](https://paddlepaddle.github.io/PaddleOCR/v3.1.0/en/version3.x/algorithm/PP-OCRv5/PP-OCRv5_multi_languages.html)

Target:

- Character Error Rate median maksimal 10% pada gambar baik.
- Satu halaman selesai maksimal lima detik pada laptop demo.

### Simplifikasi dan ringkasan

Gemini digunakan untuk:

- Menyederhanakan kalimat.
- Membuat ringkasan.
- Menjelaskan istilah sulit.
- Membuat kuis.
- Mengevaluasi jawaban bebas.

Aturan:

- Maksimal 800–1.200 kata per request.
- Gunakan Gemini Flash Lite stabil yang tersedia.
- Wajib structured output berbasis JSON Schema.
- Validasi dengan Zod.
- Pertahankan nama, angka, fakta, dan negasi.
- Cache berdasarkan hash teks, jenis operasi, versi prompt, dan model.
- Maksimal dua retry.
- Tangani `429` dengan exponential backoff.
- Teks asli selalu tersedia.

Gemini mendukung structured output berbasis subset JSON Schema. [Dokumentasi Gemini](https://ai.google.dev/gemini-api/docs/structured-output)

Free tier memiliki batas RPM, token, serta request harian yang dapat berbeda menurut model dan project. [Rate limits Gemini](https://ai.google.dev/gemini-api/docs/rate-limits)

### Semantic validation

- Gunakan multilingual Sentence Transformer/MiniLM pada ML API.
- Bandingkan teks asli dengan hasil simplifikasi per paragraf.
- Validasi terpisah untuk nama, angka, dan negasi.
- Similarity rendah memicu satu retry.
- Jika retry gagal, gunakan teks asli.
- Similarity hanya guardrail, bukan bukti mutlak bahwa teks benar.

### Syllable breaker

Gunakan rule-based Bahasa Indonesia:

- Identifikasi pola vokal dan konsonan.
- Tangani awalan, akhiran, kata ulang, diftong, dan kata serapan.
- Sediakan kamus pengecualian.
- Kata asing diberi confidence rendah.
- Arti sederhana memakai glossary yang telah dibuat Gemini, bukan request baru.

### TTS

Jalur utama menggunakan Web Speech API:

- Suara Bahasa Indonesia.
- Play, pause, stop, dan ulang.
- Kecepatan 0,5×–1,5×.
- Highlight kata melalui boundary event.
- Highlight kalimat menjadi fallback jika boundary kata tidak tersedia.
- Posisi terakhir disimpan.

Model TTS lokal bukan P0 karena sinkronisasi, kualitas suara, dan beban inference berisiko mengganggu deadline.

### Speech assessment

Gunakan faster-whisper:

- Model awal: `small`.
- Fallback performa: `base`.
- Bahasa: Indonesia.
- CPU INT8.
- VAD aktif.
- Word timestamps aktif.
- Audio mono 16 kHz.
- Durasi maksimal dua menit.

faster-whisper mendukung quantization INT8, VAD, dan timestamp kata. [Dokumentasi faster-whisper](https://github.com/SYSTRAN/faster-whisper/blob/master/README.md)

Word alignment menghitung:

- Kata benar.
- Substitution.
- Deletion.
- Insertion.
- Pengulangan.
- WPM.
- WER.
- Jeda panjang.

Gemini tidak digunakan untuk menghitung hasil atau memberikan feedback dasar. Feedback dibuat melalui template deterministik dan tidak mengandung diagnosis.

## Kontrak ML API

Endpoint:

```text
GET  /health
GET  /models
POST /ocr
POST /speech/transcribe
POST /speech/assess
POST /semantic-similarity
POST /syllabify
```

Contoh hasil asesmen:

```json
{
  "transcript": "Teks hasil transkripsi",
  "durationSeconds": 48.2,
  "wordsPerMinute": 72,
  "wordAccuracy": 0.86,
  "wordErrorRate": 0.14,
  "correctWords": 58,
  "substitutions": 4,
  "omissions": 3,
  "insertions": 2,
  "repetitions": 2,
  "longPauses": 3,
  "model": "faster-whisper-small",
  "processingTimeMs": 8200
}
```

Error contract:

```json
{
  "error": {
    "code": "MODEL_UNAVAILABLE",
    "message": "Model speech recognition tidak tersedia.",
    "retryable": false,
    "requestId": "..."
  }
}
```

## Reading dan Learning Flow

1. Pengguna login.
2. Preferensi aksesibilitas diterapkan.
3. Pengguna memasukkan teks atau dokumen.
4. ML API menjalankan OCR bila diperlukan.
5. Pengguna mengoreksi dan menyimpan hasil.
6. Reading interface menampilkan teks.
7. Pengguna dapat menjalankan simplify, summary, TTS, atau syllable breaker.
8. Pengguna mengerjakan tiga pertanyaan pemahaman.
9. Pengguna dapat membaca teks assessment dengan suara.
10. Sistem menghitung metrik.
11. Progress dan rekomendasi diperbarui.

## Progress dan Personalisasi

### Mode standar

- Durasi membaca.
- Bacaan selesai.
- Penggunaan bantuan.
- Kata sulit.
- Skor kuis.
- Pemahaman ide utama, informasi eksplisit, dan konteks.

### Mode personalized

- WPM.
- Word accuracy.
- WER.
- Kata terlewat.
- Pengulangan.
- Jeda.
- Riwayat perkembangan.

### Rule engine

| Kondisi | Respons |
|---|---|
| Banyak kata sulit dibuka | Sarankan simplifikasi |
| TTS sering diperlambat | Simpan kecepatan sebagai default |
| Banyak kata terlewat | Kurangi panjang latihan |
| Banyak jeda | Sarankan mendengarkan TTS lebih dahulu |
| Ide utama sering salah | Tampilkan ringkasan sebelum kuis |
| Akurasi meningkat | Naikkan panjang bacaan secara bertahap |

## Database

Entitas:

- `profiles`
- `reading_preferences`
- `documents`
- `document_pages`
- `simplifications`
- `reading_sessions`
- `quizzes`
- `quiz_questions`
- `quiz_answers`
- `speech_assessments`
- `word_alignments`
- `recommendations`
- `achievements`

Setiap hasil AI menyimpan:

- Provider.
- Nama model.
- Versi pipeline atau prompt.
- Confidence.
- Processing time.
- Validation status.
- Timestamp.

Supabase Row-Level Security memastikan pengguna hanya dapat membaca dan mengubah datanya sendiri.

## Privacy dan Keamanan

- Gemini API key dan Supabase service key tidak masuk browser.
- Audio tidak dikirim ke Gemini.
- Audio mentah dihapus setelah assessment secara default.
- Identitas pengguna tidak dimasukkan ke prompt.
- Validasi MIME type, ukuran file, dan durasi audio.
- Rate limit diterapkan pada web dan ML API.
- ML server hanya menerima request dengan token yang valid.
- Hasil assessment disebut estimasi, bukan diagnosis.
- Data anak tidak dipakai untuk training tanpa persetujuan wali dan prosedur etik.

## Timeline

### 15–18 Agustus: monorepo dan technical spike

- Inisialisasi Turborepo + pnpm.
- Buat `apps/web` dan `apps/ml-api`.
- Buat shared UI, schemas, dan config packages.
- Konfigurasikan Turbo pipeline.
- Integrasikan OpenAPI code generation.
- Benchmark PP-OCRv5.
- Benchmark faster-whisper `base` dan `small`.
- Uji Gemini structured output.

Exit criteria:

- `pnpm dev`, `pnpm build`, `pnpm lint`, dan `pnpm test` bekerja dari root.
- Web dapat memanggil health endpoint ML API.
- Model final telah dipilih.

### 19–25 Agustus: reading core

- Auth dan onboarding.
- Upload teks, gambar, dan PDF.
- OCR dan editor.
- Reading interface.
- Pengaturan aksesibilitas.
- Focus ruler.
- Penyimpanan posisi.

### 26–31 Agustus: AI reading assistance

- Simplifikasi.
- Ringkasan.
- Glossary.
- Gemini cache dan retry.
- Semantic validation.
- Syllable breaker.
- TTS dan highlight.

### 1–6 September: comprehension quiz

- Generate pertanyaan dan rubrik.
- Evaluasi jawaban.
- Feedback.
- Penyimpanan progres.
- Test terhadap sedikitnya 30 bacaan.

### 7–12 September: voice assessment

- Rekaman browser.
- faster-whisper.
- Word alignment.
- WPM, WER, jeda, dan pengulangan.
- Feedback deterministik.
- Penghapusan audio.

### 13–15 September: progress dan adaptasi

- Dashboard progres.
- Riwayat.
- Grafik.
- Badge.
- Rule engine.
- Cache offline untuk bacaan terakhir.

### 16–17 September: hardening

- Unit, integration, dan E2E test.
- Uji aksesibilitas.
- Uji keamanan.
- Uji fallback.
- Feature freeze pada 17 September.

### 18–19 September: demo preparation

- Deploy web final.
- Siapkan tunnel dan mode localhost.
- Pastikan seluruh model tersedia lokal.
- Cache respons Gemini untuk data demo.
- Rekam video cadangan.
- Latihan demo 5–7 menit.

### 20 September: submission

- Smoke test.
- Bekukan build.
- Backup repository, schema, model manifest, dan video.
- Tidak melakukan upgrade dependency atau model.

## Testing

### Root monorepo checks

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm models:verify
```

### Unit test

- Syllable rules.
- Word alignment.
- WPM dan WER.
- Gemini output validation.
- Rule engine.
- Zod schemas.
- Reading preferences.

### Integration test

- Web → ML health.
- Web → OCR.
- Web → speech assessment.
- Web → Gemini → schema validation.
- Web → Supabase.
- OpenAPI contract generation.

### E2E test

- Login.
- Upload gambar.
- Koreksi OCR.
- Membaca.
- Simplify.
- TTS.
- Quiz.
- Voice assessment.
- Progress.
- Gemini unavailable.
- ML API unavailable.
- Microphone denied.
- Offline reading.

### Target penerimaan

- OCR satu halaman maksimal lima detik.
- Assessment satu menit maksimal 15 detik pada laptop demo.
- Semua fitur memiliki loading, error, retry, dan fallback state.
- Teks asli tidak hilang saat AI gagal.
- Demo utama selesai maksimal tujuh menit.
- Tidak ada secret di bundle frontend atau Turbo cache.
- Aplikasi tetap dapat didemokan melalui localhost jika tunnel atau hosting gagal.

## Asumsi

- pnpm menjadi package manager tunggal untuk orchestration monorepo.
- Python menggunakan `uv`, bukan instalasi global.
- Turborepo mengatur task JavaScript dan Python melalui scripts per workspace.
- Next.js menjadi web app sekaligus backend cloud.
- FastAPI hanya menangani inference dan komputasi ML.
- Model ML dijalankan pada laptop tim.
- Web Speech API menjadi TTS utama.
- Gemini Flash Lite free tier digunakan hanya untuk tugas generatif.
- Model dan dependency dikunci sebelum feature freeze.
- Target merupakan MVP lomba, bukan alat medis atau diagnosis.
