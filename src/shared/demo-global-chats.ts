import {
	beaconActiveWorkspacesArea,
	beaconActiveWorkspacesExplanation,
	beaconActiveWorkspacesWorking,
	beaconActivationFunnelExplanation,
	beaconActivationFunnelStacked,
	beaconActivationFunnelWorking,
	beaconCrashesExplanation,
	beaconCrashesSandboxExplanation,
	beaconCrashesSandboxWorking,
	beaconCrashesSignalsFollowupExplanation,
	beaconCrashesSignalsFollowupWorking,
	beaconCrashesTable,
	beaconCrashesWorking,
	beaconLongestSessions,
	beaconLongestSessionsExplanation,
	beaconLongestSessionsWorking,
	beaconOutageExplanation,
	beaconOutageWorking,
	beaconScoreFilterExplanation,
	beaconScoreFilterWorking,
	beaconSessionEventsExplanation,
	beaconSessionEventsWorking,
	beaconSessionsByPlanExplanation,
	beaconSessionsByPlanStacked,
	beaconSessionsByPlanWorking,
	beaconSessionsMedianExplanation,
	beaconSessionsMedianWorking,
	beaconSessionsPlanExplanation,
	beaconSessionsPlanWorking,
	beaconSignupMixExplanation,
	beaconSignupMixPie,
	beaconSignupMixWorking,
	beaconSignupsChart,
	beaconSignupsExplanation,
	beaconSignupsLostExplanation,
	beaconSignupsLostWorking,
	beaconSignupsSourcesExplanation,
	beaconSignupsSourcesWorking,
	beaconSignupsWorking,
	beaconSignalsCrashIssueExplanation,
	beaconSignalsCrashIssueWorking,
	beaconSignalsCrashPreventExplanation,
	beaconSignalsCrashPreventFix,
	beaconSignalsCrashPreventWorking,
	beaconTopEventsExplanation,
	beaconTopEventsPie,
	beaconTopEventsWorking,
	memoryLookupWorking,
} from "./beacon-analytics";

export type DemoGlobalChatMessage = {
	role: "user" | "assistant";
	content: string;
	suggested_memory?: string | null;
	artifact?: unknown | null;
	working?: unknown | null;
};

export type DemoGlobalChat = {
	id: number;
	title: string;
	authorName: string;
	authorSlackUsername: string | null;
	sourceKind: "app" | "slack";
	sourceChannel: string | null;
	/** Hours ago for timestamps */
	agoHours: number;
	/** If true, set last_read_at far in the past so API marks unread */
	startUnread?: boolean;
	messages: DemoGlobalChatMessage[];
};

export const DEMO_FIXTURE_ID_TO_CONVERSATION_ID: Record<string, number> = {
	g1: 9001,
	g2: 9002,
	g3: 9003,
	g4: 9004,
	g5: 9005,
	g6: 9006,
	g7: 9007,
	g8: 9008,
	g9: 9009,
	g10: 9010,
	g11: 9011,
	g12: 9012,
};

