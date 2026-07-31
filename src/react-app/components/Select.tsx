import {
	forwardRef,
	type ReactNode,
	type SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "./Icons";

const SIZE_CLASS = {
	md: "py-2 pr-9 pl-3 text-sm",
	sm: "py-1.5 pr-7 pl-2.5 text-xs",
} as const;

const SIZE_CLASS_LEADING = {
	md: "py-2 pr-9 pl-8 text-sm",
	sm: "py-1.5 pr-7 pl-7 text-xs",
} as const;

const CHEVRON_CLASS = {
	md: "right-2.5 size-3.5",
	sm: "right-2 size-3",
} as const;

const LEADING_CLASS = {
	md: "left-3",
	sm: "left-2.5",
} as const;

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "className"> & {
	/** Extra classes on the native `<select>` (width, text size overrides, etc.). */
	className?: string;
	/** Extra classes on the outer wrapper (layout width). */
	wrapperClassName?: string;
	size?: keyof typeof SIZE_CLASS;
	/** Optional left icon inside the control. */
	leading?: ReactNode;
	children: ReactNode;
};

/**
 * The one dropdown for Lumantic UI. Caret is always pinned to the right edge.
 * Do not hand-roll `<select>` + ChevronDown elsewhere.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
	{ className = "", wrapperClassName = "", size = "md", leading, disabled, children, ...props },
	ref,
) {
	return (
		<div className={`relative inline-flex min-w-0 ${wrapperClassName}`}>
			{leading ? (
				<span
					className={`pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-violet-400/50 ${LEADING_CLASS[size]} ${
						disabled ? "opacity-40" : ""
					}`}
				>
					{leading}
				</span>
			) : null}
			<select
				ref={ref}
				disabled={disabled}
				className={`w-full cursor-pointer appearance-none rounded-lg border border-violet-500/20 bg-white/[0.03] text-violet-100 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
					leading ? SIZE_CLASS_LEADING[size] : SIZE_CLASS[size]
				} ${className}`}
				{...props}
			>
				{children}
			</select>
			<ChevronDown
				className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-violet-400/50 ${CHEVRON_CLASS[size]} ${
					disabled ? "opacity-40" : ""
				}`}
			/>
		</div>
	);
});
