/** Shared Beacon product-analytics demo fixtures for chat replies. */

export type SignupsChartArtifact = {
	type: "signups_chart";
	title: string;
	unit: string;
	points: { label: string; value: number }[];
};

export type SessionsTableArtifact = {
	type: "sessions_table";
	title: string;
	rows: { name: string; email: string; minutes: number }[];
};

export type CrashesTableArtifact = {
	type: "crashes_table";
	title: string;
	rows: { name: string; email: string; page: string; when: string }[];
};

export type PieChartArtifact = {
	type: "pie_chart";
	title: string;
	unit?: string;
	slices: { label: string; value: number }[];
};

export type AreaChartArtifact = {
	type: "area_chart";
	title: string;
	unit: string;
	points: { label: string; value: number }[];
};

export type StackedBarChartArtifact = {
	type: "stacked_bar_chart";
	title: string;
	unit: string;
	series: { key: string; label: string }[];
	rows: { label: string; values: Record<string, number> }[];
};

/** Suggested code change with a one-click Open PR action. */
export type CodeFixArtifact = {
	type: "code_fix";
	title: string;
	repo: string;
	path: string;
	language: string;
	snippet: string;
	prTitle: string;
	prUrl: string;
};

export type ChatArtifact =
	| SignupsChartArtifact
	| SessionsTableArtifact
	| CrashesTableArtifact
	| PieChartArtifact
	| AreaChartArtifact
	| StackedBarChartArtifact
	| CodeFixArtifact;

const ARTIFACT_TYPES = new Set<ChatArtifact["type"]>([
	"signups_chart",
	"sessions_table",
	"crashes_table",
	"pie_chart",
	"area_chart",
	"stacked_bar_chart",
	"code_fix",
]);

export type ChatWorking = {
	sql: string[];
	assumptions: string[];
	notes?: string[];
	/** Connectors consulted for this reply (shown as branded pills in chat). */
	connectors?: ChatConnector[];
	/** Generation pipeline steps Lumantic walked for this reply. */
	pipeline?: { id: string; label: string; detail?: string }[];
};

export type ChatConnector =
	| "github"
	| "gitlab"
	| "datadog"
	| "slack"
	| "warehouse"
	| "segment"
	| "mixpanel"
	| "sentry"
	| "incident_io"
	| "launchdarkly";

const CHAT_CONNECTORS = new Set<ChatConnector>([
	"github",
	"gitlab",
	"datadog",
	"slack",
	"warehouse",
	"segment",
	"mixpanel",
	"sentry",
	"incident_io",
	"launchdarkly",
]);

export function isChatConnector(value: string): value is ChatConnector {
	return CHAT_CONNECTORS.has(value as ChatConnector);
}

export function parseChatArtifact(raw: string | null | undefined): ChatArtifact | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as ChatArtifact;
		if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
		if (ARTIFACT_TYPES.has(parsed.type)) return parsed;
		return null;
	} catch {
		return null;
	}
}

export function parseChatWorking(raw: string | null | undefined): ChatWorking | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as ChatWorking;
		if (!parsed || typeof parsed !== "object") return null;
		if (!Array.isArray(parsed.sql) || !Array.isArray(parsed.assumptions)) return null;
		const connectors = Array.isArray(parsed.connectors)
			? parsed.connectors.filter((c): c is ChatConnector => typeof c === "string" && isChatConnector(c))
			: undefined;
		const rest: ChatWorking = { sql: parsed.sql, assumptions: parsed.assumptions };
		if (parsed.notes) rest.notes = parsed.notes;
		const pipeline = Array.isArray(parsed.pipeline)
			? parsed.pipeline
					.filter(
						(step): step is { id: string; label: string; detail?: string } =>
							!!step &&
							typeof step === "object" &&
							typeof (step as { id?: unknown }).id === "string" &&
							typeof (step as { label?: unknown }).label === "string",
					)
					.map((step) => ({
						id: step.id,
						label: step.label,
						...(typeof step.detail === "string" ? { detail: step.detail } : {}),
					}))
			: undefined;
		return {
			...rest,
			...(connectors && connectors.length > 0 ? { connectors } : {}),
			...(pipeline && pipeline.length > 0 ? { pipeline } : {}),
		};
	} catch {
		return null;
	}
}

/** Daily Beacon signups across Feb → mid-April; drop starts Mar 3 (checkout OAuth regression). */
export function beaconSignupsChart(): SignupsChartArtifact {
	return {
		type: "signups_chart",
		title: "Beacon signups · Feb 1 – Apr 15, 2026",
		unit: "signups",
		points: [
			{ label: "Feb 1", value: 148 },
			{ label: "Feb 8", value: 152 },
			{ label: "Feb 15", value: 161 },
			{ label: "Feb 22", value: 158 },
			{ label: "Mar 1", value: 165 },
			{ label: "Mar 3", value: 92 },
			{ label: "Mar 8", value: 71 },
			{ label: "Mar 15", value: 64 },
			{ label: "Mar 18", value: 118 },
			{ label: "Mar 22", value: 149 },
			{ label: "Mar 29", value: 156 },
			{ label: "Apr 5", value: 162 },
			{ label: "Apr 12", value: 171 },
		],
	};
}

export function beaconSignupsExplanation(): string {
	return [
		"Beacon **new signups dropped ~58%** starting **March 3**, then recovered after **March 18**.",
		"",
		"Root cause (from confirmed memories): the Mar 3 checkout redesign broke Google OAuth for new workspaces — the `oauth_callback` route returned 500 for first-time accounts. Returning users were unaffected, which is why activation looked healthier than acquisition.",
		"",
		"Fix shipped Mar 18 in Beacon web `1.48.2`. Post-fix signup volume is back above the Feb baseline.",
	].join("\n");
}

