import type { ReactNode } from "react";
import {
	DatabaseIcon,
	DatadogIcon,
	GitHubIcon,
	GitLabIcon,
	IncidentIoIcon,
	LaunchDarklyIcon,
	MixpanelIcon,
	SegmentIcon,
	SentryIcon,
	SlackIcon,
} from "../../components/Icons";
import type { ChatConnector } from "../../../shared/beacon-analytics";
import { Tooltip } from "./ui";

export type ConnectorCategory = "collaboration" | "code" | "data" | "events" | "flags" | "incidents" | "warehouse";

export const CONNECTOR_CATEGORY_META: Record<
	ConnectorCategory,
	{ label: string; description: string }
> = {
	collaboration: {
		label: "Collaboration",
		description: "Where teammates ask Lumantic and review proposed memories.",
	},
	code: {
		label: "Code",
		description: "Repos and merge history so answers can pinpoint PR-introduced issues and suggest fixes.",
	},
	data: {
		label: "Data",
		description: "APM, errors, and crash telemetry for reliability-backed product answers.",
	},
	events: {
		label: "Events",
		description: "Product analytics streams and funnels for journey and activation questions.",
	},
	flags: {
		label: "Feature flags",
		description: "Rollout and targeting changes that may explain crashes or metric dips.",
	},
	incidents: {
		label: "Incidents",
		description: "Official outage timelines and severity from your incident tooling.",
	},
	warehouse: {
		label: "Warehouse",
		description: "Warehouses and databases Lumantic queries for metrics and cohorts.",
	},
};

export const CONNECTOR_META: Record<
	ChatConnector,
	{
		label: string;
		icon: (className: string) => ReactNode;
		className: string;
		blurb: string;
		category: ConnectorCategory;
	}
> = {
	slack: {
		label: "Slack",
		icon: (c) => <SlackIcon className={c} />,
		className: "border-[#4A154B]/35 bg-white/[0.06] text-violet-50",
		blurb:
			"Slack lets teammates ask Lumantic in channels and review proposed memories where the team already works.",
		category: "collaboration",
	},
	github: {
		label: "GitHub",
		icon: (c) => <GitHubIcon className={c} />,
		className: "border-white/15 bg-white/[0.06] text-violet-50",
		blurb:
			"GitHub lets Lumantic pinpoint issues introduced in PRs, tie outages to deploys, and keep metric definitions in sync with analytics code.",
		category: "code",
	},
	gitlab: {
		label: "GitLab",
		icon: (c) => <GitLabIcon className={c} />,
		className: "border-[#FC6D26]/35 bg-[#FC6D26]/15 text-orange-100",
		blurb:
			"GitLab lets Lumantic trace merge requests and pipelines that introduced regressions, same as GitHub for teams on GitLab.",
		category: "code",
	},
	datadog: {
		label: "Datadog",
		icon: (c) => <DatadogIcon className={c} />,
		className: "border-violet-400/25 bg-[#632CA6]/25 text-violet-100",
		blurb:
			"Datadog gives Lumantic live APM and SLO context so it can explain error spikes, latency, and why product metrics dipped during incidents.",
		category: "data",
	},
	sentry: {
		label: "Sentry",
		icon: (c) => <SentryIcon className={c} />,
		className: "border-[#362D59]/40 bg-[#362D59]/35 text-violet-50",
		blurb:
			"Sentry tells Lumantic which users crashed and on which page, so reliability questions cite real exception data instead of guesswork.",
		category: "data",
	},
	segment: {
		label: "Segment",
		icon: (c) => <SegmentIcon className={c} />,
		className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
		blurb:
			"Segment feeds Lumantic the product event stream so it can answer which events fire most, how journeys look, and what users did before conversion.",
		category: "events",
	},
	mixpanel: {
		label: "Mixpanel",
		icon: (c) => <MixpanelIcon className={c} />,
		className: "border-[#7856FF]/40 bg-[#7856FF]/15 text-violet-50",
		blurb:
			"Mixpanel lets Lumantic answer activation and funnel questions with the board definitions your growth team already trusts.",
		category: "events",
	},
	launchdarkly: {
		label: "LaunchDarkly",
		icon: (c) => <LaunchDarklyIcon className={c} />,
		className: "border-[#405BFF]/40 bg-[#405BFF]/15 text-sky-100",
		blurb:
			"LaunchDarkly lets Lumantic spot issues caused by feature flag changes: bad rollouts, targeting mistakes, and kill switches that line up with crashes or metric dips.",
		category: "flags",
	},
	incident_io: {
		label: "incident.io",
		icon: (c) => <IncidentIoIcon className={c} />,
		className: "border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-100",
		blurb:
			"incident.io gives Lumantic official incident timelines and severity so it can explain outages with the same record your responders used.",
		category: "incidents",
	},
	warehouse: {
		label: "Warehouse",
		icon: (c) => <DatabaseIcon className={c} />,
		className: "border-sky-500/25 bg-sky-500/10 text-sky-100",
		blurb:
			"Your warehouse is Lumantic's source of truth for product metrics: signups, sessions, funnels, and cohort breakdowns from your tables.",
		category: "warehouse",
	},
};

/** Demo catalog connectors (connect/disconnect without a full settings API). */
export const CATALOG_CONNECTORS = [
	"gitlab",
	"sentry",
	"segment",
	"mixpanel",
	"launchdarkly",
	"incident_io",
] as const satisfies readonly ChatConnector[];

export const CONNECTOR_CATEGORY_ORDER: ConnectorCategory[] = [
	"collaboration",
	"code",
	"data",
	"events",
	"flags",
	"incidents",
	"warehouse",
];

export function catalogConnectorsInCategory(category: ConnectorCategory): ChatConnector[] {
	return CATALOG_CONNECTORS.filter((id) => CONNECTOR_META[id].category === category);
}

export function ConnectorPills({ connectors }: { connectors: ChatConnector[] }) {
	if (connectors.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className="text-[11px] font-medium tracking-wide text-violet-400/45 uppercase">Used</span>
			{connectors.map((id) => {
				const meta = CONNECTOR_META[id];
				if (!meta) return null;
				return (
					<Tooltip
						key={id}
						content={<span className="block max-w-[16rem] font-normal leading-snug">{meta.blurb}</span>}
					>
						<span
							className={`inline-flex cursor-help items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
						>
							{meta.icon("size-3.5")}
							{meta.label}
						</span>
					</Tooltip>
				);
			})}
		</div>
	);
}
