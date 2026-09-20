# Skema Database EasyRead

Project Supabase: **EasyRead** · ref `eeanqxzcupfreughknnd` · region `ap-southeast-1`.

Berkas di `migrations/` adalah **cerminan** dari migration yang sudah terpasang di
project remote. Sebelumnya skema hanya hidup di server Supabase dan tidak ada
jejaknya di repo sama sekali — itu risiko besar menjelang deadline, jadi sekarang
dicerminkan ke sini.

Untuk menarik ulang dari remote:

```bash
supabase link --project-ref eeanqxzcupfreughknnd
supabase db pull
```

## Daftar migration

| Versi | Isi |
|---|---|
| `20260814061331` | Skema awal: 13 tabel, RLS, trigger `handle_new_user`, bucket storage `documents` |
| `20260814061641` | Index untuk foreign key yang belum terindeks |
| `20260904013658` | `reading_sessions.words_read`, `quiz_answers.{verdict,scores,tip}`, `speech_assessments.reference_text`, unique index rekomendasi, INSERT policy achievements |
| `20260904032136` | `reading_preferences.{auto_tts,language,overlay}` |
| `20260904032952` | Default `font_family`→`dyslexic`, `letter_spacing`→`0.12`, `focus_ruler_enabled`→`true` |
| `20260904165449` | `reading_preferences.{ui_font,reading_font,contrast_id}`, `letter_spacing` dilebarkan ke 0.35 |

## Constraint yang gampang bikin salah

Ini penyebab galat paling sering saat menulis repository baru:

- **`documents.source_type`** hanya menerima `text | image | pdf`. Mengirim
  `"upload"` membuat insert ditolak Postgres. Jangan menambah nilai baru tanpa
  mengubah CHECK-nya.
- **`documents`** punya CHECK `original_text is not null or storage_path is not null`.
  String kosong boleh, `null` di kedua kolom tidak.
- **`documents.status`** hanya `draft | processing | ready | failed`.
- **`quiz_questions.category`** hanya `main_idea | explicit | context`
  (bukan `explicit_info`).
- **`quiz_answers`** unik per `(question_id, user_id)` → gunakan **upsert**,
  bukan insert. Tabel ini **tidak punya kolom `quiz_id`**.
- **`quizzes`** memakai `prompt_version`, bukan `pipeline_version`.
- **`simplifications.operation`** hanya `simplify | summary | glossary`, dan
  unik per `(user_id, input_hash, operation, pipeline_version, model)`.
  Kuis **tidak boleh** menumpang tabel ini.
- **`quiz_questions`, `document_pages`, `word_alignments` tidak punya `user_id`.**
  RLS-nya lewat tabel induk, jadi repository **jangan** memfilter `user_id`
  di tabel-tabel ini.
- **`recommendations`** punya unique index **parsial**
  (`WHERE dismissed_at is null`). PostgREST tidak bisa memakainya untuk
  `ON CONFLICT`, jadi `.upsert()` ke tabel ini akan gagal. Karena itu
  rekomendasi dihitung ulang saat dibaca di `lib/progress-rules.ts` dan tidak
  disimpan.
- **`achievements`** unik per `(user_id, code)` dan upsert-nya memakai
  `ignoreDuplicates` supaya `awarded_at` tetap tanggal pertama kali diraih.
- **`speech_assessments.duration_seconds`** dibatasi 0–120 detik.

## Kolom preferensi: lama vs baru

`reading_preferences` punya dua generasi kolom. Yang **dipakai kode sekarang**:

| Kolom | Isi |
|---|---|
| `ui_font` | id dari `UI_FONT_OPTIONS` (`lexend`, `opendyslexic`, …) |
| `reading_font` | id dari `READING_FONT_OPTIONS` (`atkinson`, …) |
| `contrast_id` | id dari `READING_CONTRAST_OPTIONS` (`cream-ink`, …) |
| `font_size`, `letter_spacing`, `tts_rate`, `auto_tts`, `focus_ruler_enabled`, `language` | langsung dipetakan ke `ReadingSettings` |

Kolom **warisan** yang dibiarkan apa adanya: `font_family`, `theme`, `overlay`,
`line_height`. CHECK-nya terlalu sempit untuk pilihan yang ada di UI sekarang
(10 id font, 7 id kontras), tapi tidak dihapus supaya baris lama tetap valid.
