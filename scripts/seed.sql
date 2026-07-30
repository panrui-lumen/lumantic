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
	('2026-07-01', 'Scale plan — monthly', 49900, 'Paid'),
	('2026-06-01', 'Scale plan — monthly', 49900, 'Paid'),
	('2026-05-01', 'Scale plan — monthly', 49900, 'Paid'),
	('2026-04-01', 'Starter → Scale proration', 21240, 'Paid');

UPDATE usage_counters SET slack_posts = 86, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 1;

DELETE FROM support_tickets;
INSERT INTO support_tickets (id, subject, message, status, created_at) VALUES
	(1021, 'How do I change my workspace name?', 'Is there a way to rename our Lumantic workspace from the settings page?', 'Resolved', '2026-07-12T09:00:00.000Z'),
	(1038, 'Can we get a second Slack channel for alerts?', 'We would like proposed memories to post separately from the daily digest.', 'Open', '2026-07-24T09:00:00.000Z'),
	(1042, 'Slack digest posted twice on Monday', 'We received the daily digest message twice in #data-team on Monday morning.', 'Open', '2026-07-28T09:00:00.000Z');

UPDATE user_profile SET company = 'Beacon', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 1;

-- Refresh confirmed memories so chat grounding matches Beacon product language.
DELETE FROM memories;
INSERT INTO memories (content, category, source) VALUES
	('Beacon new-signup volume dropped ~58% starting March 3, 2026 after the checkout redesign broke Google OAuth for first-time workspaces (oauth_callback 500). Fix shipped March 18 in Beacon web 1.48.2.', 'insight', 'ai'),
	('A Beacon session ends after 30 minutes of idle with no client events. Heartbeat pings alone do not keep a session alive.', 'definition', 'manual'),
	('Beacon client crashes are unhandled JS exceptions from the web SDK. /dashboard/signals throws when feature_key is null on sandbox orgs — a known gotcha.', 'gotcha', 'ai'),
	('Beacon Score always excludes orgs tagged env = sandbox and the internal beacon-dogfood workspace — those can inflate Score by ~3–5% if left in.', 'gotcha', 'ai'),
	('A Beacon signal is any client event with event_type = signal that includes a non-null feature_key. Page views and heartbeats are not signals.', 'definition', 'ai'),
	('Beacon Active Workspaces (BAW) are workspaces with at least one Beacon signal in the trailing 30 days; sandbox and internal-demo orgs are excluded. Trials with signals are included in product dashboards.', 'business-rule', 'ai');

DELETE FROM proposed_memories;
INSERT INTO proposed_memories (content, category, source, confidence) VALUES
	('Longest-session rankings should exclude Beacon internal dogfood accounts (email domain @beacon.com) — they skew the top 10.', 'gotcha', 'ai', 0.88),
	('Signup recovery after the March OAuth fix should be measured from March 19 onward; March 18 still includes partial outage hours.', 'business-rule', 'ai', 0.9),
	('Crash reports on /settings/billing spike when the invoice PDF iframe is blocked by corporate CSP — correlate with enterprise SSO workspaces.', 'insight', 'ai', 0.76);

-- Global chat titles (UI fixtures live in ChatPage; seed keeps the shared feed in sync).
DELETE FROM chat_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE scope = 'global');
DELETE FROM conversations WHERE scope = 'global';

INSERT INTO conversations (id, title, scope, author_name, created_at, updated_at) VALUES
	(9001, 'Why did signups drop off in March?', 'global', 'Priya Nair', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
	(9002, 'Top 10 users with the longest sessions', 'global', 'Sam Rivera', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days')),
	(9003, 'Which users experienced crashes?', 'global', 'Jordan Lee', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
	(9004, 'Does the Beacon Score include sandbox orgs?', 'global', 'Priya Nair', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
	(9005, 'What''s a Beacon session timeout?', 'global', 'Sam Rivera', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days'));

INSERT INTO chat_messages (conversation_id, role, content, created_at) VALUES
	(9001, 'user', 'Why did signups drop off in March?', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
	(9001, 'assistant', 'Beacon new signups dropped ~58% starting March 3, then recovered after March 18 (checkout OAuth regression).', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
	(9002, 'user', 'Give me top 10 users with the longest sessions', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days')),
	(9002, 'assistant', 'Top 10 Beacon users by continuous session length in the last 7 days (30-minute idle timeout).', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 days')),
	(9003, 'user', 'Which users experienced crashes, and what page were they on?', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
	(9003, 'assistant', 'Ten most recent Beacon client crashes with the page each user was on.', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 days')),
	(9004, 'user', 'Our Beacon Score jumped overnight — are sandbox orgs in that number?', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
	(9004, 'assistant', 'No — Beacon Score excludes env = sandbox and beacon-dogfood.', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
	(9005, 'user', 'How long until a Beacon session ends from idle?', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days')),
	(9005, 'assistant', 'A Beacon session ends after 30 minutes of idle; heartbeats alone do not keep it alive.', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 days'));
