/**
 * feedback.js
 *
 * Utility functions for capturing and storing AI content feedback.
 * Compares original AI-generated content blocks against user-edited versions,
 * diffs them block-by-block, and inserts the resulting changes into the
 * Supabase `feedback` table for use by the learning engine.
 */

/**
 * Extract the primary text content from a block based on its type.
 * Returns null for non-text-editable block types.
 *
 * @param {Object} block - A content block object
 * @returns {string|null} The extracted text, or null if the block is non-text
 */
export function extractBlockText(block) {
  if (!block) return null;

  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'subheading':
      return block.text || '';

    case 'list':
      return (block.items || [])
        .map((item) => (typeof item === 'string' ? item : item.text || ''))
        .join('\n');

    case 'callout':
      return block.text || '';

    case 'info-box':
      return block.content || block.text || '';

    case 'quote':
      return block.text || '';

    case 'process-steps':
      return (block.steps || [])
        .map((step) => `${step.title}: ${step.text}`)
        .join('\n');

    case 'table':
      return JSON.stringify(block.rows || []);

    case 'pros-cons':
      return [
        ...(block.pros || []),
        ...(block.cons || []),
      ].join('\n');

    // Skip non-text blocks
    case 'stat-cards':
    case 'image':
    case 'prompt':
      return null;

    default:
      return null;
  }
}

/**
 * Diff original_content against current content block-by-block.
 * Returns an array of feedback entries (not yet inserted).
 * Only compares blocks at the same index.
 * Skips blocks that were added/removed (length mismatch) and blocks where the type changed.
 *
 * @param {Array} originalContent - The original AI-generated content blocks
 * @param {Array} currentContent - The current (user-edited) content blocks
 * @param {string} postTitle - The title of the post (used as context)
 * @returns {Array} Array of feedback entry objects
 */
export function diffBlocks(originalContent, currentContent, postTitle) {
  if (!originalContent || !currentContent) return [];

  const minLength = Math.min(originalContent.length, currentContent.length);
  const entries = [];

  for (let i = 0; i < minLength; i++) {
    const orig = originalContent[i];
    const curr = currentContent[i];

    // Only compare blocks of the same type
    if (orig.type !== curr.type) continue;

    const origText = extractBlockText(orig);
    const currText = extractBlockText(curr);

    // Skip non-text blocks
    if (origText === null || currText === null) continue;

    // Skip identical blocks
    if (origText === currText) continue;

    entries.push({
      block_index: i,
      block_type: orig.type,
      original_text: origText,
      edited_text: currText,
      context: postTitle || '',
    });
  }

  return entries;
}

/**
 * Insert feedback entries into Supabase, deduplicating against existing entries
 * for the same post + block_index. For each entry, checks if the most recent
 * feedback for that (post_id, block_index) already has the same edited_text.
 * If so, skips it.
 *
 * @param {Object} supabase - The Supabase client instance
 * @param {string} postId - The ID of the blog post
 * @param {Array} originalContent - The original AI-generated content blocks
 * @param {Array} currentContent - The current (user-edited) content blocks
 * @param {string} postTitle - The title of the post
 * @returns {Promise<Array>} Array of inserted feedback row IDs
 */
export async function captureFeedback(supabase, postId, originalContent, currentContent, postTitle) {
  const entries = diffBlocks(originalContent, currentContent, postTitle);
  if (entries.length === 0) return [];

  // Fetch existing feedback for this post to deduplicate
  const { data: existing } = await supabase
    .from('feedback')
    .select('block_index, edited_text, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  // Build a map of most recent edited_text per block_index
  const latestByBlock = {};
  for (const row of (existing || [])) {
    if (!(row.block_index in latestByBlock)) {
      latestByBlock[row.block_index] = row.edited_text;
    }
  }

  // Filter out entries where the edited_text hasn't changed since last capture
  const newEntries = entries.filter((entry) => {
    const lastEdited = latestByBlock[entry.block_index];
    return lastEdited !== entry.edited_text;
  });

  if (newEntries.length === 0) return [];

  // Batch insert
  const rows = newEntries.map((entry) => ({
    post_id: postId,
    ...entry,
  }));

  const { data, error } = await supabase
    .from('feedback')
    .insert(rows)
    .select('id');

  if (error) {
    console.warn('Feedback capture failed:', error.message);
    return [];
  }

  return data || [];
}
