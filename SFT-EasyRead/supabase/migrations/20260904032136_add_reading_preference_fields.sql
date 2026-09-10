-- Lengkapi reading_preferences agar bisa menampung seluruh ReadingSettings
-- milik frontend (apps/web/lib/session.ts).
--
-- Kolom `theme` yang sudah ada hanya mencakup light|cream|dark, sedangkan
-- frontend menawarkan 5 warna overlay bacaan. Daripada mengubah constraint
-- `theme` yang sudah dipakai, tambahkan kolom `overlay` terpisah.
--
-- Semua additive: kolom baru punya default, tidak ada yang dihapus atau diubah.

alter table public.reading_preferences
  add column if not exists auto_tts boolean not null default false;

alter table public.reading_preferences
  add column if not exists language text not null default 'id-ID';

alter table public.reading_preferences
  add column if not exists overlay text not null default 'cream';

do $$ begin
  alter table public.reading_preferences
    add constraint reading_preferences_overlay_check
    check (overlay in ('cream', 'peach', 'mint', 'blue', 'lilac'));
exception when duplicate_object then null; end $$;
