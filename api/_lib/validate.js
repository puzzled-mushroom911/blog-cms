/**
 * Input validation helpers for API routes.
 * Enforces length limits and format checks to prevent abuse.
 */

const LIMITS = {
  title: 200,
  slug: 200,
  excerpt: 500,
  author: 100,
  category: 50,
  read_time: 20,
  meta_description: 320,
  keywords: 500,
  ai_reasoning: 5000,
  maxTags: 20,
  maxTagLength: 50,
  maxContentBlocks: 200,
  maxSources: 50,
};

const VALID_STATUSES = ['draft', 'needs-review', 'published'];
const VALID_TOPIC_STATUSES = ['idea', 'researched', 'approved', 'discarded', 'writing', 'written'];
const VALID_CATEGORIES = ['General', 'How-To', 'Guide', 'Review', 'News', 'Tips', 'Case Study', 'Comparison'];

/**
 * Validate and sanitize a blog post body.
 * Returns { valid: true, sanitized } or { valid: false, error }.
 */
export function validatePost(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return { valid: false, error: 'title is required' };
  }
  if (body.title.length > LIMITS.title) {
    return { valid: false, error: `title must be ${LIMITS.title} characters or less` };
  }
  if (body.slug && body.slug.length > LIMITS.slug) {
    return { valid: false, error: `slug must be ${LIMITS.slug} characters or less` };
  }
  if (body.excerpt && body.excerpt.length > LIMITS.excerpt) {
    return { valid: false, error: `excerpt must be ${LIMITS.excerpt} characters or less` };
  }
  if (body.meta_description && body.meta_description.length > LIMITS.meta_description) {
    return { valid: false, error: `meta_description must be ${LIMITS.meta_description} characters or less` };
  }
  if (body.author && body.author.length > LIMITS.author) {
    return { valid: false, error: `author must be ${LIMITS.author} characters or less` };
  }
  if (body.tags && Array.isArray(body.tags)) {
    if (body.tags.length > LIMITS.maxTags) {
      return { valid: false, error: `Maximum ${LIMITS.maxTags} tags allowed` };
    }
    if (body.tags.some(t => typeof t !== 'string' || t.length > LIMITS.maxTagLength)) {
      return { valid: false, error: `Each tag must be a string of ${LIMITS.maxTagLength} characters or less` };
    }
  }
  if (body.content && Array.isArray(body.content) && body.content.length > LIMITS.maxContentBlocks) {
    return { valid: false, error: `Maximum ${LIMITS.maxContentBlocks} content blocks allowed` };
  }
  if (body.sources && Array.isArray(body.sources) && body.sources.length > LIMITS.maxSources) {
    return { valid: false, error: `Maximum ${LIMITS.maxSources} sources allowed` };
  }
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return { valid: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate a topic body.
 */
export function validateTopic(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return { valid: false, error: 'title is required' };
  }
  if (body.title.length > LIMITS.title) {
    return { valid: false, error: `title must be ${LIMITS.title} characters or less` };
  }
  if (body.primary_keyword && body.primary_keyword.length > LIMITS.title) {
    return { valid: false, error: `primary_keyword must be ${LIMITS.title} characters or less` };
  }
  if (body.status && !VALID_TOPIC_STATUSES.includes(body.status)) {
    return { valid: false, error: `status must be one of: ${VALID_TOPIC_STATUSES.join(', ')}` };
  }

  return { valid: true };
}

export { LIMITS, VALID_STATUSES, VALID_TOPIC_STATUSES };
