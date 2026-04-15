import { useState } from 'react';
import { Copy, CheckCircle, Palette, Blocks, Settings, Wand2 } from 'lucide-react';
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

const CUSTOM_PROMPT_EXAMPLE = `Write a blog post based on this YouTube transcript.
Use my knowledge base for voice and style reference.
Apply any content preferences and past corrections.

Additional niche-specific requirements:
- Always include local market data from the last 90 days
- Reference specific neighborhood names, not just city-level info
- Include a "What Buyers Need to Know" callout in every post
- Add a comparison table when discussing multiple areas
- End with a clear CTA linking to the booking calendar
- Use stat-cards for any price data or market statistics

Requirements:
- 2,000-3,000 words (longer for comprehensive guides)
- SEO-optimized title (50-60 characters)
- Meta description (150-160 characters)
- Include FAQ section (3-5 questions)
- Output as JSON blocks matching the CMS block format

Here's the transcript:
[PASTE TRANSCRIPT]`;

const CUSTOM_BLOCK_EXAMPLE = `// Custom block type example: "neighborhood-card"
{
  "type": "neighborhood-card",
  "name": "Downtown St. Pete",
  "medianPrice": "$425,000",
  "priceChange": "+5.2%",
  "walkScore": 89,
  "highlights": ["Waterfront parks", "Restaurant scene", "Arts district"],
  "image": "https://..."
}

// To support custom blocks, add a renderer in your
// ContentRenderer component:
case 'neighborhood-card':
  return (
    <div className="border rounded-xl p-4">
      <img src={block.image} alt={block.name} />
      <h3>{block.name}</h3>
      <p>Median: {block.medianPrice} ({block.priceChange})</p>
      <p>Walk Score: {block.walkScore}</p>
      <ul>{block.highlights.map(h => <li>{h}</li>)}</ul>
    </div>
  )`;

const WORKSPACE_SETTINGS_EXAMPLE = `// Workspace settings are stored in workspaces.settings JSONB
// Access via Settings page or Supabase MCP

{
  "default_author": "Your Name",
  "default_category": "Guide",
  "site_url": "https://yourdomain.com",
  "site_name": "Your Site Name",
  "revalidate_url": "https://yourdomain.com/admin/api/revalidate",
  "wordpress": {
    "site_url": "https://example.com",
    "username": "admin",
    "app_password": "xxxx xxxx xxxx xxxx"
  }
}`;

const STYLE_PREFERENCES_NICHE = `-- Real estate niche preferences
INSERT INTO preferences (rule, category, workspace_id) VALUES
('Always include current year in titles about market data', 'structure', '<ws_id>'),
('Use specific neighborhood names, never "the area" or "this location"', 'vocabulary', '<ws_id>'),
('Lead with the most surprising or counterintuitive data point', 'structure', '<ws_id>'),
('Include flood zone and insurance info for any coastal neighborhood', 'structure', '<ws_id>'),
('Never use "hidden gem" or "best-kept secret" — these are cliche', 'vocabulary', '<ws_id>'),
('Format price comparisons as tables, not inline text', 'formatting', '<ws_id>'),
('End every post with a clear next step for the reader', 'structure', '<ws_id>');

-- Tech blog niche preferences
INSERT INTO preferences (rule, category, workspace_id) VALUES
('Include code examples for every concept explained', 'structure', '<ws_id>'),
('Use inline code formatting for function names and variables', 'formatting', '<ws_id>'),
('Link to official documentation, not blog posts, for references', 'structure', '<ws_id>'),
('Avoid marketing language — be direct and technical', 'tone', '<ws_id>');`;

export default function Customization() {
  return (
    <div className="space-y-8">
      {/* Adapting prompts */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5" />
          Adapting Prompts for Your Niche
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            The built-in prompts (see Prompts & Workflows tab) are designed to be general-purpose. To adapt them for your
            specific niche, add additional requirements to the prompt text. Here is an example for a real estate blog:
          </p>

          <div className="relative">
            <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">{CUSTOM_PROMPT_EXAMPLE}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={CUSTOM_PROMPT_EXAMPLE} />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Store your customized prompts in your project's CLAUDE.md file or as prompt files in the repo.
              Claude Code can reference them by path, e.g., "Use the generate blog post prompt from prompts/generate-blog-post.md".
            </p>
          </div>
        </div>
      </section>

      {/* Custom block types */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Blocks className="w-5 h-5" />
          Custom Content Block Types
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            The CMS stores content as a JSONB array of blocks. While there are 12 built-in block types (see API Reference),
            you can add custom types. The <code className="bg-slate-100 px-1 py-0.5 rounded">content</code> column accepts
            any valid JSON — just add a renderer in your public website's ContentRenderer component.
          </p>

          <div className="relative">
            <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">{CUSTOM_BLOCK_EXAMPLE}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={CUSTOM_BLOCK_EXAMPLE} />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Custom blocks will appear as raw JSON in the CMS editor. To add visual editing support, extend the PostEditor
            component with a custom block renderer.
          </p>
        </div>
      </section>

      {/* Workspace settings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5" />
          Workspace Settings
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Workspace settings are stored in the <code className="bg-slate-100 px-1 py-0.5 rounded">workspaces.settings</code> JSONB
            column. They control defaults, integrations, and site configuration. Edit them from the Settings page or directly via Supabase.
          </p>

          <div className="relative">
            <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono">{WORKSPACE_SETTINGS_EXAMPLE}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={WORKSPACE_SETTINGS_EXAMPLE} />
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p><strong className="text-slate-800">default_author:</strong> Pre-fills the author field when creating new posts.</p>
            <p><strong className="text-slate-800">default_category:</strong> Pre-fills the category when creating new posts.</p>
            <p><strong className="text-slate-800">site_url:</strong> Used for internal link generation and sitemap references.</p>
            <p><strong className="text-slate-800">revalidate_url:</strong> The CMS POSTs here after saving published posts to trigger ISR cache refresh on your website.</p>
            <p><strong className="text-slate-800">wordpress:</strong> WordPress publishing credentials (see Connect Your Website tab).</p>
          </div>
        </div>
      </section>

      {/* Style preferences by niche */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5" />
          Style Preferences by Niche
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Preferences shape how Claude Code writes content for your specific domain. Here are examples for different niches — use these as a starting point and customize to match your voice.
          </p>

          <div className="relative">
            <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">{STYLE_PREFERENCES_NICHE}</pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={STYLE_PREFERENCES_NICHE} />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Preferences can be managed from the <a href="/settings" className="text-blue-600 hover:text-blue-700 underline">Settings page</a>,
            via the <code className="bg-slate-100 px-1 py-0.5 rounded">create_preference</code> MCP tool,
            or directly in the <code className="bg-slate-100 px-1 py-0.5 rounded">preferences</code> table.
          </p>
        </div>
      </section>
    </div>
  );
}
