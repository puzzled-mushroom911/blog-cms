# CMS UI Polish — shadcn/ui + Toast Feedback

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-rolled UI primitives with shadcn/ui components and add toast feedback to every async action.

**Architecture:** Install shadcn/ui into the existing Vite + React 19 + Tailwind 4 project. Add Sonner toast provider at the app root. Migrate components bottom-up: foundation → toasts → form controls → dialogs → loading states.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, shadcn/ui (latest), Sonner, Radix UI primitives

---

### Task 1: Foundation — Path Alias + shadcn Setup

**Files:**
- Modify: `vite.config.js`
- Create: `src/lib/utils.js`
- Create: `components.json`
- Modify: `src/index.css`

- [ ] **Step 1: Add @ path alias to vite.config.js**

```js
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Install shadcn dependencies**

Run: `npm install shadcn class-variance-authority clsx tailwind-merge tw-animate-css`

- [ ] **Step 3: Create src/lib/utils.js**

```js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Add tw-animate-css import to src/index.css**

```css
@import 'tailwindcss';
@import 'tw-animate-css';
```

- [ ] **Step 5: Run `npx shadcn@latest init` and configure**

Accept defaults but ensure: rsc=false, tsx=false (JSX project), baseColor=slate, cssVariables=true. If init doesn't support jsx, run it and rename files after.

- [ ] **Step 6: Install shadcn components**

Run: `npx shadcn@latest add button input textarea select badge dialog label sonner card`