export function beaconSignupsWorking(): ChatWorking {
	return {
		sql: [
			`SELECT date_trunc('day', created_at) AS day,
       count(*) AS signups
FROM workspaces
WHERE created_at >= '2026-02-01'
  AND created_at <  '2026-04-16'
  AND signup_source != 'internal'
GROUP BY 1
ORDER BY 1;`,
			`SELECT content
FROM memories
WHERE content ILIKE '%signup%'
   OR content ILIKE '%oauth%'
ORDER BY updated_at DESC
LIMIT 5;`,
		],
		assumptions: [
			"A signup is a newly created Beacon workspace (not a seat invite).",
			"Internal dogfood workspaces (signup_source = 'internal') are excluded.",
			"Day buckets use UTC; the Mar 3 drop aligns with the checkout deploy timestamp in release notes.",
			"Root cause is joined from confirmed memories, not inferred only from the time series.",
		],
		notes: [
			"% drop is (Mar 1 peak 165 → Mar 15 trough 64) / 165 ≈ 58%.",
			"Recovery measured from Mar 19 onward once 1.48.2 was fully rolled out.",
		],
	};
}

export function beaconLongestSessions(): SessionsTableArtifact {
	return {
		type: "sessions_table",
		title: "Top 10 Beacon users by session length · last 7 days",
		rows: [
			{ name: "Elena Vasquez", email: "elena.v@northwind.io", minutes: 312 },
			{ name: "Marcus Cole", email: "mcole@brightlane.co", minutes: 287 },
			{ name: "Sofia Park", email: "sofia@orbitly.app", minutes: 264 },
			{ name: "Devon Blake", email: "devon.blake@hearth.dev", minutes: 241 },
			{ name: "Amira Hassan", email: "amira@kiln.so", minutes: 228 },
			{ name: "Noah Richter", email: "nrichter@foliohq.com", minutes: 211 },
			{ name: "Priya Kapoor", email: "priya.k@stackform.io", minutes: 198 },
			{ name: "Leo Andersson", email: "leo@canvasly.co", minutes: 186 },
			{ name: "Maya Chen", email: "maya@driftworks.app", minutes: 173 },
			{ name: "Owen Brooks", email: "owen.b@signalpath.io", minutes: 159 },
		],
	};
}

export function beaconLongestSessionsExplanation(): string {
	return [
		"Here are the **top 10 Beacon users by longest continuous session** in the last 7 days.",
		"",
		"Session length uses the Beacon definition: continuous activity with a **30-minute idle timeout**. Time is shown on each bar.",
	].join("\n");
}

export function beaconLongestSessionsWorking(): ChatWorking {
	return {
		sql: [
			`SELECT u.name,
       u.email,
       max(s.duration_seconds) / 60 AS minutes
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.started_at >= now() - interval '7 days'
  AND u.email NOT LIKE '%@beacon.com'
GROUP BY u.id, u.name, u.email
ORDER BY minutes DESC
LIMIT 10;`,
		],
		assumptions: [
			"Session length = continuous activity until 30 minutes idle (confirmed memory).",
			"Heartbeat-only activity does not extend a session.",
			"Internal @beacon.com dogfood accounts are excluded from the ranking.",
			"We rank by each user's single longest session, not total time summed across sessions.",
		],
		notes: ["Window is rolling last 7 days ending now (UTC)."],
	};
}

export function beaconCrashesTable(): CrashesTableArtifact {
	return {
		type: "crashes_table",
		title: "Recent Beacon client crashes · last 48 hours",
		rows: [
			{ name: "Jordan Hale", email: "jhale@lumenpath.io", page: "/dashboard/signals", when: "2h ago" },
			{ name: "Casey Ng", email: "casey@rivermark.co", page: "/settings/billing", when: "3h ago" },
			{ name: "Riley Quinn", email: "riley.q@oakline.app", page: "/flags/rollout", when: "5h ago" },
			{ name: "Samir Patel", email: "samir@gridnote.dev", page: "/dashboard/signals", when: "6h ago" },
			{ name: "Taylor Brooks", email: "tbrooks@copperly.so", page: "/onboarding/connect", when: "8h ago" },
			{ name: "Avery Kim", email: "akim@northspan.io", page: "/reports/baw", when: "11h ago" },
			{ name: "Morgan Lee", email: "morgan@slateform.co", page: "/settings/team", when: "14h ago" },
			{ name: "Jamie Ortega", email: "jamie.o@pixelrift.app", page: "/flags/rollout", when: "18h ago" },
			{ name: "Chris Donovan", email: "cdonovan@harborly.io", page: "/dashboard/overview", when: "22h ago" },
			{ name: "Quinn Sato", email: "qsato@meadowstack.dev", page: "/settings/billing", when: "1d ago" },
		],
	};
}

export function beaconCrashesExplanation(): string {
	return [
		"These are the **10 most recent Beacon client crashes** (unhandled JS exceptions from the Beacon web SDK, synced from **Sentry**).",
		"",
		"`/dashboard/signals` and `/settings/billing` show up most often, matching the known memory that the signals chart throws when `feature_key` is null on sandbox orgs.",
		"",
		"**LaunchDarkly** audit: no flag targeting change in the last 48 hours lined up with the crash spike. The null-`feature_key` path is still a code guard gap, not a bad rollout.",
	].join("\n");
}

export function beaconCrashesWorking(): ChatWorking {
	return {
		sql: [
			`SELECT u.name,
       u.email,
       e.tags->>'page_path' AS page,
       e.timestamp AS occurred_at
FROM sentry.events e
JOIN users u ON u.id = (e.user->>'id')::uuid
WHERE e.timestamp >= now() - interval '48 hours'
  AND e.project = 'beacon-web'
  AND e.level = 'fatal'
ORDER BY e.timestamp DESC
LIMIT 10;`,
			`SELECT flag_key, action, actor, occurred_at
FROM launchdarkly.audit_log
WHERE occurred_at >= now() - interval '48 hours'
  AND project = 'beacon-web'
ORDER BY occurred_at DESC
LIMIT 20;`,
			`SELECT content
FROM memories
WHERE content ILIKE '%crash%'
   OR content ILIKE '%feature_key%'
LIMIT 3;`,
		],
		assumptions: [
			"Crash = Sentry fatal event from the Beacon web SDK (project beacon-web).",
			"Page is the SPA route tag at crash time (page_path), not the API endpoint.",
			"Sandbox orgs are included so we can see the known /dashboard/signals null feature_key issue.",
			"Only beacon-web SDK events; mobile native crashes are out of scope here.",
			"LaunchDarkly audit covers targeting, percentage, and kill-switch changes for beacon-web flags.",
		],
		notes: [
			"Queried Sentry Issues API for project beacon-web, last 48 hours.",
			"Cross-checked LaunchDarkly audit log; no coincident flag change explains the spike.",
		],
		connectors: ["sentry", "launchdarkly"],
	};
}

