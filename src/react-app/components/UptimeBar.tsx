export type UptimeDayStatus = "operational" | "degraded" | "outage" | "none";

export type UptimeDay = {
	date: string;
	status: UptimeDayStatus;
	sampleCount: number;
	okCount: number;
};

const DAY_BAR: Record<UptimeDayStatus, { className: string; label: string }> = {
	operational: { className: "bg-emerald-400/90", label: "Operational" },
	degraded: { className: "bg-amber-300/90", label: "Degraded" },
	outage: { className: "bg-rose-400/90", label: "Outage" },
	none: { className: "bg-violet-500/20", label: "No data" },
};

function formatDayLabel(isoDate: string) {
	try {
		const date = new Date(`${isoDate}T12:00:00Z`);
		return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return isoDate;
	}
}

export function UptimeBar({
	days,
	windowDays,
	compact = false,
}: {
	days: UptimeDay[];
	windowDays: number;
	compact?: boolean;
}) {
	const bars =
		days.length > 0
			? days
			: Array.from({ length: windowDays }, (_, i) => ({
					date: `day-${i}`,
					status: "none" as const,
					sampleCount: 0,
					okCount: 0,
				}));

	return (
		<div>
			<div
				className={`flex w-full items-stretch gap-px ${compact ? "h-6" : "h-8 sm:h-9"}`}
				role="img"
				aria-label={`Uptime for the last ${windowDays} days`}
			>
				{bars.map((day) => {
					const tone = DAY_BAR[day.status];
					const title =
						day.sampleCount > 0
							? `${formatDayLabel(day.date)}: ${tone.label} (${day.okCount}/${day.sampleCount} checks)`
							: `${day.date.startsWith("day-") ? "No data" : formatDayLabel(day.date)}: ${tone.label}`;
					return (
						<div
							key={day.date}
							title={title}
							className={`min-w-0 flex-1 rounded-[2px] transition hover:brightness-125 ${tone.className}`}
						/>
					);
				})}
			</div>
			<div className="mt-2 flex items-center justify-between text-[11px] text-violet-400/45">
				<span>{windowDays} days ago</span>
				<span>Today</span>
			</div>
		</div>
	);
}
