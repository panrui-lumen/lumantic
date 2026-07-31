import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: ReactNode }) {
	return (
		<TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={100}>
			{children}
		</TooltipPrimitive.Provider>
	);
}

export function Tooltip({
	content,
	children,
	side = "top",
}: {
	content: ReactNode;
	children: ReactNode;
	side?: "top" | "bottom" | "left" | "right";
}) {
	return (
		<TooltipPrimitive.Root>
			<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
			<TooltipPrimitive.Portal>
				<TooltipPrimitive.Content
					side={side}
					sideOffset={6}
					className="z-50 rounded-lg border border-violet-500/25 bg-ink px-2.5 py-1.5 text-xs font-medium text-violet-100 shadow-lg data-[state=delayed-open]:animate-rise"
				>
					{content}
					<TooltipPrimitive.Arrow className="fill-violet-500/25" />
				</TooltipPrimitive.Content>
			</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
	);
}
