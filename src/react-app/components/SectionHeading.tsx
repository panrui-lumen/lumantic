import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
	eyebrow,
	title,
	subtitle,
	align = "left",
}: {
	eyebrow?: string;
	title: ReactNode;
	subtitle?: ReactNode;
	align?: "left" | "center";
}) {
	return (
		<Reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
			{eyebrow && (
				<span className="font-mono text-[11px] tracking-[0.2em] text-violet-400/70 uppercase">{eyebrow}</span>
			)}
			<h2
				className={`font-display text-3xl leading-tight font-semibold tracking-tight text-violet-50 sm:text-4xl ${eyebrow ? "mt-3" : ""}`}
			>
				{title}
			</h2>
			{subtitle && <p className="mt-4 text-base text-violet-200/65 sm:text-lg">{subtitle}</p>}
		</Reveal>
	);
}