export type AnalyticsReply = {
	content: string;
	artifact: ChatArtifact | null;
	working: ChatWorking;
	suggestedMemory: string | null;
};

function textReply(content: string, working: ChatWorking): AnalyticsReply {
	return { content, artifact: null, working, suggestedMemory: null };
}

export function beaconSignupsLostExplanation(): string {
	return [
		"Across **Mar 3–17**, Beacon created about **~1,140 fewer workspaces** than the Feb daily baseline (~155/day).",
		"",
		"That is roughly **11 days of outage impact** at ~58% below baseline, before `1.48.2` restored OAuth. Mar 18 itself is mixed (partial rollout), so we usually measure recovery from **Mar 19** onward.",
	].join("\n");
}

export function beaconSignupsLostWorking(): ChatWorking {
	return {
		sql: [
			`WITH baseline AS (
  SELECT avg(daily) AS avg_signups
  FROM (
    SELECT date_trunc('day', created_at) AS day, count(*) AS daily
    FROM workspaces
    WHERE created_at >= '2026-02-01' AND created_at < '2026-03-01'
      AND signup_source != 'internal'
    GROUP BY 1
  )
)
SELECT sum(greatest(0, b.avg_signups - d.signups)) AS lost_vs_baseline
FROM (
  SELECT date_trunc('day', created_at) AS day, count(*) AS signups
  FROM workspaces
  WHERE created_at >= '2026-03-03' AND created_at < '2026-03-18'
    AND signup_source != 'internal'
  GROUP BY 1
) d
CROSS JOIN baseline b;`,
		],
		assumptions: [
			"Loss = sum of (Feb daily average − actual) for each day in Mar 3–17, floored at 0.",
			"Internal dogfood signups stay excluded.",
			"Mar 18 excluded from the loss window because the fix was mid-rollout.",
		],
		notes: ["Feb baseline ≈ 155 signups/day from the chart series."],
	};
}

export function beaconSignupsSourcesExplanation(): string {
	return [
		"**Google OAuth** recovered first (back to ~90% of Feb share by Mar 20), because that was the broken path.",
		"",
		"**Email/password** never dipped as hard and stayed roughly flat. **SSO / SAML** was barely affected (existing IdP sessions).",
		"",
		"Invite-accepted workspaces also held up: those users already had an account, so they skipped the broken first-time OAuth callback.",
	].join("\n");
}

export function beaconSignupsSourcesWorking(): ChatWorking {
	return {
		sql: [
			`SELECT date_trunc('week', created_at) AS week,
       signup_method,
       count(*) AS signups
FROM workspaces
WHERE created_at >= '2026-02-01'
  AND created_at <  '2026-04-16'
  AND signup_source != 'internal'
GROUP BY 1, 2
ORDER BY 1, 2;`,
		],
		assumptions: [
			"signup_method is one of google_oauth, email_password, sso_saml, invite.",
			"Share comparisons use Feb weeks as the baseline mix.",
		],
	};
}

export function beaconSessionsMedianExplanation(): string {
	return [
		"Median continuous session length over the same 7-day window is **~24 minutes**.",
		"",
		"So the top 10 (159–312 minutes) are extreme outliers: roughly **6–13×** the median. They are usually analysts or CSMs living in the signals dashboard for long stretches.",
	].join("\n");
}

export function beaconSessionsMedianWorking(): ChatWorking {
	return {
		sql: [
			`SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY s.duration_seconds) / 60 AS median_minutes
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.started_at >= now() - interval '7 days'
  AND u.email NOT LIKE '%@beacon.com';`,
		],
		assumptions: [
			"Same 30-minute idle definition as the longest-session ranking.",
			"Median is across all sessions in the window, not per-user longest.",
			"Internal @beacon.com accounts excluded for consistency with the top-10 query.",
		],
	};
}

export function beaconSessionsPlanExplanation(): string {
	return [
		"Of the top 10, **7 are on Enterprise**, **2 on Pro**, and **1 on a legacy Team plan**.",
		"",
		"None are Beacon employees: internal `@beacon.com` accounts are filtered out of this ranking (confirmed memory). Longest sessions skew enterprise because those seats spend more time in rollout and signals views.",
	].join("\n");
}

export function beaconSessionsPlanWorking(): ChatWorking {
	return {
		sql: [
			`WITH top AS (
  SELECT u.id, u.email, max(s.duration_seconds) AS longest
  FROM sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.started_at >= now() - interval '7 days'
    AND u.email NOT LIKE '%@beacon.com'
  GROUP BY u.id, u.email
  ORDER BY longest DESC
  LIMIT 10
)
SELECT o.plan, count(*) AS users
FROM top t
JOIN org_members m ON m.user_id = t.id
JOIN orgs o ON o.id = m.org_id
GROUP BY o.plan
ORDER BY users DESC;`,
		],
		assumptions: [
			"Plan is taken from the user's primary org membership.",
			"Internal dogfood emails remain excluded before the plan join.",
		],
	};
}

export function beaconCrashesSignalsFollowupExplanation(): string {
	return [
		"Yes. In the last 48 hours, **`/dashboard/signals` is still #1** (4 of the 10 most recent crashes), tied with billing only if you count both billing routes together.",
		"",
		"That matches the known memory: the signals chart throws when `feature_key` is null on sandbox orgs. A guard for null keys is still on the eng board; it has not shipped yet.",
	].join("\n");
}

export function beaconCrashesSignalsFollowupWorking(): ChatWorking {
	return {
		sql: [
			`SELECT e.tags->>'page_path' AS page_path, count(*) AS crashes
FROM sentry.events e
WHERE e.timestamp >= now() - interval '48 hours'
  AND e.project = 'beacon-web'
  AND e.level = 'fatal'
GROUP BY 1
ORDER BY crashes DESC
LIMIT 5;`,
		],
		assumptions: [
			"Ranking is by Sentry fatal event count in the last 48 hours, not unique users.",
			"Same beacon-web project scope as the recent-crashes table.",
		],
		connectors: ["sentry", "launchdarkly"],
	};
}

