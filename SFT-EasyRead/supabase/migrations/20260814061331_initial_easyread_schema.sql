create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_path text,
  birth_year smallint check (birth_year between 1900 and extract(year from now())::smallint),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reading_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  font_family text not null default 'sans' check (font_family in ('sans','serif','dyslexic')),
  font_size smallint not null default 20 check (font_size between 14 and 40),
  line_height numeric(3,2) not null default 1.60 check (line_height between 1.20 and 2.50),
  letter_spacing numeric(4,2) not null default 0 check (letter_spacing between 0 and 0.30),
  theme text not null default 'cream' check (theme in ('light','cream','dark')),
  tts_rate numeric(3,2) not null default 1 check (tts_rate between 0.50 and 1.50),
  focus_ruler_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  source_type text not null check (source_type in ('text','image','pdf')),
  original_text text,
  storage_path text,
  status text not null default 'draft' check (status in ('draft','processing','ready','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (original_text is not null or storage_path is not null)
);

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  page_number smallint not null check (page_number between 1 and 10),
  extracted_text text,
  confidence numeric(5,4) check (confidence between 0 and 1),
  warnings text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(document_id, page_number)
);

create table public.simplifications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null check (operation in ('simplify','summary','glossary')),
  result jsonb not null,
  provider text not null,
  model text not null,
  pipeline_version text not null,
  confidence numeric(5,4) check (confidence between 0 and 1),
  processing_time_ms integer check (processing_time_ms >= 0),
  validation_status text not null check (validation_status in ('pending','valid','rejected','fallback')),
  input_hash text not null,
  created_at timestamptz not null default now(),
  unique(user_id, input_hash, operation, pipeline_version, model)
);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  last_position integer not null default 0 check (last_position >= 0),
  help_usage jsonb not null default '{}',
  completed boolean not null default false,
  check (finished_at is null or finished_at >= started_at)
);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  category text not null check (category in ('main_idea','explicit','context')),
  prompt text not null,
  answer_schema jsonb not null,
  unique(quiz_id, position)
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null,
  score numeric(5,2) check (score between 0 and 100),
  feedback text,
  answered_at timestamptz not null default now(),
  unique(question_id, user_id)
);

create table public.speech_assessments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  transcript text not null,
  duration_seconds numeric(7,2) not null check (duration_seconds between 0 and 120),
  words_per_minute numeric(7,2) not null check (words_per_minute >= 0),
  word_accuracy numeric(5,4) not null check (word_accuracy between 0 and 1),
  word_error_rate numeric(6,4) not null check (word_error_rate >= 0),
  correct_words integer not null default 0,
  substitutions integer not null default 0,
  omissions integer not null default 0,
  insertions integer not null default 0,
  repetitions integer not null default 0,
  long_pauses integer not null default 0,
  model text not null,
  processing_time_ms integer not null check (processing_time_ms >= 0),
  created_at timestamptz not null default now()
);

create table public.word_alignments (
  id bigint generated always as identity primary key,
  assessment_id uuid not null references public.speech_assessments(id) on delete cascade,
  position integer not null check (position >= 0),
  expected_word text,
  spoken_word text,
  status text not null check (status in ('correct','substitution','omission','insertion','repetition')),
  started_at_ms integer check (started_at_ms >= 0),
  ended_at_ms integer check (ended_at_ms >= started_at_ms),
  unique(assessment_id, position, status)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rule_code text not null,
  message text not null,
  metadata jsonb not null default '{}',
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  awarded_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  unique(user_id, code)
);

create index documents_user_created_idx on public.documents(user_id, created_at desc);
create index document_pages_document_idx on public.document_pages(document_id);
create index simplifications_document_idx on public.simplifications(document_id);
create index reading_sessions_user_started_idx on public.reading_sessions(user_id, started_at desc);
create index quizzes_document_idx on public.quizzes(document_id);
create index quiz_questions_quiz_idx on public.quiz_questions(quiz_id);
create index quiz_answers_user_idx on public.quiz_answers(user_id);
create index speech_assessments_user_created_idx on public.speech_assessments(user_id, created_at desc);
create index word_alignments_assessment_idx on public.word_alignments(assessment_id);
create index recommendations_user_created_idx on public.recommendations(user_id, created_at desc);
create index achievements_user_awarded_idx on public.achievements(user_id, awarded_at desc);

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.reading_preferences (user_id) values (new.id);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger preferences_updated_at before update on public.reading_preferences for each row execute function private.set_updated_at();
create trigger documents_updated_at before update on public.documents for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.reading_preferences enable row level security;
alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.simplifications enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.speech_assessments enable row level security;
alter table public.word_alignments enable row level security;
alter table public.recommendations enable row level security;
alter table public.achievements enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy preferences_own on public.reading_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy documents_own on public.documents for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy pages_via_document on public.document_pages for all to authenticated
using (exists (select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())))
with check (exists (select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())));
create policy simplifications_own on public.simplifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_own on public.reading_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy quizzes_own on public.quizzes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy questions_via_quiz on public.quiz_questions for all to authenticated
using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = (select auth.uid())))
with check (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = (select auth.uid())));
create policy answers_own on public.quiz_answers for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy assessments_own on public.speech_assessments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy alignments_via_assessment on public.word_alignments for all to authenticated
using (exists (select 1 from public.speech_assessments a where a.id = assessment_id and a.user_id = (select auth.uid())))
with check (exists (select 1 from public.speech_assessments a where a.id = assessment_id and a.user_id = (select auth.uid())));
create policy recommendations_own on public.recommendations for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy achievements_own on public.achievements for select to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['image/jpeg','image/png','application/pdf','audio/webm','audio/wav'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy documents_storage_select on storage.objects for select to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy documents_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy documents_storage_update on storage.objects for update to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy documents_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
