import type { MouseEvent, ReactNode } from "react";
import { SparkleIcon } from "../../components/Icons";
import { useSelfAvatar } from "./selfAvatar";
import { Tooltip, initials } from "./ui";
import { normalizeProfileName, openUserProfile } from "./userProfile";

type UserChipProps = {
	name: string;
	/** Override visible text (defaults to name). Profile still opens for `name`. */
	label?: string;
	initialsText?: string;
	size?: "xs" | "sm" | "md";
	showAvatar?: boolean;
	trailing?: ReactNode;
	className?: string;
	avatarClassName?: string;
	/** Use muted text styles for dense metadata rows. */
	muted?: boolean;
};

const sizeStyles = {
	xs: {
		gap: "gap-1.5",
		avatar: "size-4 text-[9px]",
		text: "text-[11px]",
		icon: "size-2.5",
	},
	sm: {
		gap: "gap-2",
		avatar: "size-6 text-[10px]",
		text: "text-xs",
		icon: "size-3",
	},
	md: {
		gap: "gap-2.5",
		avatar: "size-9 text-xs",
		text: "text-sm",
		icon: "size-4",
	},
} as const;

export function UserChip({
	name,
	label,
	initialsText,
	size = "sm",
	showAvatar = true,
	trailing,
	className = "",
	avatarClassName = "",
	muted = false,
}: UserChipProps) {
	const self = useSelfAvatar();
	const styles = sizeStyles[size];
	const isAi = normalizeProfileName(name) === "lumantic";
	const mark = initialsText || initials(name) || "?";
	const isYou = normalizeProfileName(label ?? "") === "you";
	const text = label ?? name;
	const selfAvatar =
		self.avatarUrl && self.name && normalizeProfileName(self.name) === normalizeProfileName(name)
			? self.avatarUrl
			: null;

	function handleClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		openUserProfile(name);
	}

	return (
		<Tooltip content={`View ${name}'s profile`}>
			<button
				type="button"
				onClick={handleClick}
				aria-label={`View ${name}'s profile`}
				className={`inline-flex max-w-full min-w-0 items-center ${styles.gap} rounded-md text-left transition hover:text-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none ${
					muted ? "text-violet-400/55 hover:text-violet-200" : "text-violet-200/80"
				} ${className}`}
			>
				{showAvatar &&
					(selfAvatar ? (
						<img src={selfAvatar} alt="" className={`${styles.avatar} shrink-0 rounded-full object-cover`} />
					) : (
						<span
							className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${styles.avatar} ${
								avatarClassName
									? avatarClassName
									: isAi
										? "bg-gradient-to-br from-violet-400 to-fuchsia-600 text-white"
										: size === "xs"
											? "bg-white/10 text-violet-200"
											: "bg-gradient-to-br from-violet-500 to-violet-700 text-white"
							}`}
						>
							{isAi ? <SparkleIcon className={styles.icon} /> : mark}
						</span>
					))}
				<span className={`inline-flex min-w-0 items-center ${styles.gap} ${styles.text}`}>
					{isYou ? (
						<span className="inline-flex shrink-0 items-center rounded-full border border-violet-400/30 bg-violet-500/20 px-1.5 py-px text-[10px] font-semibold tracking-wide text-violet-100">
							You
						</span>
					) : (
						<span className="min-w-0 truncate font-medium">{text}</span>
					)}
					{trailing}
				</span>
			</button>
		</Tooltip>
	);
}
