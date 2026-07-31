import { parseChatArtifact, parseChatWorking } from "../beacon-analytics";

describe("parseChatArtifact", () => {
	it("returns null for empty or invalid input", () => {
		expect(parseChatArtifact(null)).toBeNull();
		expect(parseChatArtifact(undefined)).toBeNull();
		expect(parseChatArtifact("")).toBeNull();
		expect(parseChatArtifact("{")).toBeNull();
		expect(parseChatArtifact(JSON.stringify({ type: "unknown" }))).toBeNull();
	});

	it("parses known artifact types", () => {
		const chart = {
			type: "signups_chart",
			title: "Signups",
			unit: "signups",
			points: [{ label: "Feb 1", value: 10 }],
		};
		expect(parseChatArtifact(JSON.stringify(chart))).toEqual(chart);

		const pie = {
			type: "pie_chart",
			title: "Mix",
			slices: [{ label: "A", value: 1 }],
		};
		expect(parseChatArtifact(JSON.stringify(pie))).toEqual(pie);

		const area = {
			type: "area_chart",
			title: "Trend",
			unit: "workspaces",
			points: [{ label: "W1", value: 10 }],
		};
		expect(parseChatArtifact(JSON.stringify(area))).toEqual(area);

		const stacked = {
			type: "stacked_bar_chart",
			title: "Plans",
			unit: "sessions",
			series: [{ key: "starter", label: "Starter" }],
			rows: [{ label: "W1", values: { starter: 1 } }],
		};
		expect(parseChatArtifact(JSON.stringify(stacked))).toEqual(stacked);
	});

	it("accepts code_fix artifacts", () => {
		const fix = {
			type: "code_fix",
			title: "Guard null feature_key",
			repo: "beacon/beacon-web",
			path: "src/web/charts/SignalsChart.tsx",
			language: "ts",
			snippet: "export function SignalsChart() {}",
			prTitle: "fix: guard null feature_key",
			prUrl: "https://github.com/beacon/beacon-web/compare/main...fix/x",
		};
		expect(parseChatArtifact(JSON.stringify(fix))).toEqual(fix);
	});
});

describe("parseChatWorking", () => {
	it("returns null without sql/assumptions arrays", () => {
		expect(parseChatWorking(null)).toBeNull();
		expect(parseChatWorking(JSON.stringify({ sql: "x", assumptions: [] }))).toBeNull();
		expect(parseChatWorking(JSON.stringify({ sql: [], assumptions: "x" }))).toBeNull();
	});

	it("keeps valid connectors and drops unknown ones", () => {
		const working = parseChatWorking(
			JSON.stringify({
				sql: ["select 1"],
				assumptions: ["demo"],
				connectors: [
					"github",
					"gitlab",
					"nope",
					"datadog",
					"segment",
					"mixpanel",
					"sentry",
					"incident_io",
					"launchdarkly",
				],
			}),
		);
		expect(working).toEqual({
			sql: ["select 1"],
			assumptions: ["demo"],
			connectors: ["github", "gitlab", "datadog", "segment", "mixpanel", "sentry", "incident_io", "launchdarkly"],
		});
	});

	it("omits connectors when none are valid", () => {
		const working = parseChatWorking(
			JSON.stringify({
				sql: [],
				assumptions: ["none"],
				connectors: ["nope"],
			}),
		);
		expect(working).toEqual({ sql: [], assumptions: ["none"] });
	});
});
