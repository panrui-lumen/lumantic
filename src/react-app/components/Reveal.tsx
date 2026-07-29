import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

export function Reveal({
	children,
	className = "",
	delay = 0,
	as: Tag = "div",
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
	as?: "div" | "section" | "span";
}) {
	const { ref, isVisible } = useReveal<HTMLDivElement>();

	return (
		<Tag
			ref={ref as never}
			className={`reveal ${isVisible ? "is-visible" : ""} ${className}`}
			style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
		>
			{children}
		</Tag>
	);
}
