---
name: clickable-cursor
description: >-
  Require a pointer cursor on anything clickable. Use when writing or editing
  UI (React/TSX, CSS, Tailwind), adding buttons, links, toggles, rows, chips,
  icons, or any onClick / role="button" / interactive control; also when the
  user mentions cursor, hover, clickable affordance, or pointer styles.
---

# Clickable elements need a pointer cursor

## Rule

**Anything clickable must have cursor hover.**

If a user can click, activate, or select it, the pointer must become a hand
(`cursor-pointer`) on hover. Do not leave clickable surfaces on the default
arrow.

## Applies to

- `<button>`, `<a>`, and submit controls
- Elements with `onClick` / `onKeyDown` activation
- `role="button"`, `role="link"`, `role="menuitem"`, tabs, toggles, chips
- Clickable list rows, cards, icons, and custom hit targets
- Disabled-looking controls that are still interactive (unless truly disabled)

## Does not apply

- Truly disabled controls (`disabled`, `aria-disabled="true"`): use
  `cursor-not-allowed` or keep default, not pointer
- Static text, layout wrappers, and non-interactive chrome
- Text inputs / textareas (keep text caret cursor)

## How

1. Prefer Tailwind `cursor-pointer` on the interactive element itself.
2. For composite rows, put `cursor-pointer` on the clickable root (the same
   node that handles click / keyboard activation).
3. Native `<button>` and `<a>` still need an explicit pointer class in this
   codebase; do not assume the UA default is enough.
4. When adding or editing UI, scan new interactive nodes and add
   `cursor-pointer` before finishing.

## Examples

```tsx
// Good
<button type="button" className="cursor-pointer ..." onClick={...}>Save</button>

<div
  role="button"
  tabIndex={0}
  className="cursor-pointer ..."
  onClick={...}
  onKeyDown={...}
>
  ...
</div>

// Bad: clickable but arrow cursor
<div role="button" tabIndex={0} onClick={...}>...</div>
```
