---
name: tabs-on-left
description: >-
  Keep in-app page tabs left-aligned under the page header. Use when adding or
  editing tab bars, segmented controls, settings tabs, Memories-style tabs, or
  any page-level tab navigation in the Lumantic /app UI.
---

# Tabs should appear always on the left

## Rule

**Tabs should appear always on the left.**

Page-level tabs sit under the title/description, left-aligned in the header
block. Do not place them on the right, centered, or opposite the title via
`justify-between`.

## Pattern

Match Memories (`MemoriesPage`):

1. Title + short description in the header.
2. Below that (`mt-4`), a left-aligned tab strip.
3. Use a compact segmented control: bordered tray, `p-1`, equal columns,
   `rounded-lg` active state (`bg-violet-500/20`).
4. Extra header controls (search, sort, primary actions) go beside or after
   the tabs in the same left-starting row, not in place of left alignment.

```tsx
<div className="border-b border-violet-500/10 px-6 py-5">
  <div>
    <h1>...</h1>
    <p className="mt-1 text-sm text-violet-300/60">...</p>
  </div>
  <div className="mt-4 flex flex-wrap items-center gap-3">
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-violet-500/15 bg-white/[0.02] p-1 text-xs font-medium">
      {/* tab buttons */}
    </div>
    {/* optional filters / actions */}
  </div>
</div>
```

## Avoid

- Tabs floated to the top-right of the header
- Centering the tab strip
- Vertical sidebar tabs unless the product already uses that pattern for that
  screen