export function beaconCrashesSandboxExplanation(): string {
	return [
		"**6 of the 10** most recent crashes were on orgs tagged `env = sandbox`. All four `/dashboard/signals` rows in that list are sandbox.",
		"",
		"Production crashes still happen (billing and flags pages), but the signals null-`feature_key` path is overwhelmingly a sandbox issue today.",
	].join("\n");
}

export function beaconCrashesSandboxWorking(): ChatWorking {
	return {
		sql: [
			`SELECT
  count(*) FILTER (WHERE o.env = 'sandbox') AS sandbox_crashes,
  count(*) FILTER (WHERE o.env != 'sandbox') AS other_crashes
FROM (
  SELECT (e.user->>'id')::uuid AS user_id
  FROM sentry.events e
  WHERE e.timestamp >= now() - interval '48 hours'
    AND e.project = 'beacon-web'
    AND e.level = 'fatal'
  ORDER BY e.timestamp DESC
  LIMIT 10
) recent
JOIN org_members m ON m.user_id = recent.user_id
JOIN orgs o ON o.id = m.org_id;`,
		],
		assumptions: [
			"Sandbox is org.env = 'sandbox', same tag used for Beacon Score exclusions.",
			"Primary org membership is used when a user belongs to multiple orgs.",
			"Crash set is the same Sentry fatal sample as the recent-crashes table.",
		],
		connectors: ["sentry", "launchdarkly"],
	};
}

export function beaconScoreFilterExplanation(): string {
	return [
		"The sandbox / dogfood exclusion lives in the **Beacon Score dbt model** (`marts.beacon_score`), not in the chart UI.",
		"",
		"Filter is `orgs.env != 'sandbox' AND orgs.slug != 'beacon-dogfood'`. If Score jumps overnight, the first check is whether that WHERE clause was removed or bypassed in a model change.",
	].join("\n");
}

export function beaconScoreFilterWorking(): ChatWorking {
	return {
		sql: [
			`SELECT content
FROM memories
WHERE content ILIKE '%Beacon Score%'
   OR content ILIKE '%sandbox%'
ORDER BY updated_at DESC
LIMIT 5;`,
		],
		assumptions: [
			"Answer is from confirmed memories about Score construction.",
			"Implementation detail points at the dbt mart, which is the source of truth for Score.",
		],
	};
}

export function beaconSessionEventsExplanation(): string {
	return [
		"A **client event** is any Beacon web SDK signal (page view, click, flag evaluate, chart interaction). **Heartbeats and presence pings do not count.**",
		"",
		"Mobile native uses the same **30-minute idle** rule, but the event catalog differs (no DOM clicks). Backgrounded mobile apps still end the session after 30 minutes without a foreground signal.",
	].join("\n");
}

export function beaconSessionEventsWorking(): ChatWorking {
	return {
		sql: [
			`SELECT event, count(*) AS events
FROM segment.tracks
WHERE received_at >= now() - interval '7 days'
  AND event IN ('Page Viewed', 'Feature Flag Evaluated', 'Chart Interacted', 'Heartbeat')
GROUP BY 1
ORDER BY 2 DESC;`,
			`SELECT content
FROM memories
WHERE content ILIKE '%session%'
   OR content ILIKE '%heartbeat%'
ORDER BY updated_at DESC
LIMIT 5;`,
		],
		assumptions: [
			"Client event catalog taken from Segment tracks for the Beacon web SDK.",
			"Heartbeat exclusion confirmed against Mixpanel event definitions and the session-timeout memory.",
			"Mobile parity is stated as product policy from that same definition family.",
		],
		notes: [
			"Segment: Page Viewed, Feature Flag Evaluated, Chart Interacted count toward sessions.",
			"Mixpanel: Heartbeat / Presence Ping are marked non-session in the Beacon schema.",
		],
		connectors: ["segment", "mixpanel"],
	};
}

const OUTAGE_BUGGY_TS = `// auth/session.ts (PR #2041)
export async function readSession(token: string) {
  const cached = await redis.get(\`sess:\${token}\`);
  if (cached) {
    // Bug: truncated Redis payloads threw, and the empty catch
    // returned a session object with userId = undefined.
    try {
      return JSON.parse(cached) as Session;
    } catch {
      return { token, userId: undefined as unknown as string };
    }
  }
  return loadSessionFromDb(token);
}

export function requireUser(session: Session) {
  // Null deref → 500 on every refresh while bad keys were cached.
  return session.userId.toString();
}`;

const OUTAGE_FIX_TS = `// auth/session.ts (PR #2048 hotfix)
export async function readSession(token: string) {
  const cached = await redis.get(\`sess:\${token}\`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Session;
      if (!parsed?.userId) {
        await redis.del(\`sess:\${token}\`);
        return loadSessionFromDb(token);
      }
      return parsed;
    } catch {
      await redis.del(\`sess:\${token}\`);
    }
  }
  return loadSessionFromDb(token);
}

export function requireUser(session: Session) {
  if (!session.userId) throw new AuthError("session_missing_user");
  return session.userId;
}`;

export function beaconOutageExplanation(): string {
	return [
		"Last week's downtime was a **shipped auth bug**, not capacity.",
		"",
		"**incident.io** INC-1842 (`beacon-api session refresh 500s`) was opened at **10:16 UTC** from the Datadog page, and closed when the hotfix finished rolling out.",
		"",
		"**Datadog** (`beacon-api`, site `us1`): error rate jumped from ~0.2% to **38%** on Tue Jul 22, **10:14-11:02 UTC**. Almost all failures were **500s** on `/v1/session/refresh`.",
		"",
		"**GitHub** PR **#2041** (`feat: reuse Redis session blob across pods`, merged Mon evening by Casey Morgan) introduced a bad fallback when Redis returned truncated JSON:",
		"",
		"```ts",
		OUTAGE_BUGGY_TS,
		"```",
		"",
		"Pods kept writing those half-parsed sessions back into Redis, so the blast radius grew for ~48 minutes.",
		"",
		"**Resolved** by **GitHub** PR **#2048** (hotfix): delete bad cache keys, refuse sessions without `userId`, and map the miss to a clean 401 instead of a 500:",
		"",
		"```ts",
		OUTAGE_FIX_TS,
		"```",
		"",
		"Datadog recovered to baseline within two minutes of the hotfix rollout. No warehouse schema change was involved.",
	].join("\n");
}

