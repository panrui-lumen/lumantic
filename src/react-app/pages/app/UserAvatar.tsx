import { initials } from "./ui";

export function UserAvatar({
	name,
	avatarUrl,
	sizeClass = "size-8",
	textClass = "text-xs",
	className = "",
}: {
	name: string;
	avatarUrl?: string | null;
	sizeClass?: string;
	textClass?: string;
	className?: string;
}) {
	if (avatarUrl) {
		return <img src={avatarUrl} alt="" className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`} />;
	}

	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 font-semibold text-white ${sizeClass} ${textClass} ${className}`}
		>
			{initials(name)}
		</span>
	);
}
