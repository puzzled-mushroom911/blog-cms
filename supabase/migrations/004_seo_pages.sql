-- Programmatic SEO pages table
-- Stores structured data + prose content for templated pages.
-- page_type discriminates between different programmatic page categories.

create table seo_pages (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  page_type text not null check (page_type in ('moving-from', 'compare', 'zip-code', 'neighborhood', 'schools')),
  title text not null,
  h1 text not null default '',
  meta_description text not null default '',
  keywords text default '',
  data jsonb default '{}'::jsonb,
  content jsonb default '[]'::jsonb,
  internal_links jsonb default '[]'::jsonb,
  status text default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_seo_pages_status on seo_pages(status);
create index idx_seo_pages_page_type on seo_pages(page_type);
create index idx_seo_pages_slug on seo_pages(slug);

-- Auto-update updated_at
create or replace function update_seo_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger seo_pages_updated_at
  before update on seo_pages
  for each row execute function update_seo_pages_updated_at();

-- Row Level Security
alter table seo_pages enable row level security;

-- Authenticated users can do everything
create policy "Authenticated users can manage seo_pages" on seo_pages
  for all using (auth.role() = 'authenticated');

-- Public can only read published pages
create policy "Public can read published seo_pages" on seo_pages
  for select using (status = 'published');
