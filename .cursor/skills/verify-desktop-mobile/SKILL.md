---
name: verify-desktop-mobile
description: >-
  Require desktop + mobile verification after every app change. Use after any
  code change to UI, auth, API wiring, routing, forms, or interactive flows —
  not only visual/CSS work. Also use when the user says to verify, test, check
  responsive behavior, or mentions something "doesn't work" in the running app.
---

# Verify every change on desktop and mobile

## Rule

**Need to verify each change on desktop/mobile.**

Do not claim a change is done until it has been exercised on both:

- **Desktop** — viewport ~1280×900 (or 1440×900)
- **Mobile** — iPhone 13 device emulation (touch + UA)

This applies to auth, API, and logic changes as much as layout/CSS. A login
credential update that only works on one stale local port still counts as broken.

## How

1. Confirm the **same** origin the user is using is healthy (curl the login/API
   on that port; restart a stale vite/miniflare process if D1 returns 500s).
2. Follow the **playwright-visual-check** skill:
   - Drive the changed flow end-to-end (not just a static screenshot).
   - For `/app` auth: fill email + password and assert the post-login UI appears.
   - Capture desktop + mobile screenshots of the changed surface.
   - Read the screenshots; check console errors and horizontal overflow.
3. Delete one-off verify scripts and `/tmp/visual-check` artifacts when finished.

## Auth / login regressions

When changing demo credentials or auth:

- Hit `POST /api/app/login` with the exact email/password before UI testing.
- If the API returns 500 after a correct password, treat it as a broken D1 /
  stale worker issue: apply local migrations, restart vite, harden profile
  reads so login never depends on a flaky D1 call succeeding.
- Then verify the full sign-in flow in the browser on desktop and mobile.
