-- Menyelaraskan reading_preferences dengan pilihan yang benar-benar ada di UI.
-- Murni additive: kolom lama dibiarkan apa adanya beserta defaultnya agar baris
-- yang sudah ada tetap valid.

-- Slider "Jarak Huruf" di /pengaturan berjalan sampai 0.35em, sedangkan CHECK
-- lama berhenti di 0.30 sehingga setelan maksimum ditolak Postgres.
alter table public.reading_preferences
  drop constraint if exists reading_preferences_letter_spacing_check;

alter table public.reading_preferences
  add constraint reading_preferences_letter_spacing_check
  check (letter_spacing >= 0 and letter_spacing <= 0.35);

-- font_family (sans|serif|dyslexic) dan overlay (cream|peach|mint|blue|lilac)
-- tidak bisa menampung 10 id font + 7 id kontras di lib/session.ts.
-- Simpan nilai UI di kolom sendiri, biarkan kolom lama sebagai warisan.
alter table public.reading_preferences
  add column if not exists ui_font text not null default 'lexend',
  add column if not exists reading_font text not null default 'atkinson',
  add column if not exists contrast_id text not null default 'cream-ink';

comment on column public.reading_preferences.ui_font is
  'Id font antarmuka dari UI_FONT_OPTIONS (lib/session.ts).';
comment on column public.reading_preferences.reading_font is
  'Id font area bacaan dari READING_FONT_OPTIONS (lib/session.ts).';
comment on column public.reading_preferences.contrast_id is
  'Id pasangan warna teks+latar dari READING_CONTRAST_OPTIONS (lib/session.ts).';
