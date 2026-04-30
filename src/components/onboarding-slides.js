// Step-by-step onboarding slides. Each slide is one short clip Aaron recorded walking
// through the CMS. Order matches the real setup order: connect DB → prompts → API key →
// website → feedback loop → first post.

export const ONBOARDING_SLIDES = [
  {
    id: 'welcome',
    video: '/onboarding/01-intro.mp4',
    title: 'Welcome to the Blog CMS',
    description:
      "This is where AI writes, you edit, and Claude learns your voice over time. Before you dive in, here's the 30-second tour — seven quick steps to get you fully set up.",
  },
  {
    id: 'connect-database',
    video: '/onboarding/03-database.mp4',
    title: 'Connect your Supabase database',
    description:
      "You run your own Supabase project and point the CMS at it — that way Claude can edit the CMS just by talking to Supabase. Make sure pgvector is enabled, then paste the schema SQL into the SQL editor to set up every table the CMS expects.",
  },
  {
    id: 'prompts',
    video: '/onboarding/02-prompts.mp4',
    title: 'Load the prompts into Claude',
    description:
      "These prompts are the playbook — how Claude researches topics, writes posts in your voice, and runs the full SEO workflow. Read them here or grab the full versions from the GitHub repo, then drop them into your Claude Code setup.",
  },
  {
    id: 'api-key',
    video: '/onboarding/07-api-mcp.mp4',
    title: 'Generate an API key',
    description:
      "Create a key in Settings so Claude Code can talk to the CMS. Add a Pexels key too if you want to pull in stock photos. The MCP server is available but can be hit-or-miss — the way Aaron actually uses it is plugging Claude straight into Supabase.",
  },
  {
    id: 'connect-website',
    video: '/onboarding/05-connect.mp4',
    title: 'Connect your public website',
    description:
      "Two options: Supabase direct (easiest — your site just reads from the same database) or the REST API (exists as a non-technical route but honestly makes things more complicated). Pick what fits your stack.",
  },
  {
    id: 'feedback-loop',
    video: '/onboarding/04-feedback.mp4',
    title: 'Turn on the feedback loop',
    description:
      "Every correction you make in the CMS gets captured and stored. Future posts pull relevant past corrections automatically, so Claude's voice gets closer to yours with every edit.",
  },
  {
    id: 'first-post',
    video: '/onboarding/08-content-demo.mp4',
    title: 'Create and publish your first post',
    description:
      "Here's how the editor works: content blocks, prompt blocks for inline instructions to Claude, block-level comments you can ask Claude to resolve, sources, AI reasoning, and the full SEO intelligence panel. You're ready to start writing.",
  },
];
