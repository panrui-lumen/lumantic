---
name: screenshot-new-features
description: >-
  Require inline screenshots in chat of every new or changed feature, in its
  different states, before calling the work done. Also stress-test the same
  flow in German (de) for longer-copy layout issues. Use when finishing a new
  UI feature, component, page, or flow, or after any user-facing change the
  user can see in the running app.
---

# Show inline screenshots of new features

## Rule

**Never call a new feature or UI change done without posting inline
screenshots of it in the chat.** Saving screenshots under `/tmp` alone is not
enough; each screenshot must be read with the `Read` tool so it renders
inline in the chat response for the user to review, without them needing to
open a file path.

This applies the first time a feature ships, not only during later
regression checks: the user should see the feature, not just a text
description of it.

Also **stress-test the changed flow in German (`de`)**. Longer translated
copy can break layouts; do not ship UI that only looks fine in English.

## What to capture

For the surface just built or changed, capture whichever states apply:

- Default / resting
- Empty
- Loading / shimmer
- Filled / success
- Error / validation
- Open modal, menu, dropdown, or expanded panel
- Desktop (~1280–1440×900) and mobile (iPhone 13 emulation)
- German (`de`) at least once per changed surface (especially mobile)

## How

Follow the `playwright-visual-check` and `verify-desktop-mobile` skills to
drive the flow and capture screenshots, then:

1. Write PNGs under `/tmp/...` (never commit screenshots to the repo).
2. Capture **English (US)** first for the primary review set.
3. Switch the account language to **Deutsch (`de`)** via Account settings →
   Language (`uiLocale`), re-run the affected flow (mobile especially), and
   look for truncation, overflow, wrapping that breaks buttons/nav, and
   clipped labels. Save those captures with a `-de` suffix
   (e.g. `feature-mobile-de.png`).
4. Read every screenshot so it renders inline, labeled with state, locale,
   and viewport, e.g. "Desktop, en-US, filled" / "Mobile, de, empty".
5. Embed images directly in the final chat reply
   (`![desktop](/tmp/lumantic-e2e/feature-desktop.png)`); do not just link
   the path or describe the UI in prose instead.
6. Restore language to **English (US)** (`en-US`) when done so later checks
   stay predictable.
7. If the Playwright MCP or dev server is unavailable, say so explicitly
   rather than describing the UI without a screenshot.

Supported locales live in `src/shared/locale.ts` (`en-US`, `en-GB`, `de`,
`es`, `fr`). German is the required stress locale because it tends to produce
the longest chrome strings; spot-check `es` / `fr` only when the change is
copy-heavy or you already saw wrapping issues.

## Example

Good final message:

"Here's the new settings toggle (en-US + de):

![desktop en](/tmp/lumantic-e2e/settings-toggle-desktop.png)
![mobile en](/tmp/lumantic-e2e/settings-toggle-mobile.png)
![mobile de](/tmp/lumantic-e2e/settings-toggle-mobile-de.png)"

Bad: describing the new toggle only in prose, linking a screenshot path
without embedding it, or verifying English only.
