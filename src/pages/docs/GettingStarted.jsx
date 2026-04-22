import { Rocket, Database, Globe, ArrowRight, PenLine, Search, Zap, LayoutDashboard, Calendar, BarChart3, FileText, Settings } from 'lucide-react';
import VideoClip from '@/components/VideoClip';

export default function GettingStarted() {
  return (
    <div className="space-y-8">
      {/* Walkthrough video */}
      <section>
        <VideoClip
          src="/onboarding/01-intro.mp4"
          title="Start here — the 30-second tour"
          caption="Aaron walks through what this CMS is, what it does, and where to look first. Each tab below has its own short clip for that section."
          duration="0:35"
        />
      </section>

      {/* What this CMS does */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5" />
          What This CMS Does
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            This is an AI-powered blog CMS built for creators who use Claude Code. It manages your entire content
            lifecycle — from keyword research to publishing — through a unified Content feed where blog posts and SEO
            pages live side by side, each tagged with type badges so you always know what you're looking at.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Every post has an SEO Intelligence panel built into the editor, showing AI reasoning, keyword data, related
            keywords, People Also Ask questions, SERP features, and content gaps — all linked from research topics.
            Connect via MCP and Claude Code becomes your content team, or use the REST API to integrate with any tool.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            The CMS supports three workflow types: write manually by telling Claude what to create, collaborate by
            researching keywords first and picking the best topics, or go full autopilot and let Claude research,
            write, and queue posts on a schedule while you just review and approve.
          </p>
        </div>
      </section>

      {/* Quick start */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Start</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Sign up and create a workspace</p>
              <p className="text-xs text-slate-500">
                Your workspace is your isolated content environment. All posts, topics, preferences, and API keys are scoped to it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Connect Claude Code via MCP</p>
              <p className="text-xs text-slate-500">
                Create an API key in Settings, add the MCP config to your Claude Code setup, and restart. See the <strong>API Reference</strong> tab for full setup instructions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Set up your knowledge base</p>
              <p className="text-xs text-slate-500">
                Give Claude Code your YouTube transcripts and brand voice so it can write content that sounds like you. See the <strong>Prompts & Workflows</strong> tab.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">4</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Choose your workflow</p>
              <p className="text-xs text-slate-500">
                Pick how you want to work: tell Claude what to write (manual), research keywords first and pick topics (collaborative), or let Claude run on a schedule and just approve drafts (automated). See <strong>How You'll Use It</strong> below.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How You'll Use It — 3 workflow types */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">How You'll Use It</h2>
        <p className="text-xs text-slate-500 mb-4">
          Three ways to create content — pick the one that fits how you work, or mix and match.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Manual */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <PenLine className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Just Write</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Manual</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tell Claude what to write. It creates a blog post with all fields populated and saves it as a draft. You review, edit, and publish.
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-[11px] text-slate-500">Tell Claude: "Write me a blog about [topic]"</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-[11px] text-slate-500">Draft appears in Content feed</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-[11px] text-slate-500">Review, edit, publish</p>
              </div>
            </div>
          </div>

          {/* Collaborative */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Research First</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Collaborative</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Claude researches keywords with DataForSEO. You pick the best topics, then Claude writes. The SEO tab shows all the research data alongside your content.
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-[11px] text-slate-500">Ask Claude to research keywords</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-[11px] text-slate-500">Pick topics from the pipeline, then Claude writes</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-[11px] text-slate-500">Review with full SEO data in editor</p>
              </div>
            </div>
          </div>

          {/* Automated */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Full Autopilot</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Automated</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Claude picks topics and writes posts on a schedule. Drafts appear in your Content feed with full SEO data. You just approve from the Calendar or editor.
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-[11px] text-slate-500">Set Claude on a recurring schedule</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-[11px] text-slate-500">Drafts auto-appear with SEO data</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-[11px] text-slate-500">Quick-approve from Calendar or review in editor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* See the Content page in action */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">See It in Action</h2>
        <VideoClip
          src="/onboarding/08-content-demo.mp4"
          title="Working with posts in the Content feed"
          caption="Aaron opens a draft and walks through the editor — blocks (heading, paragraph, list, callout, prompt), image upload and Pexels, block comments, metadata, sources, AI reasoning, and the SEO panel."
          duration="2:47"
        />
      </section>

      {/* CMS Navigation */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">CMS Navigation</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500 mb-4">The sidebar has five items — everything you need, nothing you don't.</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Content</p>
                <p className="text-xs text-slate-500">Unified feed of blog posts and SEO pages with type badges (blue "Blog", violet "SEO Page"). Create new posts with the New Post button in the header.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Calendar</p>
                <p className="text-xs text-slate-500">Visual content calendar with quick-approve buttons for drafts and items in review. See what's scheduled and what needs attention.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Analytics</p>
                <p className="text-xs text-slate-500">Keyword maps, pipeline funnel visualization, and publishing velocity. Track how your content strategy is performing.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Docs</p>
                <p className="text-xs text-slate-500">This documentation — getting started, prompts and workflows, API reference, and the block type guide.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Settings</p>
                <p className="text-xs text-slate-500">Brand configuration, API keys, deploy hooks, and the Content Pipeline toggle (off by default — enable it for the collaborative workflow).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture overview */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Architecture Overview</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-4">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-violet-600" />
              </div>
              <p className="text-xs font-medium text-slate-700">CMS Dashboard</p>
              <p className="text-[10px] text-slate-400">Write, review, publish</p>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-300 rotate-90 sm:rotate-0 flex-shrink-0" />

            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-slate-700">API / MCP Server</p>
              <p className="text-[10px] text-slate-400">REST & Claude Code tools</p>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-300 rotate-90 sm:rotate-0 flex-shrink-0" />

            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-xs font-medium text-slate-700">Your Website</p>
              <p className="text-[10px] text-slate-400">Supabase, API, or WordPress</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs text-slate-500">
            <p>
              <strong className="text-slate-700">Supabase</strong> is the database layer. All content lives in Supabase tables with row-level security.
            </p>
            <p>
              <strong className="text-slate-700">MCP Server</strong> lets Claude Code interact with your CMS using natural language — creating posts, researching topics, and managing your content pipeline.
            </p>
            <p>
              <strong className="text-slate-700">REST API</strong> provides standard HTTP endpoints for any tool or website that needs to read or write content.
            </p>
            <p>
              <strong className="text-slate-700">Your website</strong> reads published posts from Supabase directly, via the REST API, or through WordPress publishing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
