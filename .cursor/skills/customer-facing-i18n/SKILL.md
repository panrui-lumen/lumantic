---
name: customer-facing-i18n
description: >-
  Verify and add i18n for customer-facing /app UI strings via useT / useTranslation.
  Use when editing React pages under src/react-app/pages/app, adding product copy,
  labels, placeholders, empty states, toasts, or buttons; also when the user
  mentions i18n, translation, locale, or useTranslation. Ignore AdminPage.
---

# Customer-facing strings must be translated

## Rule

**When you change customer-facing UI, every user-visible string must go through
i18n (`useT` / `useTranslation`). Do not ship hardcoded English in `/app`.**

Ignore `AdminPage` and other internal admin surfaces. Those stay English-only.

## Scope

### Must translate

- `src/react-app/pages/app/**` (product UI after login)
- Shared app chrome used only by `/app` (nav labels, banners, modals shown to customers)
- New keys in **every** locale in `src/shared/i18n/resources.ts`
  (`en-US`, `en-GB`, `de`, `es`, `fr`)

### Do not translate (unless the user asks)

- `src/react-app/pages/AdminPage.tsx` and admin-only APIs/copy
- Marketing / landing pages (stay English per product convention)
- Public `/status` unless it is wired into the app i18n system later
- Developer-only strings, log messages, code comments
- Raw customer/user-generated content (ticket bodies from the API, chat messages, memory text)

## How

1. Import `useT` from `./i18n` (preferred; wraps `useTranslation`).
2. Call `const t = useT()` in the component.
3. Replace hardcoded copy with `t("namespace.key")`.
4. Add the key under the right namespace in **all five** locales in
   `src/shared/i18n/resources.ts`. Keep the object shape identical across locales.
5. Prefer existing namespaces (`nav`, `common`, `support`, `billing`, `settings`,
   `chat`, `memories`, `team`, `account`) before inventing new ones.
6. Use interpolation for dynamic bits: `t("nav.unreadChats", { count })`.
7. No em dashes in copy (see no-em-dash skill).

## Checklist before finishing a customer-facing UI change

- [ ] No new user-visible English literals in touched `/app` TSX (titles, buttons,
      labels, placeholders, helper text, empty states, aria-labels meant for users)
- [ ] Every new key exists in `en-US`, `en-GB`, `de`, `es`, and `fr`
- [ ] Admin-only files were left alone
- [ ] `npx tsc --noEmit` still passes (resource shapes must match)

## Examples

```tsx
// Bad
<PageHeader title="Support" description="Get help from the Lumantic team." />

// Good
const t = useT();
<PageHeader title={t("support.title")} description={t("support.description")} />
```

```ts
// resources.ts: add the same keys to every locale
support: {
  title: "Support",
  description: "Get help from the Lumantic team.",
  // ...
}
```

## When editing existing pages

If you touch a page that still has hardcoded customer-facing strings in the
same section you are changing, translate that section in the same change.
Do not expand into a full-app i18n rewrite unless asked.