export function beaconOutageWorking(): ChatWorking {
	return {
		sql: [],
		assumptions: [
			"Incident timeline taken from incident.io INC-1842 (opened 10:16 UTC, resolved 11:04 UTC).",
			"Outage window cross-checked against Datadog APM error-rate monitors on beacon-api.",
			"Root cause attributed to the GitHub PR that landed immediately before the spike.",
			"Fix attribution uses the hotfix PR that cleared Redis and added the null guard.",
		],
		notes: [
			"PR #2041 merged ~14h before the incident; #2048 closed it.",
			"No evidence of a Datadog or infra provider outage in the same window.",
			"Sentry issue BEACON-API-2F1 spiked in lockstep with the APM error rate.",
			"incident.io severity: major; responders: Casey Morgan, on-call platform.",
		],
		connectors: ["incident_io", "datadog", "github", "sentry"],
	};
}

/** Signup mix by acquisition channel (pie). */
export function beaconSignupMixPie(): PieChartArtifact {
	return {
		type: "pie_chart",
		title: "Beacon signups by source · Q2 2026",
		unit: "signups",
		slices: [
			{ label: "Google OAuth", value: 412 },
			{ label: "Work email", value: 268 },
			{ label: "SSO / SAML", value: 147 },
			{ label: "Invite link", value: 96 },
			{ label: "Other", value: 41 },
		],
	};
}

export function beaconSignupMixExplanation(): string {
	return [
		"**Google OAuth** is still the largest acquisition channel at **~43%** of Q2 Beacon signups, followed by work email (**28%**) and SSO (**15%**).",
		"",
		"Invite links remain a meaningful secondary motion for multi-seat teams. The March OAuth regression briefly suppressed Google share; by late April it had recovered to the chart above.",
	].join("\n");
}

export function beaconSignupMixWorking(): ChatWorking {
	return {
		sql: [
			`SELECT coalesce(signup_source, 'other') AS source,
       count(*) AS signups
FROM workspaces
WHERE created_at >= '2026-04-01'
  AND created_at <  '2026-07-01'
  AND signup_source != 'internal'
GROUP BY 1
ORDER BY 2 DESC;`,
		],
		assumptions: [
			"Q2 = Apr 1 – Jun 30 UTC.",
			"Internal / dogfood signups excluded.",
			"Null signup_source rolled into Other.",
		],
		connectors: ["warehouse", "segment"],
	};
}

/** Weekly Beacon Active Workspaces (area). */
export function beaconActiveWorkspacesArea(): AreaChartArtifact {
	return {
		type: "area_chart",
		title: "Beacon Active Workspaces · last 12 weeks",
		unit: "workspaces",
		points: [
			{ label: "W1", value: 1180 },
			{ label: "W2", value: 1204 },
			{ label: "W3", value: 1191 },
			{ label: "W4", value: 1238 },
			{ label: "W5", value: 1260 },
			{ label: "W6", value: 1244 },
			{ label: "W7", value: 1295 },
			{ label: "W8", value: 1312 },
			{ label: "W9", value: 1288 },
			{ label: "W10", value: 1336 },
			{ label: "W11", value: 1361 },
			{ label: "W12", value: 1384 },
		],
	};
}

export function beaconActiveWorkspacesExplanation(): string {
	return [
		"Beacon **Active Workspaces** (BAW) climbed from **1,180 → 1,384** over the last 12 weeks (**+17%**).",
		"",
		"Growth is steady rather than spiky: soft patches in W6/W9 line up with holiday weeks, not product regressions. Sandbox and dogfood orgs stay excluded from BAW.",
	].join("\n");
}

export function beaconActiveWorkspacesWorking(): ChatWorking {
	return {
		sql: [
			`SELECT date_trunc('week', day) AS week,
       count(DISTINCT workspace_id) AS active_workspaces
FROM beacon_signals_daily
WHERE day >= current_date - interval '84 days'
  AND env != 'sandbox'
  AND workspace_id NOT IN (SELECT id FROM workspaces WHERE is_dogfood)
GROUP BY 1
ORDER BY 1;`,
		],
		assumptions: [
			"BAW = workspaces with at least 1 Beacon signal in the trailing 7 days ending each week.",
			"Sandbox + beacon-dogfood excluded per Score / BAW memory.",
			"Week labels are relative (W1 oldest to W12 newest).",
		],
		connectors: ["warehouse", "mixpanel"],
	};
}

/** Sessions by plan tier (stacked bar). */
export function beaconSessionsByPlanStacked(): StackedBarChartArtifact {
	return {
		type: "stacked_bar_chart",
		title: "Beacon sessions by plan · last 6 weeks",
		unit: "sessions",
		series: [
			{ key: "starter", label: "Starter" },
			{ key: "scale", label: "Scale" },
			{ key: "enterprise", label: "Enterprise" },
		],
		rows: [
			{ label: "W1", values: { starter: 4200, scale: 6100, enterprise: 2800 } },
			{ label: "W2", values: { starter: 4050, scale: 6400, enterprise: 2950 } },
			{ label: "W3", values: { starter: 3880, scale: 6700, enterprise: 3100 } },
			{ label: "W4", values: { starter: 3720, scale: 7050, enterprise: 3320 } },
			{ label: "W5", values: { starter: 3610, scale: 7280, enterprise: 3480 } },
			{ label: "W6", values: { starter: 3490, scale: 7520, enterprise: 3610 } },
		],
	};
}

export function beaconSessionsByPlanExplanation(): string {
	return [
		"Session volume is shifting upmarket: **Scale + Enterprise** now make up most weekly sessions, while **Starter** slowly declines as teams upgrade.",
		"",
		"Enterprise grew **~29%** across the window; Scale **~23%**. Starter is down **~17%**, consistent with the Starter to Scale conversion motion in billing.",
	].join("\n");
}

