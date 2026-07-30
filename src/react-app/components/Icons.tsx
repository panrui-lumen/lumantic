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

export function PlusIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M12 5v14M5 12h14" strokeLinecap="round" />
		</svg>
	);
}

export function TrashIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-.8 12.2A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-1.8L6 7" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M10 11v6M14 11v6" strokeLinecap="round" />
		</svg>
	);
}

export function PencilIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path
				d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function SendIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function SparkleIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M12 2.5c.4 3.1 1.1 5.2 2.3 6.4 1.2 1.2 3.3 1.9 6.4 2.3-3.1.4-5.2 1.1-6.4 2.3-1.2 1.2-1.9 3.3-2.3 6.4-.4-3.1-1.1-5.2-2.3-6.4-1.2-1.2-3.3-1.9-6.4-2.3 3.1-.4 5.2-1.1 6.4-2.3 1.2-1.2 1.9-3.3 2.3-6.4Z" />
		</svg>
	);
}

export function UserIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<circle cx="12" cy="8" r="3.5" />
			<path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
		</svg>
	);
}

export function HashIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function GearIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<circle cx="12" cy="12" r="3.2" />
			<path
				d="M12 3.5v1.8M12 18.7v1.8M20.5 12h-1.8M5.3 12H3.5M17.7 6.3l-1.3 1.3M7.6 16.1l-1.3 1.3M17.7 17.7l-1.3-1.3M7.6 7.9 6.3 6.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function BrainIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<path
				d="M9 4.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 0 1.5 4.4A2.5 2.5 0 0 0 9 18V4.5Z"
				strokeLinejoin="round"
			/>
			<path
				d="M15 4.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1 2 4 2.5 2.5 0 0 1-1.5 4.4A2.5 2.5 0 0 1 15 18V4.5Z"
				strokeLinejoin="round"
			/>
			<path d="M9 8h6M9 12h6M9 15.5h6" strokeLinecap="round" />
		</svg>
	);
}

export function InboxIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<path d="M4 12h4l2 3h4l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M5.5 5h13l2 7v6a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18v-6l2-7Z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ChatIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<path
				d="M4 5.5h16v11a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5Z"
				transform="translate(0.5 0)"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function MenuIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
		</svg>
	);
}

export function LinkIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path
				d="M9.5 14.5 14.5 9.5M8 17H6.5A4.5 4.5 0 0 1 6.5 8H8M16 7h1.5a4.5 4.5 0 0 1 0 9H16"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function AlertIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M12 9v4.5M12 17h.01" strokeLinecap="round" />
			<path d="M10.3 3.9 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
		</svg>
	);
}

export function UsersIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<circle cx="9" cy="8" r="3" />
			<path d="M2.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
			<path d="M16 8a3 3 0 1 1 0-6M15 14.2a6.5 6.5 0 0 1 6 5.8" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function CreditCardIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<rect x="2.5" y="5.5" width="19" height="13" rx="2.2" />
			<path d="M2.5 10h19" strokeLinecap="round" />
			<path d="M6 14.5h4" strokeLinecap="round" />
		</svg>
	);
}

export function GlobeIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<circle cx="12" cy="12" r="9" />
			<path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" strokeLinecap="round" />
		</svg>
	);
}

export function LifeBuoyIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.7}>
			<circle cx="12" cy="12" r="9" />
			<circle cx="12" cy="12" r="3.5" />
			<path d="m6.3 6.3 3.5 3.5M17.7 6.3l-3.5 3.5M6.3 17.7l3.5-3.5M17.7 17.7l-3.5-3.5" strokeLinecap="round" />
		</svg>
	);
}

export function ChevronUpIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function DownloadIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M12 4v11m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ExternalLinkIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M9 6H6.5A2.5 2.5 0 0 0 4 8.5v9A2.5 2.5 0 0 0 6.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M14 4h6v6M20 4l-9 9" strokeLinecap="round" strokeLinejoin="round" />
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

export function MoreHorizontalIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
			<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
			<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
			<circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function PinIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M12 17v5M9 3l.5 2.5L7 9.5a3 3 0 0 0 2 4.5h6a3 3 0 0 0 2-4.5L14.5 5.5 15 3H9z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ArchiveIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M3 7.5h18v3H3v-3zM5 10.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5M10 14h4" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
