-- 007_pipeline_stages.sql
-- Add 'idea' status to blog_topics for the two-gate content pipeline.
-- idea → researched → approved → writing → written (or discarded at any point)

alter table blog_topics drop constraint if exists blog_topics_status_check;
alter table blog_topics add constraint blog_topics_status_check
  check (status in ('idea', 'researched', 'approved', 'discarded', 'writing', 'written'));
