import { useState } from 'react';
import { Copy, CheckCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react';
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

const PROMPTS = [
  {
    id: 'generate-blog-post',
    title: 'Generate Blog Post',
    description: 'Turn a YouTube transcript into a full, SEO-optimized blog post in your voice. This is the core workflow — it loads your style preferences, checks past corrections from the feedback system, and outputs content blocks ready for the CMS.',
    prerequisites: [
      'A YouTube video transcript (download via yt-dlp or copy from YouTube)',
      'Knowledge base set up (see Setup Knowledge Base below)',
      'CMS workspace with an API key (for MCP access)',
    ],
    prompt: `Write a blog post based on this YouTube transcript.
Use my knowledge base for voice and style reference.
Apply any content preferences and past corrections loaded above.

Requirements:
- 1,500-2,500 words
- SEO-optimized title (50-60 characters)
- Meta description (150-160 characters)
- Include FAQ section (3-5 questions) with schema markup
- Add 2-4 internal links to related content on my site
- Use my authentic voice from the transcript
- Lead with the answer in the first paragraph
- Include specific data points and statistics
- Structure with clear H2/H3 headings
- Output as JSON blocks matching the CMS block format:
  [{"type": "heading", "text": "..."}, {"type": "paragraph", "text": "..."}, ...]

Here's the transcript:
[PASTE TRANSCRIPT]`,
    example: 'Research the keyword "moving to st pete florida" for the blog CMS, then generate a blog post from my latest YouTube transcript about St. Pete neighborhoods.',
    fullContent: `# Voice & Style Context (loaded automatically)

Before writing, the system loads your accumulated style knowledge:

1. **Load content preferences** — queries active style rules from the preferences table (tone, structure, vocabulary, formatting)
2. **Load past corrections** — searches the feedback table for relevant past edits you've made, so it learns from your changes

# How to Get Your Transcript

**Option A: yt-dlp (recommended)**
\`\`\`bash
brew install yt-dlp
yt-dlp --write-auto-sub --sub-lang en --skip-download -o "transcript" "https://youtube.com/watch?v=VIDEO_ID"
\`\`\`

**Option B: Copy from YouTube**
1. Open your video on YouTube
2. Click "..." below the video > "Show transcript"
3. Copy the full transcript text

# Block Format Reference

The CMS expects a JSON array of blocks:
- heading, subheading, paragraph, list
- callout, quote, image, table
- pros-cons, info-box, stat-cards, process-steps`,
  },
  {
    id: 'research-topic',
    title: 'Research Topic',
    description: 'Research a keyword using DataForSEO, pull competitive intelligence, and save the results to the content pipeline — ready for review and approval before writing.',
    prerequisites: [
      'DataForSEO MCP configured in your Claude Code environment',
      'Supabase MCP configured with access to the CMS database',
      'blog_topics table exists (run the database setup first)',
    ],
    prompt: `Research the keyword "[YOUR KEYWORD]" for the blog CMS.
Use the research-topic prompt.`,
    example: `Research the keyword "cost of living in st petersburg fl" with the working title "The Real Cost of Living in St. Petersburg, FL (2026 Breakdown)". Use the research-topic prompt.`,
    fullContent: `# What It Does

1. **Keyword data** — search volume, CPC, competition index from Google Ads
2. **Keyword difficulty** — 0-100 difficulty score
3. **Related keywords** — top 20 related terms with volume and difficulty
4. **SERP analysis** — top 10 organic results, SERP features, People Also Ask
5. **Competitor analysis** — competing domains with traffic estimates
6. **AI search volume** — how the topic appears in AI search results (optional)
7. **Content gaps & angles** — AI-generated analysis of what's missing and how to differentiate
8. **Full SEO brief** — complete writing brief with recommended structure

# Batch Mode

Research multiple keywords in one session:
\`\`\`
Research these keywords for the blog CMS:
1. "moving to st pete florida"
2. "cost of living st petersburg fl"
3. "best neighborhoods in st pete"
Use the research-topic prompt for each.
\`\`\``,
  },
  {
    id: 'seo-review',
    title: 'SEO Review',
    description: 'Audit a blog post for SEO quality before publishing. Checks title length, meta description, heading structure, internal links, FAQ sections, and more. Returns a score out of 10 with specific fixes.',
    prerequisites: [
      'A draft or needs-review blog post in the CMS',
      'Claude Code connected via MCP',
    ],
    prompt: `Review this blog post for SEO quality. Check:

- Title length (50-60 chars)
- Meta description (150-160 chars)
- Heading structure (one H1, logical H2/H3 hierarchy)
- Internal links (at least 2-4 to related content)
- Image alt text (descriptive, keyword-relevant)
- FAQ section for featured snippet potential
- Schema markup recommendations
- Keyword density (natural, not stuffed)
- Content freshness (are dates and data current?)
- Answer-first formatting (lead with the key takeaway)
- Readability (short paragraphs, scannable structure)

Provide:
1. A score out of 10
2. What's working well
3. Specific fixes needed (with examples)
4. Quick wins for improvement

Blog post content:
[PASTE OR REFERENCE POST]`,
    example: 'Run an SEO review on my latest draft post "Best Neighborhoods in St. Pete for Families in 2026".',
    fullContent: `# Quick SEO Checklist

Before publishing any post, verify:

- [ ] Title is 50-60 characters
- [ ] Meta description is 150-160 characters
- [ ] Slug is clean and keyword-rich (no dates or filler words)
- [ ] Featured image has a descriptive filename and alt text
- [ ] At least 2 internal links to other posts on your site
- [ ] At least 1 external link to a credible source
- [ ] FAQ section with 3-5 questions (helps win featured snippets)
- [ ] Content leads with the answer (not a long preamble)
- [ ] All data and statistics are current
- [ ] Read time is accurate

# Using with the CMS

1. Open the post in the CMS editor
2. Copy the title, meta description, and review the content
3. Run the SEO review prompt with Claude Code
4. Make fixes in the metadata sidebar and inline editor
5. Change status to "published" and save`,
  },
  {
    id: 'setup-knowledge-base',
    title: 'Setup Knowledge Base',
    description: 'Set up your voice and style knowledge base so Claude Code can write content that sounds like you. Uses YouTube transcripts and other content sources as reference material.',
    prerequisites: [
      'YouTube video transcripts or other content in your voice',
      'A folder to store your knowledge base files',
      'Claude Code installed',
    ],
    prompt: `Read my transcripts in ~/knowledge_bases/your_content/ and write
a 100-word paragraph about [YOUR TOPIC] in my voice. Match my
speaking style, not generic AI writing.`,
    example: 'Set up a knowledge base from my last 10 YouTube videos and test the voice match with a paragraph about Tampa Bay neighborhoods.',
    fullContent: `# Step-by-Step Setup

## 1. Gather Your Content Sources
- YouTube video transcripts (your best source of natural voice)
- Email templates and client communications
- Voice notes and brainstorming recordings (transcribe them first)
- Previous blog posts or articles you've written
- Social media posts in your voice

## 2. Create a Knowledge Base Folder
\`\`\`bash
mkdir -p ~/knowledge_bases/your_content
\`\`\`

## 3. Add Your Transcripts
\`\`\`bash
# Download transcripts for your last 10 videos
yt-dlp --write-auto-sub --sub-lang en --skip-download \\
  -o "~/knowledge_bases/your_content/%(title)s" \\
  "https://youtube.com/@yourchannel" \\
  --playlist-end 10
\`\`\`

## 4. Configure Claude Code
Add to your project's CLAUDE.md:
\`\`\`markdown
# Content Sources
- Knowledge base: ~/knowledge_bases/your_content/
- YouTube channel: [YOUR CHANNEL URL]
- Brand voice: [DESCRIBE YOUR VOICE]
\`\`\`

## 5. Advanced: Vector Database (Optional)
For larger knowledge bases with semantic search, install ChromaDB:
\`\`\`bash
pip install chromadb sentence-transformers
\`\`\``,
  },
  {
    id: 'build-public-website',
    title: 'Build Public Website',
    description: 'Scaffold a public-facing blog website that reads published content from your CMS database. Builds a React + Vite + Tailwind site with all the pages and content rendering you need.',
    prerequisites: [
      'CMS database set up and running with published posts',
      'Supabase project URL and anon key',
      'Claude Code (or Claude Co-Work) for code generation',
    ],
    prompt: `Build a neighborhood blog website that reads published content from a Supabase-powered CMS.

Use the blog-cms-template build-public-website prompt.

Tech Stack: React 19 + Vite 8 + Tailwind CSS 4 + Supabase
Pages: Home, Blog Index, Blog Post, Category, About, Contact, 404

The site should read from the blog_posts table (status = 'published')
and render all JSONB content block types.`,
    example: 'Build a public blog website for my "Living in Kenwood" brand that reads from my CMS Supabase database.',
    fullContent: `# What Gets Built

## Pages
1. **Home** — Hero + featured posts grid + categories + CTA
2. **Blog Index** (/blog) — Filterable grid with search, category filter
3. **Blog Post** (/blog/:slug) — Full article with content renderer, sidebar, TOC
4. **Category Page** (/blog/category/:category) — Filtered index
5. **About** — Placeholder content area
6. **Contact** — Agent info, booking calendar iframe, Google Maps embed
7. **404** — Styled not-found page

## Content Renderer
Handles all CMS block types: paragraph, heading, subheading, list, callout, quote, image, table, pros-cons, info-box, stat-cards, process-steps. Skips "prompt" blocks (internal only).

## Environment Variables
\`\`\`
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_NAME=Living in Kenwood
VITE_SITE_TAGLINE=Your guide to one of St. Pete's most charming neighborhoods
VITE_BOOKING_URL=https://your-booking-calendar-url
VITE_CONTACT_EMAIL=you@example.com
VITE_CONTACT_PHONE=(555) 555-5555
\`\`\``,
  },
];

function PromptCard({ prompt }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
      >
        <FileText className="w-4.5 h-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{prompt.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{prompt.description}</p>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
          : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
        }
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
          {/* Prerequisites */}
          <div className="pt-4">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Prerequisites</h4>
            <ul className="space-y-1">
              {prompt.prerequisites.map((prereq, i) => (
                <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">-</span>
                  {prereq}
                </li>
              ))}
            </ul>
          </div>

          {/* The Prompt */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Prompt</h4>
            <div className="relative">
              <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">{prompt.prompt}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={prompt.prompt} />
              </div>
            </div>
          </div>

          {/* Example usage */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Example Usage</h4>
            <div className="relative">
              <pre className="text-xs bg-slate-100 text-slate-700 p-3 rounded-lg font-mono whitespace-pre-wrap">{prompt.example}</pre>
              <div className="absolute top-1.5 right-1.5">
                <CopyButton text={prompt.example} />
              </div>
            </div>
          </div>

          {/* Extended content */}
          <div>
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Details</h4>
            <div className="text-xs text-slate-600 leading-relaxed space-y-2 prose-headings:text-slate-800 prose-headings:font-semibold">
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 leading-relaxed">{prompt.fullContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptsWorkflows() {
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Prompts & Workflows
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            These prompt templates guide Claude Code through the CMS workflows. Click any prompt to expand its full content, prerequisites, and example usage. Copy the prompt text and paste it into Claude Code.
          </p>
        </div>

        <div className="space-y-3">
          {PROMPTS.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Workflow Order</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
              <p><strong className="text-slate-800">Setup Knowledge Base</strong> — Do this once. Sets up your voice and style reference material.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
              <p><strong className="text-slate-800">Research Topic</strong> — Research keywords and save to the content pipeline. Review and approve in the CMS.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
              <p><strong className="text-slate-800">Generate Blog Post</strong> — Write blog posts from approved topics or YouTube transcripts.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex-shrink-0 mt-0.5">4</span>
              <p><strong className="text-slate-800">SEO Review</strong> — Audit the draft before publishing. Fix any issues flagged.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex-shrink-0 mt-0.5">5</span>
              <p><strong className="text-slate-800">Build Public Website</strong> — One-time setup of your reader-facing site that displays published posts.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