export function beaconSessionsByPlanWorking(): ChatWorking {
	return {
		sql: [
			`SELECT date_trunc('week', started_at) AS week,
       plan,
       count(*) AS sessions
FROM sessions s
JOIN workspaces w ON w.id = s.workspace_id
WHERE started_at >= current_date - interval '42 days'
  AND w.env != 'sandbox'
GROUP BY 1, 2
ORDER BY 1, 2;`,
		],
		assumptions: [
			"Plan taken from workspace.plan at session start.",
			"Sandbox sessions excluded.",
			"Idle-timeout ended sessions still count (standard Beacon session definition).",
		],
		connectors: ["warehouse", "segment"],
	};
}

/** Top Beacon product events from Segment (pie). */
export function beaconTopEventsPie(): PieChartArtifact {
	return {
		type: "pie_chart",
		title: "Beacon product events · last 7 days",
		unit: "events",
		slices: [
			{ label: "Page Viewed", value: 84200 },
			{ label: "Feature Flag Evaluated", value: 41800 },
			{ label: "Chart Interacted", value: 12600 },
			{ label: "Signal Fired", value: 9400 },
			{ label: "Other", value: 5100 },
		],
	};
}

export function beaconTopEventsExplanation(): string {
	return [
		"**Page Viewed** dominates Beacon client traffic (**~55%** of Segment tracks last week), then **Feature Flag Evaluated** (**~27%**).",
		"",
		"Chart interactions and Signal Fired are the sticky product moments. Heartbeats are filtered out of this mix (they are not Beacon session events).",
		"",
		"**LaunchDarkly** evaluations map 1:1 to the Feature Flag Evaluated Segment track from the Beacon web SDK.",
	].join("\n");
}

export function beaconTopEventsWorking(): ChatWorking {
	return {
		sql: [
			`SELECT event, count(*) AS events
FROM segment.tracks
WHERE received_at >= now() - interval '7 days'
  AND event NOT IN ('Heartbeat', 'Presence Ping')
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;`,
		],
		assumptions: [
			"Event names taken from the Beacon web SDK Segment schema.",
			"Heartbeat / Presence Ping excluded so the mix matches session-eligible events.",
			"Sandbox workspaces filtered via context.traits.env.",
		],
		notes: [
			"Queried live Segment tracks for the Beacon production source.",
			"Feature Flag Evaluated volume cross-checked against LaunchDarkly evaluation counts.",
		],
		connectors: ["segment", "launchdarkly"],
	};
}

/** Activation funnel steps from Mixpanel (+ Segment identity). */
export function beaconActivationFunnelStacked(): StackedBarChartArtifact {
	return {
		type: "stacked_bar_chart",
		title: "Beacon activation funnel · last 6 weeks",
		unit: "workspaces",
		series: [
			{ key: "signed_up", label: "Signed up" },
			{ key: "first_signal", label: "First signal" },
			{ key: "activated", label: "Activated" },
		],
		rows: [
			{ label: "W1", values: { signed_up: 420, first_signal: 310, activated: 188 } },
			{ label: "W2", values: { signed_up: 445, first_signal: 328, activated: 201 } },
			{ label: "W3", values: { signed_up: 438, first_signal: 334, activated: 214 } },
			{ label: "W4", values: { signed_up: 462, first_signal: 351, activated: 229 } },
			{ label: "W5", values: { signed_up: 471, first_signal: 360, activated: 241 } },
			{ label: "W6", values: { signed_up: 485, first_signal: 372, activated: 256 } },
		],
	};
}

export function beaconActivationFunnelExplanation(): string {
	return [
		"Activation is improving: **Signed up → First signal** holds around **76%**, and **First signal → Activated** climbed from **61% → 69%** over six weeks.",
		"",
		"Mixpanel defines Activated as 3+ Beacon signals in the first 7 days. Segment supplies the signup identity join so warehouse cohorts stay consistent.",
	].join("\n");
}

export function beaconActivationFunnelWorking(): ChatWorking {
	return {
		sql: [
			`SELECT week,
       countIf(step = 'Signed Up') AS signed_up,
       countIf(step = 'First Signal') AS first_signal,
       countIf(step = 'Activated') AS activated
FROM mixpanel.beacon_activation_funnel
WHERE week >= current_date - interval '42 days'
GROUP BY 1
ORDER BY 1;`,
			`SELECT user_id, anonymous_id
FROM segment.identifies
WHERE received_at >= now() - interval '42 days';`,
		],
		assumptions: [
			"Activated = 3+ Beacon signals within 7 days of signup (Mixpanel board definition).",
			"First signal excludes Heartbeat / Presence Ping.",
			"Segment identifies used to stitch anonymous SDK traffic to workspace owners.",
		],
		notes: [
			"Mixpanel Insights board: Beacon Activation (prod).",
			"Segment Identify calls provide the user_id join key.",
		],
		connectors: ["mixpanel", "segment"],
	};
}

const SIGNALS_NULL_GUARD_TS = `// src/web/charts/SignalsChart.tsx
export function SignalsChart({ rows }: { rows: SignalRow[] }) {
  // Guard: sandbox orgs can emit rows with feature_key = null.
  // Rendering those without a key threw and crashed the page.
  const safeRows = rows.filter(
    (row): row is SignalRow & { feature_key: string } =>
      typeof row.feature_key === "string" && row.feature_key.length > 0,
  );

  if (safeRows.length === 0) {
    return <EmptyState title="No signals yet" />;
  }

  return <SignalsSeries rows={safeRows} />;
}`;

/** Issue recap: null feature_key crashes on /dashboard/signals. */
export function beaconSignalsCrashIssueExplanation(): string {
	return [
		"**Sentry** shows a steady drip of fatals on `/dashboard/signals` for sandbox orgs: `TypeError: Cannot read properties of null (reading 'length')` inside `SignalsChart`.",
		"",
		"**LaunchDarkly** did not change targeting in the same window. This is a missing null guard on `feature_key`, not a bad flag rollout.",
		"",
		"The eng board already tracks a fix; it has not shipped. Ask if you want a concrete prevention change.",
	].join("\n");
}

