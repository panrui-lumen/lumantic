import type { ReactNode } from "react";

/** Animated gradient border + soft glow (Theo Soti conic-gradient technique). */
export function GlowCta({
	children,
	className = "",
	fullWidth = false,
	rounded = "rounded-full",
}: {
	children: ReactNode;
	className?: string;
	fullWidth?: boolean;
	rounded?: string;
}) {
	return (
		<span className={`glow-cta relative z-0 cursor-pointer ${fullWidth ? "flex w-full" : "inline-flex"} ${rounded} ${className}`}>
			{children}
		</span>
	);
}
