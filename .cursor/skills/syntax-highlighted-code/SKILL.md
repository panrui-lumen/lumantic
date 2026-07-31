---
name: syntax-highlighted-code
description: >-
  Require syntax highlighting for all code shown in the app. Use when adding or
  editing UI that displays source code, SQL, diffs, snippets, artifacts, chat
  message code blocks, PR previews, settings samples, or any monospace code
  panel; also when the user mentions highlighting, colored tokens, hljs,
  CodeHighlight, or plain monochrome code.
---

# All code shown on app need to be syntax highlighted/colored etc

## Rule

**All code shown on the app must be syntax highlighted / colored.**

Never render source as plain monochrome `<pre><code>{text}</code></pre>` (or
equivalent) when users can see it in product UI. Keywords, strings, comments,
types, and other tokens must be visually distinct.

## Applies to

- Chat message fenced code blocks
- Chat artifacts (code fix / PR cards, SQL panels, diffs)
- Reply details / working SQL
- Settings, docs, demo, and marketing surfaces inside the product that show code
- Any new code preview, snippet, or monospace dump

## How

1. Use the shared `CodeHighlight` component (`src/react-app/pages/app/CodeHighlight.tsx`).
2. Pass a real `language` when known (`typescript` / `ts` / `tsx`, `sql`, `json`,
   `bash`, `diff`, etc.). Prefer highlight-auto only as a fallback.
3. When nesting inside an existing card (e.g. PR / artifact chrome), use
   `embedded` so you do not double the outer border.
4. Do not invent a second highlighter or hardcode token colors in the call site.
5. When adding a new code surface, wire `CodeHighlight` in the same change; do
   not ship uncolored code as a follow-up.

## Examples

```tsx
// Good: message / standalone snippet
<CodeHighlight code={sql} language="sql" filename="warehouse.sql" />

// Good: nested in an artifact card
<CodeHighlight code={artifact.snippet} language={artifact.language} embedded />

// Bad: monochrome dump users can see
<pre><code>{artifact.snippet}</code></pre>
```
