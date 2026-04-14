# Dual-Mode CMS: Hosted + BYO Supabase

**Date:** 2026-04-14
**Status:** Approved
**Scope:** Refactor the CMS landing experience to support two user paths on a single deployment at cms.moonify.ai

## Problem

The CMS currently has a build-time `isHostedMode` flag. When Supabase env vars are set (as they are on cms.moonify.ai), the Connect page is completely inaccessible — visitors can only sign up for the hosted Supabase. This blocks Goal 2: letting other people connect their own Supabase projects.

## Goals

1. **Hosted path (Aaron's use):** Sign in with existing account, manage livinginstpetefl.com blog content. Already working.
2. **BYO path (other users):** Connect any Supabase project, run the setup SQL, create an account, and use the full CMS with their own data.
3. **Usage tracking:** Know how many BYO users successfully set up the CMS.

## Design

### Landing Page (replaces current Login/Signup/Connect routing)

New route: `/welcome` — the entry point for unauthenticated users.

Two equal-weight cards side by side:

**Card 1: "Use Moonify's Database"**
- Subtitle: "Instant setup. We host everything. Just create an account and start managing content."
- Button: "Sign Up Free" → goes to `/signup`
- Below: "Already have an account? Sign in" → `/login`

**Card 2: "Connect Your Own Supabase"**
- Subtitle: "Bring your own database. Your content, your data, full control. Works with any Supabase project."
- Button: "Connect Database" → goes to `/connect`
- Below: "Already connected? Sign in" → `/login`

**Below the cards:** A brief "How it works" section with 3-4 steps explaining both paths. Generous guidance text — err on the side of more information.

### Architecture Change

Remove the build-time `isHostedMode` boolean. Replace with a runtime concept:

- `connectionMode`: `'hosted'` | `'byo'` — determined by how the user connected
  - If the user signed up or logged in without providing custom credentials → `'hosted'` (uses env var Supabase)
  - If the user entered their own URL + anon key on the Connect page → `'byo'` (uses localStorage credentials)
- Store the mode in localStorage alongside the connection credentials
- The Supabase client creation logic (`getClient()`) already supports both — it checks env vars first, then localStorage. The only change is making both paths reachable in the UI.

### Connect Page Updates

Keep the existing Connect page flow (Option A — manual SQL copy). Improve guidance:

- Add numbered step-by-step instructions with more detail
- Add a "What you'll need" checklist at the top (Supabase account, project URL, anon key)
- After connecting, the Setup page checks tables and provides the copy-SQL flow as today
- After setup + account creation → redirect to Dashboard

### Anonymous Tracking Ping

When a BYO user successfully completes setup (tables verified + account created), the CMS sends one anonymous POST to a tracking endpoint on the hosted Supabase:

**Table: `cms_installs`** (in the hosted Supabase project — wosfsgadatfgfboxzogo)
- `id` UUID primary key
- `project_hash` text — SHA-256 of the Supabase project URL (no PII, just uniqueness)
- `created_at` timestamptz

**Endpoint:** Supabase Edge Function or direct insert via the hosted anon key (since this table only needs insert permission from anonymous users).

Implementation: After the Setup page confirms all tables exist and the user has created their account, fire a single `fetch()` to record the install. Fire-and-forget — failure doesn't block anything.

### Routing Changes

| Route | Current | New |
|-------|---------|-----|
| `/` (unauthenticated) | Redirect to `/signup` or `/connect` based on `isHostedMode` | Redirect to `/welcome` |
| `/welcome` | Doesn't exist | New landing page with two cards |
| `/signup` | Hosted-only | Available always (creates account on hosted Supabase) |
| `/connect` | BYO-only | Available always |
| `/setup` | Requires connection | Requires BYO connection |
| `/login` | Requires connection | Available always (tries hosted first, then checks BYO localStorage) |
| `/` (authenticated) | Dashboard | Dashboard (unchanged) |

### Login Flow Update

The Login page needs to handle both modes:

1. Try to authenticate against the hosted Supabase (env var credentials)
2. If that fails AND the user has BYO credentials in localStorage, try those
3. If neither works, show error

Or simpler: if BYO credentials exist in localStorage, use those. Otherwise use hosted. The user chose their path on the landing page — respect that choice.

### Files to Change

1. `src/lib/supabase.js` — Remove `isHostedMode` export. Add `connectionMode` concept.
2. `src/contexts/ConnectionContext.jsx` — Remove `isHostedMode`. Use runtime mode detection.
3. `src/pages/Welcome.jsx` — New landing page component.
4. `src/pages/Connect.jsx` — Add better guidance text.
5. `src/pages/Setup.jsx` — Add tracking ping on successful setup.
6. `src/pages/Login.jsx` — Handle both hosted and BYO auth.
7. `src/App.jsx` — Update routing to include `/welcome`, remove `isHostedMode` references.
8. `src/components/ProtectedRoute.jsx` — Update redirect target from `isHostedMode ? '/signup' : '/connect'` to `'/welcome'`.

### What Stays the Same

- Dashboard, PostEditor, Topics, Settings, Calendar, SEO pages — all unchanged
- Workspace architecture — unchanged (BYO users create their own workspace on setup)
- MCP server / API — unchanged (uses service role key, independent of frontend auth)
- The Setup SQL — unchanged content, just better presentation
- RLS policies — unchanged

## Out of Scope

- Multi-workspace switching UI
- Billing or paid tiers
- Auto-running SQL (sticking with manual copy-paste)
- Any changes to the livinginstpete-next website
