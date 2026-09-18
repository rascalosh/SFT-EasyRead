-- Pilihan bagian Reading Assessment di /pengaturan:
--   both  = Penilaian Suara + Kuis Pemahaman
--   voice = hanya Penilaian Suara
--   quiz  = hanya Kuis Pemahaman
-- Murni additive; baris lama otomatis memakai 'both'.

alter table public.reading_preferences
  add column if not exists assessment_view text not null default 'both';

alter table public.reading_preferences
  drop constraint if exists reading_preferences_assessment_view_check;

alter table public.reading_preferences
  add constraint reading_preferences_assessment_view_check
  check (assessment_view in ('both', 'voice', 'quiz'));

comment on column public.reading_preferences.assessment_view is
  'Bagian Reading Assessment yang tampil: both | voice | quiz (lib/session.ts ASSESSMENT_VIEW_OPTIONS).';