export function beaconSignalsCrashIssueWorking(): ChatWorking {
	return {
		sql: [
			`SELECT e.culprit, count(*) AS events
FROM sentry.events e
WHERE e.timestamp >= now() - interval '7 days'
  AND e.project = 'beacon-web'
  AND e.tags->>'page_path' = '/dashboard/signals'
  AND e.level = 'fatal'
GROUP BY 1
ORDER BY events DESC;`,
		],
		assumptions: [
			"Crash signature taken from Sentry issue BEACON-WEB-4C2.",
			"Sandbox orgs are the dominant env tag on these events.",
		],
		notes: ["LaunchDarkly audit: no coincident flag change."],
		connectors: ["sentry", "launchdarkly"],
	};
}

/** Prevention answer: where to change code + Open PR artifact. */
export function beaconSignalsCrashPreventExplanation(): string {
	return [
		"To stop this recurring, add a **null `feature_key` guard** in the Beacon web chart before it renders the series.",
		"",
		"Change **`src/web/charts/SignalsChart.tsx`** in `beacon/beacon-web` (around the `SignalsChart` export). Filter out rows without a string `feature_key`, and show the empty state instead of throwing.",
		"",
		"Suggested patch:",
		"",
		"```ts",
		SIGNALS_NULL_GUARD_TS,
		"```",
		"",
		"Also add a unit test for a sandbox payload with `feature_key: null`. Open the PR below when you are ready; it targets `main` from `fix/signals-null-feature-key`.",
	].join("\n");
}

export function beaconSignalsCrashPreventFix(): CodeFixArtifact {
	return {
		type: "code_fix",
		title: "Guard null feature_key in SignalsChart",
		repo: "beacon/beacon-web",
		path: "src/web/charts/SignalsChart.tsx",
		language: "ts",
		snippet: SIGNALS_NULL_GUARD_TS,
		prTitle: "fix: guard null feature_key in SignalsChart",
		prUrl: "https://github.com/beacon/beacon-web/compare/main...fix/signals-null-feature-key?expand=1&title=fix%3A%20guard%20null%20feature_key%20in%20SignalsChart",
	};
}

export function beaconSignalsCrashPreventWorking(): ChatWorking {
	return {
		sql: [
			`SELECT path, last_commit_sha, last_author
FROM github.repo_files
WHERE repo = 'beacon/beacon-web'
  AND path = 'src/web/charts/SignalsChart.tsx';`,
		],
		assumptions: [
			"Prevention = client-side guard plus a regression test; warehouse backfill is not required.",
			"PR opens against main from branch fix/signals-null-feature-key.",
		],
		notes: [
			"File located via GitHub code search for SignalsChart + feature_key.",
			"Matches the known memory about sandbox null feature_key crashes.",
		],
		connectors: ["github", "sentry"],
	};
}

/** Match product-analytics questions and return a rich Beacon reply, or null. */
export function matchBeaconAnalyticsQuestion(userText: string): AnalyticsReply | null {
	const lower = userText.toLowerCase();

	if (
		/\bprevent\b/.test(lower) &&
		(/\b(crash|crashes|signals?|feature_key)\b/.test(lower) || /\bhappen(ing)? again\b/.test(lower))
	) {
		return {
			content: beaconSignalsCrashPreventExplanation(),
			artifact: beaconSignalsCrashPreventFix(),
			working: beaconSignalsCrashPreventWorking(),
			suggestedMemory:
				"SignalsChart must filter null feature_key before render; sandbox orgs emit null keys and crash /dashboard/signals without the guard.",
		};
	}

	if (
		/\b(signals?|feature_key)\b/.test(lower) &&
		/\b(crash|crashes|broke|broken|issue|bug)\b/.test(lower)
	) {
		return textReply(beaconSignalsCrashIssueExplanation(), beaconSignalsCrashIssueWorking());
	}

	if (
		(/\b(down|outage|incident|offline|500s?|p0)\b/.test(lower) &&
			/\b(app|api|beacon|prod|production|site)\b/.test(lower)) ||
		(/\b(why|what)\b/.test(lower) && /\b(down|outage)\b/.test(lower)) ||
		(/\blast week\b/.test(lower) && /\b(down|outage|broke|break)\b/.test(lower))
	) {
		return textReply(beaconOutageExplanation(), beaconOutageWorking());
	}

	// Follow-ups first (more specific than the parent questions).
	if (/\b(lost|lose|missed|how many)\b/.test(lower) && /\bsignups?\b/.test(lower)) {
		return textReply(beaconSignupsLostExplanation(), beaconSignupsLostWorking());
	}
	if (
		/\b(source|sources|oauth|google|email|method)\b/.test(lower) &&
		/\b(recover|recovery|fix)\b/.test(lower) &&
		/\b(signup|signups)\b/.test(lower)
	) {
		return textReply(beaconSignupsSourcesExplanation(), beaconSignupsSourcesWorking());
	}
	if (/\bmedian\b/.test(lower) && /\bsession/.test(lower)) {
		return textReply(beaconSessionsMedianExplanation(), beaconSessionsMedianWorking());
	}
	if (
		/\b(enterprise|plan|plans|dogfood|employee|internal)\b/.test(lower) &&
		/\b(session|top\s*10|longest)\b/.test(lower)
	) {
		return textReply(beaconSessionsPlanExplanation(), beaconSessionsPlanWorking());
	}
	if (/\b(signals|still|top)\b/.test(lower) && /\b(crash|page)\b/.test(lower)) {
		return textReply(beaconCrashesSignalsFollowupExplanation(), beaconCrashesSignalsFollowupWorking());
	}
	if (/\bsandbox\b/.test(lower) && /\b(crash|crashes)\b/.test(lower)) {
		return textReply(beaconCrashesSandboxExplanation(), beaconCrashesSandboxWorking());
	}
	if (/\b(where|filter|enforced|dbt|model)\b/.test(lower) && /\b(score|sandbox)\b/.test(lower)) {
		return textReply(beaconScoreFilterExplanation(), beaconScoreFilterWorking());
	}
	if (/\b(client event|heartbeat|mobile|what counts)\b/.test(lower) && /\b(session|idle|timeout|event)\b/.test(lower)) {
		return textReply(beaconSessionEventsExplanation(), beaconSessionEventsWorking());
	}

	if (
		(/\b(mix|breakdown|share|pie|top)\b/.test(lower) && /\b(event|events|tracks)\b/.test(lower)) ||
		(/\bproduct events?\b/.test(lower) && /\b(week|segment|mix)\b/.test(lower)) ||
		(/\bwhich events?\b/.test(lower) && /\b(most|common|top)\b/.test(lower))
	) {
		return {
			content: beaconTopEventsExplanation(),
			artifact: beaconTopEventsPie(),
			working: beaconTopEventsWorking(),
			suggestedMemory: null,
		};
	}

	if (
		(/\bactivation\b/.test(lower) && /\b(funnel|first signal|activated)\b/.test(lower)) ||
		(/\bfunnel\b/.test(lower) && /\b(signup|signal|activat)\b/.test(lower)) ||
		(/\bmixpanel\b/.test(lower) && /\b(activation|funnel)\b/.test(lower))
	) {
		return {
			content: beaconActivationFunnelExplanation(),
			artifact: beaconActivationFunnelStacked(),
			working: beaconActivationFunnelWorking(),
			suggestedMemory: null,
		};
	}

	if (
		(/\b(mix|breakdown|share|pie)\b/.test(lower) && /\b(signup|source|channel|acquisition)\b/.test(lower)) ||
		(/\bsignups?\b/.test(lower) && /\bby source\b/.test(lower))
	) {
		return {
			content: beaconSignupMixExplanation(),
			artifact: beaconSignupMixPie(),
			working: beaconSignupMixWorking(),
			suggestedMemory: null,
		};
	}

	if (
		(/\b(active workspaces?|baw)\b/.test(lower) && /\b(week|weekly|trend|over time|last)\b/.test(lower)) ||
		(/\bweekly\b/.test(lower) && /\bactive\b/.test(lower) && /\bworkspace/.test(lower))
	) {
		return {
			content: beaconActiveWorkspacesExplanation(),
			artifact: beaconActiveWorkspacesArea(),
			working: beaconActiveWorkspacesWorking(),
			suggestedMemory: null,
		};
	}

	if (
		(/\bsessions?\b/.test(lower) && /\bby plan\b/.test(lower)) ||
		(/\b(stack|stacked|breakdown)\b/.test(lower) && /\bsession/.test(lower) && /\bplan/.test(lower))
	) {
		return {
			content: beaconSessionsByPlanExplanation(),
			artifact: beaconSessionsByPlanStacked(),
			working: beaconSessionsByPlanWorking(),
			suggestedMemory: null,
		};
	}

	if (/\bsignups?\b/.test(lower) && /\b(drop|dropped|fall|fell|decline|down|march|mar)\b/.test(lower)) {
		return {
			content: beaconSignupsExplanation(),
			artifact: beaconSignupsChart(),
			working: beaconSignupsWorking(),
			suggestedMemory: null,
		};
	}

	if (/\bsessions?\b/.test(lower) && /\b(longest|top\s*10|top ten|longest session)\b/.test(lower)) {
		return {
			content: beaconLongestSessionsExplanation(),
			artifact: beaconLongestSessions(),
			working: beaconLongestSessionsWorking(),
			suggestedMemory: null,
		};
	}

	if (/\b(crash|crashes|crashed)\b/.test(lower)) {
		return {
			content: beaconCrashesExplanation(),
			artifact: beaconCrashesTable(),
			working: beaconCrashesWorking(),
			suggestedMemory: null,
		};
	}

	return null;
}

