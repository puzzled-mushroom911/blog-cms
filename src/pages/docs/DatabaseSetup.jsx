import { useState } from 'react';
import { Copy, CheckCircle, Database, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

const SCHEMA_SQL = `-- Blog CMS — Complete Database Schema
-- Run this in your Supabase SQL Editor to set up everything the CMS needs.
-- https://github.com/puzzled-mushroom911/blog-cms

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists "pgvector" with schema extensions;

-- ============================================================
-- Helper Functions
-- ============================================================

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- ============================================================
-- 1. Profiles (auto-created on signup)
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"    on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (NEW.id, NEW.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return NEW;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. Workspaces (multi-tenant)
-- ============================================================

create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  owner_id   uuid not null references auth.users on delete cascade,
  settings   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.workspaces enable row level security;

create table public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'editor',
  created_at   timestamptz default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- ============================================================
-- 3. Blog Posts
-- ============================================================

create table public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  excerpt          text not null,
  date             date not null,
  read_time        text not null,
  author           text not null default 'Author',
  category         text not null,
  tags             text[] not null default '{}',
  youtube_id       text,
  video_duration   text,
  image            text not null,
  meta_description text not null,
  keywords         text not null default '',
  content          jsonb not null default '[]',
  status           text not null default 'draft',
  editor_notes     jsonb default '[]',
  original_content jsonb,
  sources          jsonb default '[]',
  ai_reasoning     text default '',
  workspace_id     uuid references public.workspaces on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- 4. Blog Topics (content pipeline)
-- ============================================================

create table public.blog_topics (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  primary_keyword     text not null,
  secondary_keywords  text[] default '{}',
  search_volume       integer default 0,
  keyword_difficulty  integer default 0,
  cpc                 numeric(10,2) default 0,
  competition_level   text default 'medium',
  status              text default 'researched',
  research_data       jsonb default '{}',
  blog_post_id        uuid references public.blog_posts on delete set null,
  seo_page_id         uuid,
  notes               text default '',
  workflow_type       text default 'editorial',
  workspace_id        uuid references public.workspaces on delete set null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ============================================================
-- 5. Feedback & Embeddings (learning system)
-- ============================================================

create table public.feedback (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid references public.blog_posts on delete set null,
  block_index   integer not null,
  block_type    text not null,
  original_text text not null,
  edited_text   text not null,
  context       text not null default '',
  workspace_id  uuid references public.workspaces on delete set null,
  created_at    timestamptz default now()
);

create table public.feedback_embeddings (
  id           bigint generated always as identity primary key,
  feedback_id  uuid references public.feedback on delete cascade,
  content      text not null,
  embedding    extensions.vector(384),
  workspace_id uuid references public.workspaces on delete set null
);

-- ============================================================
-- 6. Preferences (global style rules)
-- ============================================================

create table public.preferences (
  id           uuid primary key default gen_random_uuid(),
  rule         text not null,
  category     text not null default 'tone',
  active       boolean default true,
  workspace_id uuid references public.workspaces on delete set null,
  created_at   timestamptz default now()
);

-- See the full schema for: seo_pages, editorial_research,
-- cms_block_comments, blog_post_relations, api_keys,
-- RLS policies, triggers, and helper functions.`;

const TABLES = [
  {
    name: 'blog_posts',
    desc: 'Published blog content with JSONB content blocks',
    columns: [
      { name: 'id', type: 'uuid', notes: 'Primary key' },
      { name: 'slug', type: 'text', notes: 'Unique, used in URLs' },
      { name: 'title', type: 'text', notes: 'Post title' },
      { name: 'excerpt', type: 'text', notes: 'Short description' },
      { name: 'content', type: 'jsonb', notes: 'Array of content blocks' },
      { name: 'status', type: 'text', notes: 'draft, needs-review, published' },
      { name: 'category', type: 'text', notes: 'General, How-To, Guide, etc.' },
      { name: 'tags', type: 'text[]', notes: 'Array of tag strings' },
      { name: 'meta_description', type: 'text', notes: 'SEO meta description' },
      { name: 'workspace_id', type: 'uuid', notes: 'FK to workspaces' },
    ],
  },
  {
    name: 'blog_topics',
    desc: 'Topic research pipeline for content planning',
    columns: [
      { name: 'id', type: 'uuid', notes: 'Primary key' },
      { name: 'title', type: 'text', notes: 'Working title' },
      { name: 'primary_keyword', type: 'text', notes: 'Main target keyword' },
      { name: 'search_volume', type: 'integer', notes: 'Monthly search volume' },
      { name: 'keyword_difficulty', type: 'integer', notes: '0-100 score' },
      { name: 'status', type: 'text', notes: 'researched, approved, writing, written' },
      { name: 'research_data', type: 'jsonb', notes: 'Full research payload' },
      { name: 'workspace_id', type: 'uuid', notes: 'FK to workspaces' },
    ],
  },
  {
    name: 'feedback',
    desc: 'Edit diffs that power the learning engine',
    columns: [
      { name: 'id', type: 'uuid', notes: 'Primary key' },
      { name: 'post_id', type: 'uuid', notes: 'FK to blog_posts' },
      { name: 'block_index', type: 'integer', notes: 'Which block was edited' },
      { name: 'original_text', type: 'text', notes: 'AI-generated text' },
      { name: 'edited_text', type: 'text', notes: 'User-corrected text' },
    ],
  },
  {
    name: 'preferences',
    desc: 'Global style rules (tone, structure, vocabulary, formatting)',
    columns: [
      { name: 'id', type: 'uuid', notes: 'Primary key' },
      { name: 'rule', type: 'text', notes: 'Style directive text' },
      { name: 'category', type: 'text', notes: 'tone, structure, vocabulary, formatting' },
      { name: 'active', type: 'boolean', notes: 'Toggle without deleting' },
    ],
  },
  {
    name: 'feedback_embeddings',
    desc: 'Vector store for semantic search of past corrections',
    columns: [
      { name: 'id', type: 'bigint', notes: 'Auto-increment PK' },
      { name: 'feedback_id', type: 'uuid', notes: 'FK to feedback' },
      { name: 'content', type: 'text', notes: 'Formatted text that was embedded' },
      { name: 'embedding', type: 'vector(384)', notes: 'gte-small embedding' },
    ],
  },
  {
    name: 'workspaces',
    desc: 'Multi-tenant workspace isolation',
    columns: [
      { name: 'id', type: 'uuid', notes: 'Primary key' },
      { name: 'name', type: 'text', notes: 'Workspace name' },
      { name: 'slug', type: 'text', notes: 'Unique slug' },
      { name: 'owner_id', type: 'uuid', notes: 'FK to auth.users' },
      { name: 'settings', type: 'jsonb', notes: 'Workspace-level config' },
    ],
  },
];

export default function DatabaseSetup() {
  return (
    <div className="space-y-8">
      {/* Setup steps */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Database className="w-5 h-5" />
          Database Setup
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Create a Supabase project</p>
              <p className="text-xs text-slate-500">
                Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">supabase.com/dashboard</a> and create a new project. Note the project URL and anon key from Settings &gt; API.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Enable pgvector extension</p>
              <p className="text-xs text-slate-500">
                Go to Database &gt; Extensions in your Supabase dashboard and enable <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">pgvector</code>. This is required for the feedback embedding system.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Run the schema SQL</p>
              <p className="text-xs text-slate-500">
                Open the SQL Editor in Supabase, paste the full schema below, and run it. This creates all tables, RLS policies, triggers, and helper functions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">4</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Configure environment variables</p>
              <p className="text-xs text-slate-500">
                Set <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">VITE_SUPABASE_ANON_KEY</code> in your <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">.env</code> file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Schema SQL */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Complete Schema</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">supabase/schema.sql</p>
            <CopyButton text={SCHEMA_SQL} />
          </div>
          <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono max-h-96 overflow-y-auto">{SCHEMA_SQL}</pre>
          <p className="text-xs text-slate-500 mt-2">
            This is a condensed version. The full schema with all RLS policies and helper functions is available in the{' '}
            <a href="https://github.com/puzzled-mushroom911/blog-cms/blob/main/supabase/schema.sql" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">GitHub repository</a>.
          </p>
        </div>
      </section>

      {/* Table reference */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Table2 className="w-5 h-5" />
          Table Reference
        </h2>
        <div className="space-y-4">
          {TABLES.map((table) => (
            <div key={table.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <code className="text-sm font-semibold font-mono text-slate-800">{table.name}</code>
                <p className="text-xs text-slate-500 mt-0.5">{table.desc}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs w-36">Column</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs w-28">Type</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600 text-xs">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col, i) => (
                    <tr key={col.name} className={i < table.columns.length - 1 ? 'border-b border-slate-50' : ''}>
                      <td className="px-4 py-1.5">
                        <code className="text-xs font-mono text-slate-700">{col.name}</code>
                      </td>
                      <td className="px-4 py-1.5">
                        <span className="text-xs text-slate-500">{col.type}</span>
                      </td>
                      <td className="px-4 py-1.5 text-xs text-slate-500">{col.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* RLS explanation */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Row Level Security (RLS)</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs text-slate-600">
          <p>
            Every table has RLS enabled. The key patterns:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-slate-300">-</span>
              <span><strong className="text-slate-800">Public read for published content:</strong> The <code className="bg-slate-100 px-1 py-0.5 rounded">blog_posts</code> table allows anonymous reads where <code className="bg-slate-100 px-1 py-0.5 rounded">status = 'published'</code>. This is how your public website reads content using the Supabase anon key.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-300">-</span>
              <span><strong className="text-slate-800">Workspace scoping:</strong> Most tables use the <code className="bg-slate-100 px-1 py-0.5 rounded">is_workspace_member()</code> function to restrict access to workspace members only.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-300">-</span>
              <span><strong className="text-slate-800">Authenticated access:</strong> CMS dashboard users (logged in via Supabase Auth) can read and write all posts in their workspace.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
