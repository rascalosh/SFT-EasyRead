-- Warna dan kekentalan penggaris fokus di /pengaturan.
-- Murni additive; baris lama memakai kuning 70%.

alter table public.reading_preferences
  add column if not exists focus_ruler_color text not null default 'yellow';

alter table public.reading_preferences
  add column if not exists focus_ruler_opacity numeric(3,2) not null default 0.70;

alter table public.reading_preferences
  drop constraint if exists reading_preferences_focus_ruler_color_check;

alter table public.reading_preferences
  add constraint reading_preferences_focus_ruler_color_check
  check (focus_ruler_color in ('yellow', 'green', 'blue', 'lavender', 'rose', 'peach', 'gray'));

alter table public.reading_preferences
  drop constraint if exists reading_preferences_focus_ruler_opacity_check;

alter table public.reading_preferences
  add constraint reading_preferences_focus_ruler_opacity_check
  check (focus_ruler_opacity >= 0.20 and focus_ruler_opacity <= 1.00);

comment on column public.reading_preferences.focus_ruler_color is
  'Warna sorotan penggaris fokus (lib/session.ts FOCUS_RULER_COLOR_OPTIONS).';

comment on column public.reading_preferences.focus_ruler_opacity is
  'Kekentalan sorotan penggaris fokus, 0.20–1.00.';
