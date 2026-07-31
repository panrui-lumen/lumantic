---
name: one-dropdown
description: >-
  Use the single shared Select dropdown component with a right-aligned caret.
  Use when adding or editing select/dropdown UI, filters, forms, settings
  preferences, billing expiry, admin filters, or any native <select> in the
  Lumantic React app.
---

# Create ONE dropdown component and reuse everywhere

## Rule

**Create ONE dropdown component and reuse everywhere this is important.**

Dropdown carets must sit on the **right edge** of the control, not next to the
label text. Never ship a bare `<select>` with the browser caret, and never
place a chevron with only `inline` layout so it hugs the text.

## Use this

Import and use `Select` from `src/react-app/components/Select.tsx`:

```tsx
import { Select } from "../../components/Select";

<Select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  wrapperClassName="min-w-[10rem]"
  aria-label="Status"
>
  <option value="" className="bg-ink">All statuses</option>
  ...
</Select>
```

## Requirements

1. Always `appearance-none` (built into `Select`).
2. Always enough right padding so text never overlaps the caret.
3. Always an absolutely positioned chevron on the **right** of the wrapper.
4. Always `cursor-pointer` on interactive selects.
5. Prefer `wrapperClassName` for width (`w-full`, `min-w-[10rem]`); use
   `className` only for the native control if needed.
6. Use `size="sm"` for dense rows (team role chips, compact filters).

## Do not

- Duplicate `<select>` + `ChevronDown` wrappers in page files
- Use native select styling without `appearance-none`
- Put the caret beside the text (`flex` with icon after label only)
- Reintroduce `selectClass` for new UI; migrate call sites to `Select`

## When editing existing UI

If you touch a hand-rolled select, convert it to `Select` in the same change.
