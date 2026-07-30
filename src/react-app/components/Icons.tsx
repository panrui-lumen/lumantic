export function MailIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<rect x="3" y="5" width="18" height="14" rx="2.5" />
			<path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function CloseIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
		</svg>
	);
}

export function SpinnerIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
			<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
		</svg>
	);
}

export function ChevronLeft({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ChevronRight({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ChevronDown({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ArrowRight({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M4 12h16M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function CheckIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2.2}>
			<path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function SearchIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<circle cx="11" cy="11" r="7" />
			<path d="m21 21-4.35-4.35" strokeLinecap="round" />
		</svg>
	);
}

export function LockIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<rect x="5" y="11" width="14" height="9" rx="2" />
			<path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
		</svg>
	);
}

export function LogOutIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function SlackIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<path
				fill="#E01E5A"
				d="M6.2 15.2a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2h2v2zm1 0a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5z"
			/>
			<path
				fill="#36C5F0"
				d="M8.8 6.2a2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2v2h-2zm0 1a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5z"
			/>
			<path
				fill="#2EB67D"
				d="M17.8 8.8a2 2 0 0 1 2-2 2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2v-2zm-1 0a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1 2 2v5z"
			/>
			<path
				fill="#ECB22E"
				d="M15.2 17.8a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2h2zm0-1a2 2 0 0 1-2-2 2 2 0 0 1 2-2h5a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-5z"
			/>
		</svg>
	);
}
