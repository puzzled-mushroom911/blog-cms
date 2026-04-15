import { Rocket, Database, Globe, ArrowRight } from 'lucide-react';

export default function GettingStarted() {
  return (
    <div className="space-y-8">
      {/* What this CMS does */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5" />
          What This CMS Does
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            This is an AI-powered blog CMS built for creators who use Claude Code. It turns YouTube transcripts into
            SEO-optimized blog posts, learns your writing style from your edits, and manages your entire content pipeline
            from research to publishing.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Connect via MCP (Model Context Protocol) and Claude Code becomes your content team — researching keywords,
            drafting posts in your voice, and publishing to your website. Or use the REST API to integrate with any tool.
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
              <p className="text-sm font-medium text-slate-700">Generate your first blog post</p>
              <p className="text-xs text-slate-500">
                Use the "Generate Blog Post" prompt with a YouTube transcript. Claude Code will create a full post with SEO metadata, content blocks, and your voice.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">5</span>
            <div>
              <p className="text-sm font-medium text-slate-700">Review, edit, and publish</p>
              <p className="text-xs text-slate-500">
                Review the draft in the CMS editor. Every edit you make teaches the system your preferences for next time.
              </p>
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
