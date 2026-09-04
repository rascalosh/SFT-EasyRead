-- Samakan default kolom dengan `defaultSettings` di apps/web/lib/session.ts.
--
-- Trigger handle_new_user() membuat baris reading_preferences memakai default
-- kolom. Sebelumnya default-nya font_family='sans' dan letter_spacing=0,
-- sedangkan frontend defaultnya font ramah disleksia AKTIF dengan spasi 0.06.
--
-- Hanya mengubah DEFAULT untuk baris baru. Tidak ada data lama yang disentuh,
-- tidak ada kolom/constraint yang dihapus.

alter table public.reading_preferences alter column font_family set default 'dyslexic';
alter table public.reading_preferences alter column letter_spacing set default 0.06;
