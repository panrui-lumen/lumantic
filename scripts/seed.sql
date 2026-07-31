-- Seeds realistic demo data into the workspace tables (team, billing,
-- support) that back the Team / Billing / Support pages in /app, plus the
-- multi-workspace catalog used by /admin. This is intentionally separate
-- from schema migrations so the demo data can be reset independently of
-- the schema.
--
-- Safe to re-run: it clears these tables first, then re-inserts the same
-- fixtures. Run locally with `npm run db:seed`, or against the deployed
-- database with `npm run db:seed:remote`.

DELETE FROM team_members;
DELETE FROM workspaces;

INSERT INTO workspaces (
	id, name, slug, plan_id, billing_status, overdue_since, renews_at,
	seat_limit, mrr_cents, primary_contact_email, notes, is_live, created_at, updated_at
) VALUES
	(1, 'Beacon', 'beacon', 'scale', 'active', NULL, '2026-08-30', 10, 49900, 'avery@beacon.com', 'Live demo workspace that powers /app.', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-190 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	(2, 'Northstar Analytics', 'northstar', 'enterprise', 'active', NULL, '2026-09-12', 50, 240000, 'maya@northstar.io', 'Enterprise analytics customer.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-420 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
	(3, 'Copperleaf Labs', 'copperleaf', 'starter', 'trial', NULL, '2026-08-08', 3, 0, 'theo@copperleaf.lab', 'Product trial, converting to Starter.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days')),
	(4, 'Rivermark Health', 'rivermark', 'scale', 'overdue', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-18 days'), '2026-07-01', 10, 49900, 'finance@rivermark.health', 'Payment failed on July renew. Follow up with finance.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-280 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-18 days')),
	(5, 'Quill & Co', 'quill', 'starter', 'active', NULL, '2026-08-21', 5, 9900, 'ops@quill.co', 'Small content team.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 days')),
	(6, 'Orbit Freight', 'orbit-freight', 'enterprise', 'overdue', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-41 days'), '2026-06-15', 100, 0, 'billing@orbitfreight.com', 'Custom enterprise invoice overdue. Escalate to AE.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-510 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-41 days')),
	(7, 'Lumen Retail', 'lumen-retail', 'scale', 'active', NULL, '2026-08-05', 15, 49900, 'data@lumenretail.com', 'Retail analytics rollout.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-150 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
	(8, 'Harbor Books', 'harbor-books', 'starter', 'canceled', NULL, NULL, 3, 0, 'hello@harborbooks.com', 'Canceled after trial; keep for win-back.', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-200 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-60 days'));

INSERT INTO team_members (workspace_id, name, email, role, status, is_you, last_active_at, created_at) VALUES
	(1, 'Avery Chen', 'avery@beacon.com', 'Owner', 'active', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-190 days')),
	(1, 'Priya Nair', 'priya@beacon.com', 'Admin', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-160 days')),
	(1, 'Sam Rivera', 'sam@beacon.com', 'Member', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')),
	(1, 'Jordan Lee', 'jordan@beacon.com', 'Member', 'invited', 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
	(1, 'Casey Morgan', 'casey@beacon.com', 'Member', 'disabled', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-80 days')),
	(2, 'Maya Okonkwo', 'maya@northstar.io', 'Owner', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-400 days')),
	(2, 'Chris Lang', 'chris@northstar.io', 'Admin', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-300 days')),
	(2, 'Elena Park', 'elena@northstar.io', 'Member', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-120 days')),
	(2, 'Noah Berg', 'noah@northstar.io', 'Member', 'invited', 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
	(3, 'Theo Marquez', 'theo@copperleaf.lab', 'Owner', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 days')),
	(3, 'Ivy Chen', 'ivy@copperleaf.lab', 'Member', 'invited', 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 days')),
	(4, 'Dana Whitfield', 'dana@rivermark.health', 'Owner', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-250 days')),
	(4, 'Omar Hassan', 'omar@rivermark.health', 'Admin', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-8 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-200 days')),
	(4, 'Finance Desk', 'finance@rivermark.health', 'Member', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-18 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-180 days')),
	(5, 'Riley Quinn', 'ops@quill.co', 'Owner', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')),
	(5, 'Pat Soto', 'pat@quill.co', 'Member', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-70 days')),
	(6, 'Sasha Voss', 'sasha@orbitfreight.com', 'Owner', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-12 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-500 days')),
	(6, 'Kenji Mori', 'kenji@orbitfreight.com', 'Admin', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-400 days')),
	(6, 'Billing', 'billing@orbitfreight.com', 'Member', 'disabled', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-41 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-350 days')),
	(7, 'Ada Moreau', 'data@lumenretail.com', 'Owner', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-140 days')),
	(7, 'Ben Ortiz', 'ben@lumenretail.com', 'Member', 'active', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-100 days')),
	(7, 'Cara Ng', 'cara@lumenretail.com', 'Member', 'invited', 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days')),
	(8, 'Jules Hart', 'hello@harborbooks.com', 'Owner', 'disabled', 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-60 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-190 days'));

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
INSERT INTO support_tickets (id, subject, message, status, created_at, owner_employee_id) VALUES
	(1021, 'How do I change my workspace name?', 'Is there a way to rename our Lumantic workspace from the settings page?', 'Resolved', '2026-07-12T09:00:00.000Z', (SELECT id FROM admin_employees WHERE name = 'Panrui')),
	(1038, 'Can we get a second Slack channel for alerts?', 'We would like proposed memories to post separately from the daily digest.', 'Open', '2026-07-24T09:00:00.000Z', (SELECT id FROM admin_employees WHERE name = 'Alex')),
	(1042, 'Slack digest posted twice on Monday', 'We received the daily digest message twice in #data-team on Monday morning.', 'Open', '2026-07-28T09:00:00.000Z', NULL),
	(1055, 'Rivermark invoice payment failed', 'Card on file declined for Rivermark Health Scale renew. Need a new payment link.', 'Open', '2026-07-14T15:20:00.000Z', (SELECT id FROM admin_employees WHERE name = 'Sharuk')),
	(1061, 'Orbit Freight custom SSO setup', 'Enterprise customer wants Okta SSO before they will clear overdue invoices.', 'Open', '2026-07-20T11:05:00.000Z', (SELECT id FROM admin_employees WHERE name = 'Sé'));

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