export function memoryLookupWorking(matchedContent?: string): ChatWorking {
	return {
		sql: [
			`SELECT id, content, category, source, updated_at
FROM memories
ORDER BY updated_at DESC;`,
		],
		assumptions: [
			"Answer is grounded only in confirmed memories (not proposed).",
			"Match uses exact token overlap on significant words (3+ chars), no fuzzy stemming.",
			matchedContent
				? "Selected the highest-scoring memory by summed matched token length."
				: "No memory scored above zero for this question.",
		],
		notes: matchedContent
			? [`Matched memory excerpt: “${matchedContent.slice(0, 140)}${matchedContent.length > 140 ? "…" : ""}”`]
			: undefined,
	};
}

export function genericWorking(
	kind: "greeting" | "slack" | "github" | "datadog" | "data_sources" | "memory_meta" | "fallback",
): ChatWorking {
	if (kind === "greeting") {
		return {
			sql: [],
			assumptions: ["No warehouse query needed for a greeting.", "Scoped to the Beacon workspace for this login."],
			notes: ["Ready to run product analytics SQL once you ask about signups, sessions, or crashes."],
		};
	}
	if (kind === "slack") {
		return {
			sql: [
				`SELECT connected, workspace_name, bot_name, default_channel_name,
       post_proposed_memories, post_daily_digest
FROM slack_settings
WHERE id = 1;`,
			],
			assumptions: ["Slack connection state is read from the live settings row for this workspace."],
			connectors: ["slack"],
		};
	}
	if (kind === "github") {
		return {
			sql: [
				`SELECT connected, org_name, account_login, default_repo_name,
       sync_metric_defs, comment_on_analytics_prs, watch_schema_changes
FROM github_settings
WHERE id = 1;`,
			],
			assumptions: ["GitHub connection state is read from the live settings row for this workspace."],
			connectors: ["github"],
		};
	}
	if (kind === "datadog") {
		return {
			sql: [
				`SELECT connected, org_name, site, default_service,
       sync_apm_errors, sync_slo_breaches, use_in_chat
FROM datadog_settings
WHERE id = 1;`,
			],
			assumptions: ["Datadog connection state is read from the live settings row for this workspace."],
			connectors: ["datadog"],
		};
	}
	if (kind === "data_sources") {
		return {
			sql: [
				`SELECT id, label, kind, connected, display_name, database_name, schema_name, use_for_chat
FROM data_sources
ORDER BY connected DESC, label ASC;`,
			],
			assumptions: ["Connection inventory is read from the live data_sources table for this workspace."],
			connectors: ["warehouse"],
		};
	}
	if (kind === "memory_meta") {
		return {
			sql: [`SELECT count(*) AS confirmed FROM memories;`, `SELECT count(*) AS proposed FROM proposed_memories;`],
			assumptions: ["Counts are live for the Beacon workspace."],
		};
	}
	return {
		sql: [`SELECT content FROM memories ORDER BY updated_at DESC;`],
		assumptions: [
			"No confirmed memory matched this question.",
			"Offering to create a proposed memory from the raw question text.",
		],
	};
}
