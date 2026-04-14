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
 * Get editor notes for a specific block index.
 * Returns formatted note text, or empty string if no notes.
 */
function getNotesForBlock(editorNotes, blockIndex) {
  if (!editorNotes || !Array.isArray(editorNotes)) return '';
  const blockNotes = editorNotes
    .filter((n) => n.blockIndex === blockIndex)
    .map((n) => n.text);
  return blockNotes.length > 0 ? blockNotes.join('; ') : '';
}

/**
 * Build context string from post title and optional editor notes.
 */
function buildContext(postTitle, notes) {
  const parts = [postTitle || ''];
  if (notes) parts.push(`Editor notes: ${notes}`);
  return parts.filter(Boolean).join(' | ');
}

/**
 * Diff original_content against current content block-by-block.
 * Returns an array of feedback entries (not yet inserted).
 * Only compares blocks at the same index.
 * Skips blocks that were added/removed (length mismatch) and blocks where the type changed.
 *
 * Also captures standalone editor notes — blocks that weren't text-edited but have
 * notes attached. These are valuable feedback (e.g., "don't steer with school rankings")
 * even without a text diff.
 *
 * @param {Array} originalContent - The original AI-generated content blocks
 * @param {Array} currentContent - The current (user-edited) content blocks
 * @param {string} postTitle - The title of the post (used as context)
 * @param {Array} editorNotes - Array of editor note objects ({blockIndex, text, ...})
 * @returns {Array} Array of feedback entry objects
 */
export function diffBlocks(originalContent, currentContent, postTitle, editorNotes) {
  if (!originalContent || !currentContent) return [];

  const minLength = Math.min(originalContent.length, currentContent.length);
  const entries = [];
  const capturedBlocks = new Set();

  for (let i = 0; i < minLength; i++) {
    const orig = originalContent[i];
    const curr = currentContent[i];

    // Only compare blocks of the same type
    if (orig.type !== curr.type) continue;

    const origText = extractBlockText(orig);
    const currText = extractBlockText(curr);

    // Skip non-text blocks
    if (origText === null || currText === null) continue;

    // Skip identical blocks (unless they have notes)
    const notes = getNotesForBlock(editorNotes, i);

    if (origText === currText && !notes) continue;

    // If text is identical but has notes, still capture as feedback
    if (origText === currText && notes) {
      entries.push({
        block_index: i,
        block_type: orig.type,
        original_text: origText,
        edited_text: origText,
        context: buildContext(postTitle, notes),
      });
      capturedBlocks.add(i);
      continue;
    }

    entries.push({
      block_index: i,
      block_type: orig.type,
      original_text: origText,
      edited_text: currText,
      context: buildContext(postTitle, notes),
    });
    capturedBlocks.add(i);
  }

  // Capture notes on blocks beyond the minLength range (added blocks with notes)
  if (editorNotes && Array.isArray(editorNotes)) {
    for (const note of editorNotes) {
      if (capturedBlocks.has(note.blockIndex)) continue;
      if (note.blockIndex >= currentContent.length) continue;

      const block = currentContent[note.blockIndex];
      const blockText = extractBlockText(block);
      if (blockText === null) continue;

      entries.push({
        block_index: note.blockIndex,
        block_type: block.type,
        original_text: blockText,
        edited_text: blockText,
        context: buildContext(postTitle, note.text),
      });
      capturedBlocks.add(note.blockIndex);
    }
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
 * @param {Array} editorNotes - Array of editor note objects
 * @returns {Promise<Array>} Array of inserted feedback row IDs
 */
export async function captureFeedback(supabase, postId, originalContent, currentContent, postTitle, editorNotes, workspaceId = null) {
  const entries = diffBlocks(originalContent, currentContent, postTitle, editorNotes);
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
    ...(workspaceId ? { workspace_id: workspaceId } : {}),
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
