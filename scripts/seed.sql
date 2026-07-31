-- Seeds realistic demo data into the workspace tables (team, billing,
-- support) that back the Team / Billing / Support pages in /app. This is
-- intentionally separate from schema migrations so the demo data can be
-- reset independently of the schema.
--
-- Safe to re-run: it clears these tables first, then re-inserts the same
-- fixtures. Run locally with `npm run db:seed`, or against the deployed
-- database with `npm run db:seed:remote`.

DELETE FROM team_members;
INSERT INTO team_members (name, email, role, status, is_you, last_active_at, created_at) VALUES
	('Avery Chen', 'avery@beacon.com', 'Owner', 'active', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-190 days')),
	('Priya Nair', 'priya@beacon.com', 'Admin', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-160 days')),
	('Sam Rivera', 'sam@beacon.com', 'Member', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')),
	('Jordan Lee', 'jordan@beacon.com', 'Member', 'invited', 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'));

UPDATE billing_plan
SET plan_id = 'scale', renews_at = '2026-08-30', card_brand = 'Visa', card_last4 = '4242', card_exp = '08/28', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 1;

DELETE FROM billing_invoices;
INSERT INTO billing_invoices (invoice_date, description, amount_cents, status) VALUES
	('2026-07-01', 'Scale plan - monthly', 49900, 'Paid'),
	('2026-06-01', 'Scale plan - monthly', 49900, 'Paid'),
	('2026-05-01', 'Scale plan - monthly', 49900, 'Paid'),
	('2026-04-01', 'Starter to Scale proration', 21240, 'Paid'),
	('2026-03-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2026-02-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2026-01-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2025-12-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2025-11-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2025-10-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2025-09-01', 'Starter plan - monthly', 9900, 'Paid'),
	('2025-08-01', 'Starter plan - monthly', 9900, 'Paid');

UPDATE usage_counters SET slack_posts = 86, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 1;

DELETE FROM support_tickets;
INSERT INTO support_tickets (id, subject, message, status, created_at) VALUES
	(1021, 'How do I change my workspace name?', 'Is there a way to rename our Lumantic workspace from the settings page?', 'Resolved', '2026-07-12T09:00:00.000Z'),
	(1038, 'Can we get a second Slack channel for alerts?', 'We would like proposed memories to post separately from the daily digest.', 'Open', '2026-07-24T09:00:00.000Z'),
	(1042, 'Slack digest posted twice on Monday', 'We received the daily digest message twice in #data-team on Monday morning.', 'Open', '2026-07-28T09:00:00.000Z');

UPDATE user_profile SET company = 'Beacon', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 1;

-- Refresh confirmed memories so chat grounding matches Beacon product language.
DELETE FROM memories;
INSERT INTO memories (content, category, source, added_by, created_at, updated_at) VALUES
	('Beacon new-signup volume dropped ~58% starting March 3, 2026 after the checkout redesign broke Google OAuth for first-time workspaces (oauth_callback 500). Fix shipped March 18 in Beacon web 1.48.2.', 'insight', 'ai', 'Lumantic', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 days')),
	('A Beacon session ends after 30 minutes of idle with no client events. Heartbeat pings alone do not keep a session alive.', 'definition', 'manual', 'Avery Chen', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-40 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-40 days')),
	('Beacon client crashes are unhandled JS exceptions from the web SDK. /dashboard/signals throws when feature_key is null on sandbox orgs — a known gotcha.', 'gotcha', 'ai', 'Lumantic', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-18 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-18 days')),
	('Beacon Score always excludes orgs tagged env = sandbox and the internal beacon-dogfood workspace — those can inflate Score by ~3–5% if left in.', 'gotcha', 'ai', 'Priya Nair', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-25 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-25 days')),
	('A Beacon signal is any client event with event_type = signal that includes a non-null feature_key. Page views and heartbeats are not signals.', 'definition', 'ai', 'Lumantic', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-8 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-8 days')),
	('Beacon Active Workspaces (BAW) are workspaces with at least one Beacon signal in the trailing 30 days; sandbox and internal-demo orgs are excluded. Trials with signals are included in product dashboards.', 'business-rule', 'ai', 'Sam Rivera', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 days')),
	('Trial workspaces used to count toward Beacon Active Workspaces if they sent any signal. That rule was retired in late 2025; trials are still included only when they remain on a paid plan.', 'business-rule', 'manual', 'Priya Nair', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-120 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-120 days')),
	('Checkout success is counted when payment_intent.status becomes succeeded and workspace.plan is set within 15 minutes. Abandoned carts after 3DS are not successes.', 'definition', 'ai', 'Lumantic', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
	('Enterprise seats are billed on the 1st UTC of each month for active seats on day 1. Mid-month invites do not prorate until the next cycle.', 'business-rule', 'manual', 'Avery Chen', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-15 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-15 days')),
	('Mobile native uses the same 30-minute idle session rule as web, but backgrounded apps without a foreground signal still end the session.', 'definition', 'ai', 'Jordan Lee', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-9 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-9 days')),
	('Do not join warehouse.events to CRM contacts on email alone; prefer user_id. Email collisions across sandbox and paid orgs are common.', 'gotcha', 'ai', 'Lumantic', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-22 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-22 days')),
	('NPS surveys are suppressed for workspaces younger than 14 days and for any workspace with an open P1 support ticket.', 'business-rule', 'manual', 'Sam Rivera', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-11 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-11 days'));

DELETE FROM proposed_memories;
INSERT INTO proposed_memories (content, category, source, confidence) VALUES
	('Longest-session rankings should exclude Beacon internal dogfood accounts (email domain @beacon.com) — they skew the top 10.', 'gotcha', 'ai', 0.88),
	('Signup recovery after the March OAuth fix should be measured from March 19 onward; March 18 still includes partial outage hours.', 'business-rule', 'ai', 0.9),
	('Crash reports on /settings/billing spike when the invoice PDF iframe is blocked by corporate CSP — correlate with enterprise SSO workspaces.', 'insight', 'ai', 0.76),
	('Feature flag evaluate events should not count as Beacon signals unless feature_key is present; bare flag boots are noise.', 'definition', 'ai', 0.84),
	('Churn risk score should ignore seats paused for vacation mode; those seats return within 30 days ~70% of the time.', 'insight', 'ai', 0.71),
	('Warehouse query timeouts over 30s on marts.beacon_score usually mean the sandbox exclusion CTE was removed in a recent dbt PR.', 'gotcha', 'ai', 0.82),
	('Support macros that mention "Beacon Score" should link to the Score definition memory so agents do not invent sandbox inclusion rules.', 'business-rule', 'ai', 0.79),
	('Session length percentiles for exec decks should use continuous sessions only; stitching across the 30-minute idle cut inflates P95.', 'gotcha', 'ai', 0.87);

-- Global chats: see scripts/seed-global-chats.sql (generated from src/shared/demo-global-chats.ts)

-- Personal chats: enough rows for sidebar pagination, plus one long thread for reverse message loading.
DELETE FROM chat_messages WHERE conversation_id BETWEEN 9100 AND 9140;
DELETE FROM conversations WHERE id BETWEEN 9100 AND 9140;

INSERT INTO conversations (id, title, scope, author_name, created_at, updated_at, last_read_at)
WITH RECURSIVE seq(n) AS (
	SELECT 0
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 24
)
SELECT
	9100 + n,
	CASE WHEN n = 0 THEN 'Beacon metrics deep dive' ELSE printf('Personal chat %02d', n) END,
	'personal',
	NULL,
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d hours', n + 1)),
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d hours', n + 1)),
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d hours', n + 1))
FROM seq;

INSERT INTO chat_messages (conversation_id, role, content, created_at)
WITH RECURSIVE seq(n) AS (
	SELECT 1
	UNION ALL
	SELECT n + 1 FROM seq WHERE n < 55
)
SELECT
	9100,
	CASE WHEN n % 2 = 1 THEN 'user' ELSE 'assistant' END,
	printf('Turn %d about Beacon metrics and workspace health.', n),
	strftime('%Y-%m-%dT%H:%M:%fZ', 'now', printf('-%d minutes', (56 - n) * 3))
FROM seq;
