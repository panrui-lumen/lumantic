# Lumantic

Landing page for **Lumantic**: an AI-native data team for growth-stage companies. Built with React, Vite, Hono, Tailwind CSS, and Cloudflare Workers + D1.

## What's here

- **Landing page** (`/`): explains the product, with a "Register interest" CTA that opens a modal, collects an email, and saves it to a D1 database.
- **Admin dashboard** (`/admin`): password-gated view of registrations, paginated, sortable (newest/oldest), searchable by email, with a one-click mailto action per row.
- **Product app** (`/app`): the Lumantic product itself, gated behind a demo login (email `test@example.com`, password checked server-side). Includes chat with Lumantic, a Memories library (add/edit/delete), a Proposed Memories review queue (approve/edit/deny), and Settings for connecting Slack, picking a channel, and configuring what Lumantic posts. The Slack connection and chat replies are simulated for demo purposes.
- **Product glossary** (`docs/glossary.md`): canonical product terms (say Lumantic, not "the AI").
- **Worker API** (`src/worker/index.ts`, `src/worker/app-api.ts`): Hono routes for registering interest, serving the admin dashboard data, and powering the `/app` product experience.

## Stack

- [**React**](https://react.dev/) + [**Vite**](https://vite.dev/) for the frontend
- [**Tailwind CSS v4**](https://tailwindcss.com/) for styling
- [**Hono**](https://hono.dev/) for the API layer
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) for hosting
- [**Cloudflare D1**](https://developers.cloudflare.com/d1/) for storing registrations

## Development

Install dependencies:

```bash
npm install
```

Set your local admin password in `.dev.vars` (already gitignored, copy from `.dev.vars.example` if it doesn't exist):

```
ADMIN_PASSWORD=change-me
LUMANTIC_SLACK_BOT_TOKEN=xoxb-change-me
```

`LUMANTIC_SLACK_BOT_TOKEN` is a Slack bot token (needs the `chat:write` scope) used to post a message to the internal `#waitlist` channel whenever someone registers interest. Leave it blank locally to skip the notification.

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173), and the admin dashboard at [http://localhost:5173/admin](http://localhost:5173/admin).

### Database

Registrations are stored in a D1 database (`lumantic-db`) with the schema defined in `migrations/`. To (re)apply migrations locally:

```bash
npx wrangler d1 migrations apply lumantic-db --local
```

To inspect local data directly:

```bash
npx wrangler d1 execute lumantic-db --local --command "SELECT * FROM registrations"
```

## Production

Apply migrations to the remote database (only needed once, or after adding new migration files):

```bash
npx wrangler d1 migrations apply lumantic-db --remote
```

Set the production admin password and Slack bot token as secrets (do this once):

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put LUMANTIC_SLACK_BOT_TOKEN
```

Build and deploy:

```bash
npm run build && npm run deploy
```

Monitor the worker:

```bash
npx wrangler tail
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
