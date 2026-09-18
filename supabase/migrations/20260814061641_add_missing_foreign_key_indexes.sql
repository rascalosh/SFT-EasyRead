create index if not exists quizzes_user_idx on public.quizzes(user_id);
create index if not exists reading_sessions_document_idx on public.reading_sessions(document_id);
create index if not exists speech_assessments_document_idx on public.speech_assessments(document_id);