export function getDemoGlobalChats(): DemoGlobalChat[] {
	return [
		{
			id: 9001,
			title: "Why did signups drop off in March?",
			authorName: "Priya Nair",
			authorSlackUsername: "priya",
			sourceKind: "slack",
			sourceChannel: "data-team",
			agoHours: 2,
			startUnread: false,
			messages: [
				{ role: "user", content: "Why did signups drop off in March?", suggested_memory: null },
				{
					role: "assistant",
					content: beaconSignupsExplanation(),
					suggested_memory: null,
					artifact: beaconSignupsChart(),
					working: beaconSignupsWorking(),
				},
				{
					role: "user",
					content: "How many signups did we lose during the outage?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSignupsLostExplanation(),
					suggested_memory: null,
					working: beaconSignupsLostWorking(),
				},
				{
					role: "user",
					content: "Which signup sources recovered first after the fix?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSignupsSourcesExplanation(),
					suggested_memory: null,
					working: beaconSignupsSourcesWorking(),
				},
			],
		},
		{
			id: 9002,
			title: "Top 10 users with the longest sessions",
			authorName: "Sam Rivera",
			authorSlackUsername: "sam",
			sourceKind: "app",
			sourceChannel: null,
			agoHours: 24,
			startUnread: true,
			messages: [
				{
					role: "user",
					content: "Give me top 10 users with the longest sessions",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconLongestSessionsExplanation(),
					suggested_memory: null,
					artifact: beaconLongestSessions(),
					working: beaconLongestSessionsWorking(),
				},
				{
					role: "user",
					content: "What's the median session length for comparison?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSessionsMedianExplanation(),
					suggested_memory: null,
					working: beaconSessionsMedianWorking(),
				},
				{
					role: "user",
					content: "Are any of these on Enterprise, or are they internal dogfood?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSessionsPlanExplanation(),
					suggested_memory: null,
					working: beaconSessionsPlanWorking(),
				},
			],
		},
		{
			id: 9003,
			title: "Which users experienced crashes?",
			authorName: "Jordan Lee",
			authorSlackUsername: "jordan",
			sourceKind: "slack",
			sourceChannel: "data-alerts",
			agoHours: 48,
			startUnread: true,
			messages: [
				{
					role: "user",
					content: "Which users experienced crashes, and what page were they on?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconCrashesExplanation(),
					suggested_memory: null,
					artifact: beaconCrashesTable(),
					working: beaconCrashesWorking(),
				},
				{
					role: "user",
					content: "Is /dashboard/signals still the top crash page?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconCrashesSignalsFollowupExplanation(),
					suggested_memory: null,
					working: beaconCrashesSignalsFollowupWorking(),
				},
				{
					role: "user",
					content: "How many of these crashes were on sandbox orgs?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconCrashesSandboxExplanation(),
					suggested_memory: null,
					working: beaconCrashesSandboxWorking(),
				},
			],
		},
		{
			id: 9004,
			title: "Does the Beacon Score include sandbox orgs?",
			authorName: "Avery Chen",
			authorSlackUsername: "avery",
			sourceKind: "slack",
			sourceChannel: "exec-metrics",
			agoHours: 72,
			messages: [
				{
					role: "user",
					content: "Our Beacon Score jumped overnight. Are sandbox orgs in that number?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content:
						"No. **Beacon Score** always excludes orgs tagged `env = sandbox` and the internal `beacon-dogfood` workspace. If those filters drop, Score can inflate by ~3-5%.",
					suggested_memory: null,
					working: memoryLookupWorking(
						"Beacon Score always excludes orgs tagged env = sandbox and the internal beacon-dogfood workspace.",
					),
				},
				{
					role: "user",
					content: "Where is that sandbox filter enforced?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconScoreFilterExplanation(),
					suggested_memory: null,
					working: beaconScoreFilterWorking(),
				},
			],
		},
		{
			id: 9005,
			title: "What's a Beacon session timeout?",
			authorName: "Sam Rivera",
			authorSlackUsername: "sam",
			sourceKind: "app",
			sourceChannel: null,
			agoHours: 96,
			messages: [
				{
					role: "user",
					content: "How long until a Beacon session ends from idle?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content:
						"A Beacon **session** ends after **30 minutes of idle** with no client events. Background tabs that only emit heartbeats do **not** keep the session alive. Heartbeats aren't Beacon signals.",
					suggested_memory: null,
					working: memoryLookupWorking(
						"A Beacon session ends after 30 minutes of idle with no client events. Heartbeats do not keep the session alive.",
					),
				},
				{
					role: "user",
					content: "What counts as a client event, and does mobile use the same timeout?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSessionEventsExplanation(),
					suggested_memory: null,
					working: beaconSessionEventsWorking(),
				},
			],
		},
		{
			id: 9006,
			title: "Why did the app go down last week?",
			authorName: "Priya Nair",
			authorSlackUsername: "priya",
			sourceKind: "slack",
			sourceChannel: "eng-incidents",
			agoHours: 120,
			messages: [
				{
					role: "user",
					content: "Why did the app go down last week?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconOutageExplanation(),
					suggested_memory:
						"Tue Jul 22 outage: GitHub PR #2041 cached truncated Redis sessions with undefined userId; /v1/session/refresh 500'd until hotfix PR #2048.",
					working: beaconOutageWorking(),
				},
			],
		},
		{
			id: 9007,
			title: "What's our signup mix by source?",
			authorName: "Jordan Lee",
			authorSlackUsername: "jordan",
			sourceKind: "app",
			sourceChannel: null,
			agoHours: 144,
			messages: [
				{
					role: "user",
					content: "What's our signup mix by source this quarter?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSignupMixExplanation(),
					suggested_memory: null,
					artifact: beaconSignupMixPie(),
					working: beaconSignupMixWorking(),
				},
			],
		},
		{
			id: 9008,
			title: "Weekly active Beacon workspaces",
			authorName: "Priya Nair",
			authorSlackUsername: "priya",
			sourceKind: "slack",
			sourceChannel: "data-team",
			agoHours: 168,
			messages: [
				{
					role: "user",
					content: "Show weekly active Beacon workspaces over the last 12 weeks",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconActiveWorkspacesExplanation(),
					suggested_memory: null,
					artifact: beaconActiveWorkspacesArea(),
					working: beaconActiveWorkspacesWorking(),
				},
			],
		},
		{
			id: 9009,
			title: "Sessions by plan over time",
			authorName: "Sam Rivera",
			authorSlackUsername: "sam",
			sourceKind: "app",
			sourceChannel: null,
			agoHours: 192,
			messages: [
				{
					role: "user",
					content: "Break down sessions by plan for the last 6 weeks",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSessionsByPlanExplanation(),
					suggested_memory: null,
					artifact: beaconSessionsByPlanStacked(),
					working: beaconSessionsByPlanWorking(),
				},
			],
		},
		{
			id: 9010,
			title: "Which product events fire most?",
			authorName: "Jordan Lee",
			authorSlackUsername: "jordan",
			sourceKind: "slack",
			sourceChannel: "data-team",
			agoHours: 216,
			messages: [
				{
					role: "user",
					content: "Which product events fire most this week?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconTopEventsExplanation(),
					suggested_memory: null,
					artifact: beaconTopEventsPie(),
					working: beaconTopEventsWorking(),
				},
			],
		},
		{
			id: 9011,
			title: "Beacon activation funnel",
			authorName: "Priya Nair",
			authorSlackUsername: "priya",
			sourceKind: "app",
			sourceChannel: null,
			agoHours: 240,
			messages: [
				{
					role: "user",
					content: "Show the Mixpanel activation funnel for the last 6 weeks",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconActivationFunnelExplanation(),
					suggested_memory: null,
					artifact: beaconActivationFunnelStacked(),
					working: beaconActivationFunnelWorking(),
				},
			],
		},
		{
			id: 9012,
			title: "Prevent the signals chart crash",
			authorName: "Casey Morgan",
			authorSlackUsername: "casey",
			sourceKind: "slack",
			sourceChannel: "eng",
			agoHours: 264,
			messages: [
				{
					role: "user",
					content:
						"Sandbox orgs keep crashing on /dashboard/signals when feature_key is null. What is going on?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSignalsCrashIssueExplanation(),
					suggested_memory: null,
					working: beaconSignalsCrashIssueWorking(),
				},
				{
					role: "user",
					content: "How do we prevent this happening again?",
					suggested_memory: null,
				},
				{
					role: "assistant",
					content: beaconSignalsCrashPreventExplanation(),
					suggested_memory:
						"SignalsChart must filter null feature_key before render; sandbox orgs emit null keys and crash /dashboard/signals without the guard.",
					artifact: beaconSignalsCrashPreventFix(),
					working: beaconSignalsCrashPreventWorking(),
				},
			],
		},
	];
}
