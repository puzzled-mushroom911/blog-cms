# CMS UI Polish — shadcn/ui Migration + Feedback System

**Date:** 2026-04-11
**Status:** Design
**Goal:** Improve interaction quality across the CMS — clear feedback on every action, polished controls, consistent component patterns.

## Problem

The CMS is functional but lacks interaction feedback. Clicking "Save" gives no visible confirmation. Modals (Pexels search) feel basic. Form controls are hand-rolled Tailwind with inconsistent focus/hover states. The user has to trust things worked rather than seeing proof.

## Approach

Two changes working together:

1. **shadcn/ui component swap** — Replace hand-rolled form primitives with shadcn components
2. **Toast notification system** — Add Sonner for action feedback across all screens

### What We Are NOT Doing

- No layout changes, navigation restructuring, or page redesigns
- No new features or workflow changes
- No TypeScript migration (project is JSX)

## Setup Requirements

### shadcn/ui + Vite + Tailwind CSS 4

Current stack: React 19, Vite 8, Tailwind CSS 4, JSX (not TypeScript).

**Setup steps:**
1. Add `@` path alias to `vite.config.js` (required by shadcn)
2. Install core deps: `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`
3. Create `components.json` (rsc: false, tsx: false, baseColor: slate, cssVariables: true)
4. Create `src/lib/utils.js` with `cn()` helper
5. Run `npx shadcn@latest init` to verify config
6. Add components via CLI: `npx shadcn@latest add button input select badge dialog textarea label sonner`

**Note:** shadcn generates TypeScript files by default. Since this project uses JSX, we'll either configure for JS output or rename `.tsx` → `.jsx` after generation. The `tsx: false` flag in components.json should handle this.

### Components to Install

| shadcn Component | Replaces |
|-----------------|----------|
| `Button` | All hand-rolled `<button>` elements with loading states |
| `Input` | All `<input>` fields with consistent focus rings |
| `Textarea` | All `<textarea>` fields |
| `Select` | All `<select>` dropdowns (status, category, sort) |
| `Badge` | `StatusBadge.jsx` — cleaner status pills |
| `Dialog` | Pexels search modal, delete confirmations |
| `Label` | All form `<label>` elements |
| `Card` | PostCard, TopicCard, SeoPageCard, StatCard wrappers |
| `Sonner` (toast) | NEW — action feedback system |

## Component Migration Plan

### Phase 1: Foundation (no visual change yet)

- Add `@` path alias to vite.config.js
- Install shadcn deps and create components.json
- Create `src/lib/utils.js` with `cn()` helper
- Add `tw-animate-css` import to index.css
- Install all shadcn components listed above

### Phase 2: Toast System (biggest UX win)

Add `<Toaster />` to App.jsx, then add `toast.success()` / `toast.error()` calls to every action:

| Screen | Action | Toast Message |
|--------|--------|--------------|
| PostEditor | Save | "Post saved" / "Failed to save" |
| PostEditor | Delete | "Post deleted" / "Failed to delete" |
| PostEditor | Status change | "Status updated to {status}" |
| MetadataSidebar | Save | "Changes saved" |
| MetadataSidebar | Image upload | "Image uploaded" / "Upload failed" |
| MetadataSidebar | Pexels select | "Featured image updated" |
| Topics | Status change | "Topic moved to {status}" |
| TopicDetail | Save notes | "Notes saved" |
| ApprovalQueue | Approve | "Approved {n} pages" / "Approval failed" |
| ApprovalQueue | Reject | "Page rejected" |
| SeoPageEditor | Save | "Page saved" / "Failed to save" |
| Settings | Save | "Settings saved" |
| Login | Error | "Sign in failed: {message}" |

### Phase 3: Button + Form Control Swap

Replace across all files:

- `<button>` → `<Button>` with `variant`, `size`, and loading state via `disabled` + spinner
- `<input>` → `<Input>`
- `<textarea>` → `<Textarea>`
- `<select>` → `<Select>` (shadcn's Radix-based select with proper keyboard nav)
- `<label>` → `<Label>`
- Hand-rolled status pills → `<Badge variant={...}>`

### Phase 4: Dialog + Card Swap

- Pexels search modal → `<Dialog>` with proper backdrop, escape-to-close, focus trap
- Delete confirmations → `<Dialog>` with destructive button variant
- PostCard / TopicCard / SeoPageCard / StatCard → `<Card>` wrapper for consistent elevation and hover

### Phase 5: Loading States

Add loading spinners to all buttons that trigger async operations:

- Save buttons: show spinner + "Saving..." text while request is in flight
- Approve/reject buttons: spinner during batch operations
- Delete buttons: spinner during deletion
- Status change selects: brief disabled state during update

## Files to Modify

**New files:**
- `src/components/ui/` — shadcn component directory (auto-generated)
- `src/lib/utils.js` — `cn()` helper
- `components.json` — shadcn config

**Modified files (all existing):**
- `vite.config.js` — add path alias
- `src/index.css` — add tw-animate-css import
- `src/App.jsx` — add `<Toaster />`
- `src/components/Layout.jsx` — Button for nav/signout
- `src/components/MetadataSidebar.jsx` — Input, Select, Textarea, Label, Button, Dialog, toast
- `src/components/ContentRenderer.jsx` — Button, Dialog for block inserter
- `src/components/PostCard.jsx` — Card, Badge, Button
- `src/components/TopicCard.jsx` — Card, Badge, Button
- `src/components/SeoPageCard.jsx` — Card, Badge
- `src/components/StatusBadge.jsx` — Badge (or replace entirely)
- `src/components/PexelsSearch.jsx` — Dialog, Input, Button
- `src/components/BlockNotes.jsx` — Button, Input
- `src/components/ImageUpload.jsx` — Button
- `src/pages/Dashboard.jsx` — Card, Input, Button, Select, toast
- `src/pages/PostEditor.jsx` — Button, toast for save/delete
- `src/pages/Topics.jsx` — Input, Select, Button
- `src/pages/TopicDetail.jsx` — Button, Input, toast
- `src/pages/ApprovalQueue.jsx` — Button, Badge, toast
- `src/pages/SeoPages.jsx` — Input, Button, Badge
- `src/pages/SeoPageEditor.jsx` — Button, Input, toast
- `src/pages/Settings.jsx` — Button, Input, toast
- `src/pages/Login.jsx` — Button, Input, Label
- `src/pages/Calendar.jsx` — Card, Badge

## Testing

- Manual testing: every save/delete/approve/reject action should show a toast
- Every button with an async action should show a loading spinner
- Pexels modal should trap focus and dismiss with Escape
- All form controls should have visible focus rings for keyboard navigation
- Verify build succeeds locally before pushing (no more missing import failures)
