-- Pilihan versi hasil Simplify di /pengaturan:
--   plain      = paragraf ditulis ulang sederhana (prompt lama)
--   structured = inti dulu, judul bagian, poin, kata kunci tebal, tabel, Catatan
-- Murni additive; baris lama otomatis memakai 'plain'.

alter table public.reading_preferences
  add column if not exists simplify_style text not null default 'plain';

alter table public.reading_preferences
  drop constraint if exists reading_preferences_simplify_style_check;

alter table public.reading_preferences
  add constraint reading_preferences_simplify_style_check
  check (simplify_style in ('plain', 'structured'));

comment on column public.reading_preferences.simplify_style is
  'Versi hasil Simplify: plain | structured (lib/session.ts SIMPLIFY_STYLE_OPTIONS).';
