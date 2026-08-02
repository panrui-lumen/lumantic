export function ConversionChart({ idPrefix = "chart" }: { idPrefix?: string } = {}) {
	// viewBox 0 0 500 236 — taller plot, tighter labels on the right
	// weeks at x: 68, 168, 268, 368
	// y scale: 75% → 32, 45% → 182  (5px per %)
	const xs = [68, 168, 268, 368];
	const toY = (pct: number) => 32 + (75 - pct) * 5;
	const plotBottom = toY(45);

	const desktop = [70, 71, 72, 71].map((p, i) => ({ x: xs[i], y: toY(p) }));
	const ios = [66, 67, 66, 67].map((p, i) => ({ x: xs[i], y: toY(p) }));
	const mobile = [69, 70, 68, 51].map((p, i) => ({ x: xs[i], y: toY(p) }));

	const smooth = (pts: { x: number; y: number }[]) => {
		if (pts.length < 2) return "";
		let d = `M ${pts[0].x} ${pts[0].y}`;
		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = pts[i];
			const p1 = pts[i + 1];
			const cx = (p0.x + p1.x) / 2;
			d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
		}
		return d;
	};

	const mobileArea = `${smooth(mobile)} L ${mobile[mobile.length - 1].x} ${plotBottom} L ${mobile[0].x} ${plotBottom} Z`;

	const endLabels = [
		{
			y: desktop[3].y - 8,
			anchorY: desktop[3].y,
			name: "desktop",
			value: "71%",
			note: "flat",
			width: 92,
			noteColor: "rgba(184,160,255,0.45)",
			bg: "rgba(52,211,153,0.12)",
			stroke: "rgba(52,211,153,0.35)",
			nameColor: "#6ee7b7",
			valueColor: "#6ee7b7",
		},
		{
			y: ios[3].y + 8,
			anchorY: ios[3].y,
			name: "iOS native",
			value: "67%",
			note: "flat",
			width: 108,
			noteColor: "rgba(184,160,255,0.45)",
			bg: "rgba(125,211,252,0.12)",
			stroke: "rgba(125,211,252,0.35)",
			nameColor: "#7dd3fc",
			valueColor: "#7dd3fc",
		},
		{
			y: mobile[3].y,
			anchorY: mobile[3].y,
			name: "mobile_web",
			value: "51%",
			note: "↓17pp",
			width: 112,
			noteColor: "#fb7185",
			bg: "rgba(251,113,133,0.14)",
			stroke: "rgba(251,113,133,0.4)",
			nameColor: "#fda4af",
			valueColor: "#fb7185",
		},
	];

	const labelX = 384;

	return (
		<div className="mt-4 overflow-hidden rounded-xl border border-violet-400/20 bg-gradient-to-b from-violet-500/[0.07] to-[#08060f]">
			<div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-1">
				<div>
					<p className="font-display text-sm font-medium text-violet-50">Deposit conversion by platform</p>
					<p className="mt-0.5 font-mono text-[10px] text-violet-400/55">Weekly · 24 Jun – 21 Jul</p>
				</div>
				<span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] text-amber-200/90">
					web-2.14 deploy
				</span>
			</div>

			<svg
				viewBox="0 0 500 236"
				className="h-auto w-full min-h-[220px] sm:min-h-[260px]"
				role="img"
				aria-label="Deposit conversion by platform over four weeks"
			>
				<defs>
					<linearGradient id={`${idPrefix}-mobileFill`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#fb7185" stopOpacity="0.28" />
						<stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
					</linearGradient>
					<linearGradient id={`${idPrefix}-chartFade`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#8457f6" stopOpacity="0.06" />
						<stop offset="100%" stopColor="#08060f" stopOpacity="0" />
					</linearGradient>
					<filter id={`${idPrefix}-lineGlow`} x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="1.4" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				<rect x="40" y="28" width="340" height={plotBottom - 28} fill={`url(#${idPrefix}-chartFade)`} rx="4" />

				{/* horizontal grid */}
				{[75, 60, 45].map((pct) => (
					<g key={pct}>
						<line
							x1="40"
							y1={toY(pct)}
							x2="380"
							y2={toY(pct)}
							stroke="rgba(156,123,255,0.1)"
							strokeWidth="1"
						/>
						<text
							x="34"
							y={toY(pct) + 3}
							fill="rgba(184,160,255,0.4)"
							fontSize="10"
							fontFamily="JetBrains Mono, monospace"
							textAnchor="end"
						>
							{pct}%
						</text>
					</g>
				))}

				{/* x labels */}
				{["24–30 Jun", "1–7 Jul", "8–14 Jul", "15–21 Jul"].map((label, i) => (
					<text
						key={label}
						x={xs[i]}
						y="214"
						fill="rgba(184,160,255,0.4)"
						fontSize="10"
						fontFamily="JetBrains Mono, monospace"
						textAnchor="middle"
					>
						{label}
					</text>
				))}

				{/* deploy marker at last week */}
				<line
					x1={xs[3]}
					y1="28"
					x2={xs[3]}
					y2={plotBottom}
					stroke="rgba(251,191,36,0.35)"
					strokeWidth="1.5"
					strokeDasharray="4 4"
				/>

				{/* area under mobile drop */}
				<path d={mobileArea} fill={`url(#${idPrefix}-mobileFill)`} />

				{/* secondary series */}
				<path
					d={smooth(desktop)}
					fill="none"
					stroke="#34d399"
					strokeWidth="1.25"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity="0.85"
				/>
				<path
					d={smooth(ios)}
					fill="none"
					stroke="#7dd3fc"
					strokeWidth="1.25"
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity="0.85"
				/>

				{/* primary series with glow */}
				<path
					d={smooth(mobile)}
					fill="none"
					stroke="#fb7185"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					filter={`url(#${idPrefix}-lineGlow)`}
				/>

				{/* points */}
				{desktop.map((p) => (
					<circle key={`d-${p.x}`} cx={p.x} cy={p.y} r="2.5" fill="#0a0814" stroke="#34d399" strokeWidth="1.25" />
				))}
				{ios.map((p) => (
					<circle key={`i-${p.x}`} cx={p.x} cy={p.y} r="2.5" fill="#0a0814" stroke="#7dd3fc" strokeWidth="1.25" />
				))}
				{mobile.map((p, i) => (
					<circle
						key={`m-${p.x}`}
						cx={p.x}
						cy={p.y}
						r={i === 3 ? 3.5 : 2.5}
						fill="#0a0814"
						stroke="#fb7185"
						strokeWidth={i === 3 ? 1.5 : 1.25}
					/>
				))}

				{/* end labels beside last points */}
				{endLabels.map((label) => (
					<g key={label.name}>
						<line
							x1={xs[3] + 6}
							y1={label.anchorY}
							x2={labelX - 4}
							y2={label.y}
							stroke={label.stroke}
							strokeWidth="1"
							strokeDasharray="2 3"
							opacity="0.7"
						/>
						<rect
							x={labelX}
							y={label.y - 7}
							width={label.width}
							height="14"
							rx="7"
							fill={label.bg}
							stroke={label.stroke}
							strokeWidth="1"
						/>
						<text x={labelX + 8} y={label.y + 2} fontSize="8" fontFamily="JetBrains Mono, monospace">
							<tspan fill={label.nameColor}>{label.name}</tspan>
							<tspan fill="rgba(184,160,255,0.35)">{" "}</tspan>
							<tspan fill={label.valueColor} fontWeight="600">
								{label.value}
							</tspan>
							<tspan fill="rgba(184,160,255,0.35)">{" "}</tspan>
							<tspan fill={label.noteColor}>{label.note}</tspan>
						</text>
					</g>
				))}
			</svg>
		</div>
	);
}