If components generate as .tsx, rename all files in src/components/ui/ from .tsx to .jsx and remove TypeScript type annotations.

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add shadcn/ui foundation — path alias, utils, components"
```

---

### Task 2: Toast System — Add Sonner to Every Async Action

**Files:**
- Modify: `src/App.jsx` — add `<Toaster />`
- Modify: `src/pages/PostEditor.jsx` — toast on save/publish/delete
- Modify: `src/pages/TopicDetail.jsx` — toast on save
- Modify: `src/pages/SeoPageEditor.jsx` — toast on save/approve/delete
- Modify: `src/pages/Settings.jsx` — toast on save/reset
- Modify: `src/pages/ApprovalQueue.jsx` — toast on approve/reject
- Modify: `src/pages/Login.jsx` — toast on error

- [ ] **Step 1: Add Toaster to App.jsx**

Add `import { Toaster } from "@/components/ui/sonner"` and render `<Toaster richColors position="bottom-right" />` as a sibling to `<Routes>`.

- [ ] **Step 2: PostEditor.jsx — replace saveMessage with toast**

Remove the `saveMessage` state and the `<span>` that displays it. Replace with:
- `handleSave` success: `toast.success("Post saved")` or `toast.success("Saved & deploy triggered")` for published
- `handleSave` error: `toast.error("Failed to save: " + error.message)`
- `handlePublish` success: `toast.success("Published & deploy triggered")`
- `handlePublish` error: `toast.error("Failed to publish: " + error.message)`
- `handleDelete` success: `toast.success("Post deleted")` (before navigate)
- `handleDelete` error: `toast.error("Failed to delete: " + error.message)`

Import: `import { toast } from "sonner"`

- [ ] **Step 3: TopicDetail.jsx — replace saveMessage with toast**

Remove `saveMessage` state and display span. Replace with:
- Success: `toast.success("Topic saved")`
- Error: `toast.error("Failed to save: " + error.message)`

- [ ] **Step 4: SeoPageEditor.jsx — add toasts**

Replace the `error` state display with toasts:
- `handleSave` success: `toast.success("Page saved")`
- `handleSave` error: `toast.error("Failed to save: " + err.message)`
- `handleApprove` success: `toast.success("Page approved")`
- `handleApprove` error: `toast.error("Failed to approve: " + err.message)`
- `handleDelete` success: `toast.success("Page deleted")` (before navigate)
- `handleDelete` error: `toast.error("Failed to delete: " + err.message)`

- [ ] **Step 5: Settings.jsx — replace saved state with toast**

Remove `saved` state. In `handleSave`: `toast.success("Settings saved")`. In `handleReset`: `toast.success("Settings reset to defaults")`.

- [ ] **Step 6: ApprovalQueue.jsx — add toasts**

On batch approve success: `toast.success(\`Approved ${count} page(s)\`)`. On approve error: `toast.error("Approval failed")`. On individual reject: `toast.success("Page rejected")`.

- [ ] **Step 7: Login.jsx — toast on error**

Replace the inline error div with: `toast.error(authError.message)` in the catch block. Remove `error` state.

- [ ] **Step 8: Verify and commit**

Run: `npm run build`
Expected: Build succeeds.

```bash
git add -A && git commit -m "feat: add toast notifications to all async actions"
```

---

### Task 3: Button Swap — Replace All Hand-Rolled Buttons

**Files:**
- Modify: All pages and components that have `<button>` elements

- [ ] **Step 1: PostEditor.jsx buttons**

Replace all `<button>` elements with shadcn `<Button>`:
- Back arrow: `<Button variant="ghost" size="icon">`
- Delete: `<Button variant="ghost" size="icon">` with hover red styling
- Publish: `<Button variant="default" className="bg-emerald-600 hover:bg-emerald-700">` with `disabled={saving}`
- Save: `<Button disabled={saving}>` (default variant)
- Sidebar toggle: `<Button variant="ghost" size="icon">`

For loading states, use the pattern:
```jsx
<Button disabled={saving}>
  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
  {saving ? "Saving..." : "Save"}
</Button>
```

- [ ] **Step 2: MetadataSidebar.jsx — Button for save**

Replace the save button with `<Button className="w-full" disabled={saving}>`.

- [ ] **Step 3: TopicDetail.jsx — Button for save**

Replace save button with `<Button>` and back button with `<Button variant="ghost" size="icon">`.

- [ ] **Step 4: SeoPageEditor.jsx — Buttons**

Replace approve, save, delete, back, and sidebar toggle buttons with `<Button>` variants.

- [ ] **Step 5: Settings.jsx — Buttons**

Replace save and reset buttons with `<Button>` and `<Button variant="outline">`.

- [ ] **Step 6: Login.jsx — Button**

Replace submit button with `<Button className="w-full" disabled={loading}>`.

- [ ] **Step 7: Dashboard.jsx — filter tab buttons**

Replace status filter buttons with `<Button variant="ghost" size="sm">` or keep as custom toggle group (shadcn doesn't have a perfect match for segmented controls — keep the existing pattern but use Button primitives).

- [ ] **Step 8: Calendar.jsx — navigation buttons**

Replace prev/next/today buttons with `<Button variant="outline" size="sm">` and `<Button variant="ghost" size="icon">`.

- [ ] **Step 9: TopicCard.jsx — quick action buttons**

Replace Research/Approve/Discard buttons with `<Button variant="secondary" size="sm">`.

- [ ] **Step 10: ApprovalQueue.jsx — approve/reject buttons**

Replace batch approve and individual action buttons with `<Button>` variants.

- [ ] **Step 11: Verify and commit**

Run: `npm run build`

```bash
git add -A && git commit -m "feat: replace all buttons with shadcn Button component"
```

---

### Task 4: Form Control Swap — Input, Textarea, Select, Label

**Files:**
- Modify: `src/pages/Dashboard.jsx` — search input, sort select
- Modify: `src/pages/Topics.jsx` — search input, sort/status selects
- Modify: `src/pages/SeoPages.jsx` — search input, filter selects
- Modify: `src/components/MetadataSidebar.jsx` — all form fields
- Modify: `src/pages/TopicDetail.jsx` — status select, notes textarea
- Modify: `src/pages/SeoPageEditor.jsx` — sidebar form fields
- Modify: `src/pages/Settings.jsx` — all fields
- Modify: `src/pages/Login.jsx` — email/password inputs
- Modify: `src/components/BlockNotes.jsx` — note input

- [ ] **Step 1: Replace `<input>` with shadcn `<Input>`**

Across all files, replace `<input type="text"` and `<input type="search"` with the shadcn `<Input>` component. Remove the hand-rolled focus/border classes since Input provides them.

Import: `import { Input } from "@/components/ui/input"`

- [ ] **Step 2: Replace `<textarea>` with shadcn `<Textarea>`**

Replace in MetadataSidebar, TopicDetail, SeoPageEditor, Settings.

Import: `import { Textarea } from "@/components/ui/textarea"`

- [ ] **Step 3: Replace `<select>` with shadcn `<Select>`**

Note: shadcn Select is Radix-based and uses a different API than native `<select>`:
```jsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

Replace native selects in: Dashboard (sort), Topics (sort, status), SeoPages (status, type), MetadataSidebar (status, category), TopicDetail (status), SeoPageEditor (status, page type).

- [ ] **Step 4: Replace `<label>` with shadcn `<Label>`**

Replace in MetadataSidebar, Settings, Login, SeoPageEditor, TopicDetail.

Import: `import { Label } from "@/components/ui/label"`

- [ ] **Step 5: Verify and commit**

Run: `npm run build`

```bash
git add -A && git commit -m "feat: replace form controls with shadcn Input, Textarea, Select, Label"
```

---

### Task 5: Badge + Card + Dialog Swap

**Files:**
- Modify: `src/components/StatusBadge.jsx` — use shadcn Badge
- Modify: `src/components/PostCard.jsx` — wrap in Card
- Modify: `src/components/TopicCard.jsx` — wrap in Card
- Modify: `src/components/SeoPageCard.jsx` — wrap in Card
- Modify: `src/pages/Dashboard.jsx` — StatCard with Card
- Modify: `src/pages/PostEditor.jsx` — delete confirm with Dialog
- Modify: `src/pages/SeoPageEditor.jsx` — delete confirm with Dialog
- Modify: `src/components/PexelsSearch.jsx` — wrap in Dialog

- [ ] **Step 1: StatusBadge — use shadcn Badge**

Replace the hand-rolled `<span>` with shadcn `<Badge variant="outline">` or `<Badge variant="secondary">` and keep the color mapping via `cn()` for status-specific colors.

- [ ] **Step 2: PostCard, TopicCard, SeoPageCard — Card wrapper**

Wrap the outer div with `<Card>` and use `<CardContent>` for the inner padding. Keep existing hover transitions.

- [ ] **Step 3: Dashboard StatCard — Card component**

Replace the stat card div with `<Card>` + `<CardContent>`.

- [ ] **Step 4: PostEditor delete confirm — Dialog**

Replace the absolute-positioned dropdown with:
```jsx
<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <DialogTrigger asChild>
    <Button variant="ghost" size="icon">
      <Trash2 className="w-4 h-4" />
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this post?</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 5: SeoPageEditor delete confirm — Dialog**

Same pattern as PostEditor.

- [ ] **Step 6: PexelsSearch — wrap in Dialog**

The PexelsSearch component currently renders as a full-screen overlay. Wrap its content in `<DialogContent>` with proper header/close button. The parent (MetadataSidebar and ContentRenderer) already manage open/close state — wire those into `<Dialog open={open} onOpenChange={onClose}>`.

- [ ] **Step 7: Verify and commit**

Run: `npm run build`

```bash
git add -A && git commit -m "feat: replace badges, cards, and modals with shadcn components"
```

---

### Task 6: Final Polish + Verify

**Files:**
- All files — final review pass

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no warnings about missing imports.

- [ ] **Step 2: Start dev server and manually test**

Run: `npm run dev`

Test checklist:
- Login page renders, sign in works
- Dashboard loads, stat cards display, search/filter work
- Click into a post, save → toast appears
- Delete post → dialog opens, confirm → toast + navigate
- Sidebar metadata fields work (inputs, selects, textarea)
- Pexels search opens in dialog, select image → toast
- Topics page: filter/sort work, approve/discard buttons work
- Topic detail: save → toast
- SEO pages: filter/sort, click into editor, save → toast
- Approval queue: batch approve → toast
- Calendar: navigation works
- Settings: save → toast, reset → toast

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix: polish shadcn migration — fix any remaining issues"
```

- [ ] **Step 4: Push to deploy**

```bash
git push origin main
```
