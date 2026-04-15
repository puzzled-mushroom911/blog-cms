import { useState } from 'react';
import { Copy, CheckCircle, RefreshCw, Cpu, Sliders } from 'lucide-react';
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

const EDGE_FUNCTION_CODE = `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This Edge Function generates embeddings for feedback entries
// Deploy: supabase functions deploy generate-feedback-embedding

serve(async (req) => {
  const { feedback_id, content } = await req.json()

  // Generate embedding using your preferred model
  // Example using gte-small (384 dimensions)
  const embedding = await generateEmbedding(content)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  const { error } = await supabase
    .from('feedback_embeddings')
    .insert({
      feedback_id,
      content,
      embedding,
      workspace_id: // pass from the feedback record
    })

  return new Response(JSON.stringify({ success: !error }))
})`;

const QUERY_FEEDBACK_SQL = `-- Semantic search for relevant past corrections
SELECT content, similarity
FROM query_feedback(
  '<your_topic_embedding>'::vector,
  0.7,   -- similarity threshold
  10     -- max results
);

-- Or query feedback directly (no embeddings needed)
SELECT original_text, edited_text, block_type, context
FROM feedback
ORDER BY created_at DESC
LIMIT 20;`;

const PREFERENCES_EXAMPLES = `-- Tone preferences
INSERT INTO preferences (rule, category, workspace_id)
VALUES
  ('Use a direct, conversational tone — every sentence earns its space', 'tone', '<ws_id>'),
  ('Acknowledge cons honestly before flipping to positives', 'tone', '<ws_id>');

-- Structure preferences
INSERT INTO preferences (rule, category, workspace_id)
VALUES
  ('Lead with the answer in the first paragraph — no long preambles', 'structure', '<ws_id>'),
  ('Include a FAQ section with 3-5 questions at the end', 'structure', '<ws_id>');

-- Vocabulary preferences
INSERT INTO preferences (rule, category, workspace_id)
VALUES
  ('Never use "hidden gem" or "best-kept secret"', 'vocabulary', '<ws_id>'),
  ('Say "buyers" not "families" (avoid fair housing issues)', 'vocabulary', '<ws_id>');

-- Formatting preferences
INSERT INTO preferences (rule, category, workspace_id)
VALUES
  ('Use stat-cards blocks for data points instead of inline numbers', 'formatting', '<ws_id>'),
  ('Include a pros-cons block for any neighborhood comparison', 'formatting', '<ws_id>');`;

export default function FeedbackLoop() {
  return (
    <div className="space-y-8">
      {/* Overview */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5" />
          How the Learning System Works
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            The CMS learns from every edit you make. When you change AI-generated content in the editor, the system captures
            what was changed and uses it to improve future posts. Over time, your blog posts get closer to your voice
            without manual correction.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-700 mb-1">1. Capture</p>
              <p className="text-[11px] text-slate-500">
                When you save an edited post, the system diffs <code className="bg-white px-1 rounded">original_content</code> against the current <code className="bg-white px-1 rounded">content</code> block-by-block.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-700 mb-1">2. Store</p>
              <p className="text-[11px] text-slate-500">
                Changed blocks are inserted into the <code className="bg-white px-1 rounded">feedback</code> table with original text, edited text, and context.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-700 mb-1">3. Apply</p>
              <p className="text-[11px] text-slate-500">
                When generating new posts, Claude Code queries past corrections and applies them to similar content automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vector embeddings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5" />
          Vector Embeddings Setup
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Vector embeddings enable semantic search over your past corrections. Instead of exact keyword matching,
            Claude Code can find relevant corrections by meaning. This is optional — the feedback system works without
            embeddings, but embeddings make it much more accurate.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Enable pgvector</p>
                <p className="text-xs text-slate-500">
                  In your Supabase dashboard, go to Database &gt; Extensions and enable <code className="bg-slate-100 px-1 py-0.5 rounded">pgvector</code>. The schema already creates the <code className="bg-slate-100 px-1 py-0.5 rounded">feedback_embeddings</code> table and <code className="bg-slate-100 px-1 py-0.5 rounded">query_feedback()</code> function.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 mb-2">Deploy the Edge Function</p>
                <p className="text-xs text-slate-500 mb-2">
                  Create a Supabase Edge Function that generates embeddings when new feedback entries are created:
                </p>
                <div className="relative">
                  <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono max-h-64 overflow-y-auto">{EDGE_FUNCTION_CODE}</pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={EDGE_FUNCTION_CODE} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Set up a database webhook</p>
                <p className="text-xs text-slate-500">
                  In Supabase, create a database webhook on the <code className="bg-slate-100 px-1 py-0.5 rounded">feedback</code> table (INSERT events) that triggers the Edge Function. This automatically generates embeddings for each new correction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Query feedback */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Querying Past Corrections</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Two approaches — with or without embeddings</p>
            <CopyButton text={QUERY_FEEDBACK_SQL} />
          </div>
          <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono">{QUERY_FEEDBACK_SQL}</pre>
        </div>
      </section>

      {/* Preferences */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5" />
          Preferences System
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Preferences are explicit style rules that Claude Code follows when generating content. Unlike feedback (which is learned implicitly from edits), preferences are rules you write directly. They are organized into four categories:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-blue-50 rounded-lg p-2.5 text-center">
              <p className="text-xs font-semibold text-blue-800">Tone</p>
              <p className="text-[10px] text-blue-600">Voice and register</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5 text-center">
              <p className="text-xs font-semibold text-amber-800">Structure</p>
              <p className="text-[10px] text-amber-600">Content organization</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
              <p className="text-xs font-semibold text-emerald-800">Vocabulary</p>
              <p className="text-[10px] text-emerald-600">Word choice rules</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-2.5 text-center">
              <p className="text-xs font-semibold text-violet-800">Formatting</p>
              <p className="text-[10px] text-violet-600">Block types & layout</p>
            </div>
          </div>

          <div className="relative pt-2">
            <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono max-h-64 overflow-y-auto">{PREFERENCES_EXAMPLES}</pre>
            <div className="absolute top-4 right-2">
              <CopyButton text={PREFERENCES_EXAMPLES} />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            You can also manage preferences from the CMS Settings page or via the <code className="bg-slate-100 px-1 py-0.5 rounded">create_preference</code> MCP tool.
          </p>
        </div>
      </section>
    </div>
  );
}
