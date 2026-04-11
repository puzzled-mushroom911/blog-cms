-- =============================================================
-- 008: Feedback Loop + Vector Embeddings (Phase 2)
-- Adds: feedback, feedback_embeddings, preferences tables
-- Adds: original_content column to blog_posts
-- Adds: pgvector extension + HNSW index
-- Adds: query_feedback RPC function
-- Safe to run multiple times (uses IF NOT EXISTS)
-- =============================================================

-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Add original_content to blog_posts
alter table blog_posts add column if not exists original_content jsonb default null;

-- Feedback table — stores edit diffs
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references blog_posts(id) on delete cascade,
  block_index integer not null,
  block_type text not null,
  original_text text not null,
  edited_text text not null,
  context text not null default '',
  created_at timestamptz default now()
);

create index if not exists idx_feedback_post_id on feedback(post_id);

-- Feedback embeddings — vector store
create table if not exists feedback_embeddings (
  id bigint primary key generated always as identity,
  feedback_id uuid references feedback(id) on delete cascade,
  content text not null,
  embedding extensions.vector(384)
);

create index if not exists idx_feedback_embeddings_hnsw
  on feedback_embeddings using hnsw (embedding extensions.vector_ip_ops);

-- Preferences — global style rules
create table if not exists preferences (
  id uuid default gen_random_uuid() primary key,
  rule text not null,
  category text not null default 'tone' check (category in ('tone', 'structure', 'vocabulary', 'formatting')),
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table feedback enable row level security;
alter table feedback_embeddings enable row level security;
alter table preferences enable row level security;

do $$ begin
  drop policy if exists "Auth users full access" on feedback;
  drop policy if exists "Auth users full access" on feedback_embeddings;
  drop policy if exists "Auth users full access" on preferences;
exception when others then null;
end $$;

create policy "Auth users full access" on feedback
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on feedback_embeddings
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on preferences
  for all using (auth.role() = 'authenticated');

-- RPC function for vector similarity search
create or replace function query_feedback(
  query_embedding extensions.vector(384),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fe.content,
    (1 - (fe.embedding <=> query_embedding))::float as similarity
  from feedback_embeddings fe
  where 1 - (fe.embedding <=> query_embedding) > match_threshold
  order by fe.embedding <=> query_embedding
  limit match_count;
end;
$$;
