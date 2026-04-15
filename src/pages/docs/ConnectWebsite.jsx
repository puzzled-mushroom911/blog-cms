import { useState } from 'react';
import { Copy, CheckCircle, Globe, Database, FileCode2, Newspaper } from 'lucide-react';
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

const SUPABASE_DIRECT_CODE = `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Your workspace ID (find it in CMS Settings or the workspaces table)
const WORKSPACE_ID = process.env.WORKSPACE_ID

// Fetch published posts (scoped to your workspace)
const { data: posts } = await supabase
  .from('blog_posts')
  .select('slug, title, excerpt, date, read_time, category, tags, image')
  .eq('workspace_id', WORKSPACE_ID)
  .eq('status', 'published')
  .order('date', { ascending: false })
  .limit(20)

// Fetch a single post by slug
const { data: post } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('workspace_id', WORKSPACE_ID)
  .eq('slug', 'your-post-slug')
  .eq('status', 'published')
  .single()`;

const REST_API_FETCH = `// Vanilla fetch
const API_URL = 'https://your-cms-url.vercel.app'
const API_KEY = 'your-api-key'

const response = await fetch(\`\${API_URL}/api/v1/posts?status=published&limit=20\`, {
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
  },
})
const { data: posts } = await response.json()`;

const NEXTJS_CODE = `// app/blog/page.jsx (Next.js App Router)
const API_URL = process.env.CMS_API_URL
const API_KEY = process.env.CMS_API_KEY

export default async function BlogPage() {
  const res = await fetch(\`\${API_URL}/api/v1/posts?status=published&limit=20\`, {
    headers: { Authorization: \`Bearer \${API_KEY}\` },
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  })
  const { data: posts } = await res.json()

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  )
}

// app/blog/[slug]/page.jsx
export default async function BlogPost({ params }) {
  const { slug } = await params
  const res = await fetch(\`\${API_URL}/api/v1/posts/\${slug}\`, {
    headers: { Authorization: \`Bearer \${API_KEY}\` },
    next: { revalidate: 60 },
  })
  const { data: post } = await res.json()

  return (
    <article>
      <h1>{post.title}</h1>
      {/* Render post.content blocks */}
    </article>
  )
}`;

const REACT_CODE = `// React + Vite (client-side)
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_CMS_API_URL
const API_KEY = import.meta.env.VITE_CMS_API_KEY

function usePosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(\`\${API_URL}/api/v1/posts?status=published&limit=20\`, {
      headers: { Authorization: \`Bearer \${API_KEY}\` },
    })
      .then(res => res.json())
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  return { posts, loading }
}`;

const WORDPRESS_INFO = `WordPress publishing lets you push content from the CMS to your WordPress site.

Setup:
1. Go to CMS Settings > WordPress Connection
2. Enter your WordPress site URL
3. Create a WordPress Application Password:
   - WordPress Admin > Users > Your Profile
   - Scroll to "Application Passwords"
   - Enter a name and click "Add New Application Password"
   - Copy the generated password
4. Enter your WordPress username and application password
5. Save and test the connection

Usage:
- From any published post, click "Publish to WordPress"
- The CMS converts content blocks to WordPress HTML
- The post appears as a draft (or published) on your WordPress site`;

export default function ConnectWebsite() {
  const [activeOption, setActiveOption] = useState('supabase');

  const options = [
    { id: 'supabase', label: 'Supabase Direct', icon: Database },
    { id: 'api', label: 'REST API', icon: FileCode2 },
    { id: 'wordpress', label: 'WordPress', icon: Newspaper },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5" />
          Connect Your Website
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Three ways to get your published content onto your website. Choose the approach that fits your stack.
        </p>

        {/* Option toggle */}
        <div className="flex gap-2 mb-4">
          {options.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveOption(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeOption === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Supabase Direct */}
        {activeOption === 'supabase' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Option A: Supabase Direct</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your website reads from the same Supabase database as the CMS. This is the simplest approach — no API middleware, no extra authentication. RLS policies ensure your website only sees published posts via the anon key.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Best for:</p>
              <ul className="text-xs text-slate-500 space-y-1 ml-4">
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> React/Next.js sites using Supabase</li>
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Maximum simplicity (one data source)</li>
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Real-time updates (Supabase realtime)</li>
              </ul>
            </div>

            <div className="relative">
              <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono">{SUPABASE_DIRECT_CODE}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={SUPABASE_DIRECT_CODE} />
              </div>
            </div>
          </div>
        )}

        {/* REST API */}
        {activeOption === 'api' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Option B: REST API</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fetch published posts via the CMS REST API using an API key. Works with any language or framework — no Supabase SDK required on your website.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Best for:</p>
              <ul className="text-xs text-slate-500 space-y-1 ml-4">
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Non-Supabase websites (any tech stack)</li>
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Server-side rendering (Next.js, Astro, etc.)</li>
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Static site generation with ISR</li>
              </ul>
            </div>

            {/* Vanilla fetch */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Vanilla Fetch</p>
              <div className="relative">
                <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono">{REST_API_FETCH}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={REST_API_FETCH} />
                </div>
              </div>
            </div>

            {/* Next.js */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Next.js (App Router with ISR)</p>
              <div className="relative">
                <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono max-h-80 overflow-y-auto">{NEXTJS_CODE}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={NEXTJS_CODE} />
                </div>
              </div>
            </div>

            {/* React */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">React + Vite</p>
              <div className="relative">
                <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono">{REACT_CODE}</pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={REACT_CODE} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WordPress */}
        {activeOption === 'wordpress' && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Option C: WordPress</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publish directly from the CMS to your WordPress site. The CMS converts content blocks to WordPress-compatible HTML and pushes via the WordPress REST API.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Best for:</p>
              <ul className="text-xs text-slate-500 space-y-1 ml-4">
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Existing WordPress websites</li>
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> Users who want AI content creation with WordPress publishing</li>
                <li className="flex items-start gap-2"><span className="text-slate-300">-</span> No code changes to your WordPress site</li>
              </ul>
            </div>

            <div className="relative">
              <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">{WORDPRESS_INFO}</pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={WORDPRESS_INFO} />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> WordPress publishing converts content blocks to HTML. Some complex block types (stat-cards, process-steps) are rendered as styled HTML divs. Image upload to the WordPress media library is not yet supported — images must be hosted externally.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
