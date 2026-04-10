-- 006_flexible_page_types.sql
-- Remove the hardcoded page_type CHECK constraint so template users
-- can define their own page types via the Settings UI.
-- Validation is handled at the application level through config.js.

alter table seo_pages drop constraint if exists seo_pages_page_type_check;
