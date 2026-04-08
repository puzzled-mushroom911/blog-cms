-- Blog posts table
-- Stores all blog post content as JSON blocks, plus metadata and SEO fields.

create table blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  date date not null default current_date,
  read_time text not null default '5 min read',
  author text default 'Author',
  category text not null default 'General',
  tags text[] default '{}',
  youtube_id text,
  image text not null default '',
  meta_description text not null default '',
  keywords text default '',
  content jsonb default '[]'::jsonb,
  status text default 'draft' check (status in ('draft', 'needs-review', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index idx_blog_posts_status on blog_posts(status);
create index idx_blog_posts_date on blog_posts(date desc);
create index idx_blog_posts_slug on blog_posts(slug);

-- Row Level Security
alter table blog_posts enable row level security;

-- Authenticated users (you) can do everything
create policy "Authenticated users can do everything" on blog_posts
  for all using (auth.role() = 'authenticated');

-- Public visitors can only read published posts (for your website's API calls)
create policy "Public can read published posts" on blog_posts
  for select using (status = 'published');
