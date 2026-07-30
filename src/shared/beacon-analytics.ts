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

export type ChatArtifact = SignupsChartArtifact | SessionsTableArtifact | CrashesTableArtifact;

export type ChatWorking = {
	sql: string[];
	assumptions: string[];
	notes?: string[];
};

export function parseChatArtifact(raw: string | null | undefined): ChatArtifact | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as ChatArtifact;
		if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
		if (parsed.type === "signups_chart" || parsed.type === "sessions_table" || parsed.type === "crashes_table") {
			return parsed;
		}
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
		return parsed;
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
		"These are the **10 most recent Beacon client crashes** (unhandled JS exceptions from the Beacon web SDK).",
		"",
		"`/dashboard/signals` and `/settings/billing` show up most often — matching the known memory that the signals chart throws when `feature_key` is null on sandbox orgs.",
	].join("\n");
}

export function beaconCrashesWorking(): ChatWorking {
	return {
		sql: [
			`SELECT u.name,
       u.email,
       c.page_path AS page,
       c.occurred_at
FROM client_crashes c
JOIN users u ON u.id = c.user_id
WHERE c.occurred_at >= now() - interval '48 hours'
  AND c.sdk = 'beacon-web'
ORDER BY c.occurred_at DESC
LIMIT 10;`,
			`SELECT content
FROM memories
WHERE content ILIKE '%crash%'
   OR content ILIKE '%feature_key%'
LIMIT 3;`,
		],
		assumptions: [
			"Crash = unhandled JS exception reported by the Beacon web SDK.",
			"Page is the SPA route at crash time (c.page_path), not the API endpoint.",
			"Sandbox orgs are included so we can see the known /dashboard/signals null feature_key issue.",
			"Only beacon-web SDK events; mobile native crashes are out of scope here.",
		],
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
			`SELECT c.page_path, count(*) AS crashes
FROM client_crashes c
WHERE c.occurred_at >= now() - interval '48 hours'
  AND c.sdk = 'beacon-web'
GROUP BY 1
ORDER BY crashes DESC
LIMIT 5;`,
		],
		assumptions: [
			"Ranking is by crash count in the last 48 hours, not unique users.",
			"Same beacon-web SDK scope as the recent-crashes table.",
		],
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
  SELECT c.user_id
  FROM client_crashes c
  WHERE c.occurred_at >= now() - interval '48 hours'
    AND c.sdk = 'beacon-web'
  ORDER BY c.occurred_at DESC
  LIMIT 10
) recent
JOIN org_members m ON m.user_id = recent.user_id
JOIN orgs o ON o.id = m.org_id;`,
		],
		assumptions: [
			"Sandbox is org.env = 'sandbox', same tag used for Beacon Score exclusions.",
			"Primary org membership is used when a user belongs to multiple orgs.",
		],
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
			`SELECT content
FROM memories
WHERE content ILIKE '%session%'
   OR content ILIKE '%heartbeat%'
ORDER BY updated_at DESC
LIMIT 5;`,
		],
		assumptions: [
			"Grounded in the confirmed session-timeout memory.",
			"Mobile parity is stated as product policy from that same definition family.",
		],
	};
}

/** Match product-analytics questions and return a rich Beacon reply, or null. */
export function matchBeaconAnalyticsQuestion(userText: string): AnalyticsReply | null {
	const lower = userText.toLowerCase();

	// Follow-ups first (more specific than the parent questions).
	if (/\b(lost|lose|missed|how many)\b/.test(lower) && /\bsignups?\b/.test(lower)) {
		return textReply(beaconSignupsLostExplanation(), beaconSignupsLostWorking());
	}
	if (/\b(source|sources|oauth|google|email|method)\b/.test(lower) && /\b(signup|recover|recovery|fix)\b/.test(lower)) {
		return textReply(beaconSignupsSourcesExplanation(), beaconSignupsSourcesWorking());
	}
	if (/\bmedian\b/.test(lower) && /\bsession/.test(lower)) {
		return textReply(beaconSessionsMedianExplanation(), beaconSessionsMedianWorking());
	}
	if (/\b(enterprise|plan|plans|dogfood|employee|internal)\b/.test(lower) && /\b(session|top\s*10|longest)\b/.test(lower)) {
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

export function genericWorking(kind: "greeting" | "slack" | "memory_meta" | "fallback"): ChatWorking {
	if (kind === "greeting") {
		return {
			sql: [],
			assumptions: [
				"No warehouse query needed for a greeting.",
				"Scoped to the Beacon workspace for this login.",
			],
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
		};
	}
	if (kind === "memory_meta") {
		return {
			sql: [
				`SELECT count(*) AS confirmed FROM memories;`,
				`SELECT count(*) AS proposed FROM proposed_memories;`,
			],
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
