-- Add editor_notes column for inline commenting on content blocks.
-- Stored as JSONB array of {blockIndex, text, author, createdAt, resolved}.

alter table blog_posts
  add column if not exists editor_notes jsonb default '[]'::jsonb;
