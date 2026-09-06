-- Penyesuaian additive untuk backend EasyRead (Fase 4-7).
-- Tidak menghapus kolom/tabel/constraint apa pun; semua kolom baru
-- punya default atau nullable sehingga aman untuk baris lama.

-- reading_sessions: jumlah kata yang dibaca (progress + badge "Seribu Kata")
alter table public.reading_sessions
  add column if not exists words_read integer not null default 0;

do $$ begin
  alter table public.reading_sessions
    add constraint reading_sessions_words_read_check check (words_read >= 0);
exception when duplicate_object then null; end $$;

-- quiz_answers: output evaluasi LLM terstruktur.
-- Wireframe menampilkan verdict (Paham/Belum Paham), skor per-aspek (2/2),
-- dan satu tips. Kolom `score` (0-100) yang sudah ada tetap dipakai sebagai
-- ringkasan numerik.
alter table public.quiz_answers add column if not exists verdict text;
alter table public.quiz_answers add column if not exists scores  jsonb not null default '{}'::jsonb;
alter table public.quiz_answers add column if not exists tip     text;

do $$ begin
  alter table public.quiz_answers
    add constraint quiz_answers_verdict_check
    check (verdict is null or verdict in ('paham', 'belum_paham'));
exception when duplicate_object then null; end $$;

-- speech_assessments: snapshot potongan teks yang benar-benar dinilai
-- (bisa berupa kutipan pendek dari dokumen, bukan seluruh isinya).
alter table public.speech_assessments add column if not exists reference_text text;

-- recommendations: satu rekomendasi aktif per rule per user.
create unique index if not exists recommendations_user_rule_active_key
  on public.recommendations (user_id, rule_code)
  where dismissed_at is null;

-- achievements: saat ini hanya ada policy SELECT untuk authenticated,
-- sehingga pemilik tidak bisa mencatat badge-nya sendiri. Tambahkan INSERT
-- policy dengan pemeriksaan kepemilikan yang sama.
drop policy if exists achievements_insert_own on public.achievements;
create policy achievements_insert_own on public.achievements
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
