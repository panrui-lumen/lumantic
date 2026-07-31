import incidentIoLogo from "../assets/brands/incident-io.png";

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

export function FlagIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M5 21V4" strokeLinecap="round" />
			<path d="M5 4h11l-1.5 3.5L16 11H5" strokeLinecap="round" strokeLinejoin="round" />
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
			<path
				d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m3 0-.8 12.2A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-1.8L6 7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path d="M10 11v6M14 11v6" strokeLinecap="round" />
		</svg>
	);
}

export function PencilIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
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
			<path
				d="M5.5 5h13l2 7v6a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 18v-6l2-7Z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
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

export function ShareIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<circle cx="18" cy="5" r="2.5" />
			<circle cx="6" cy="12" r="2.5" />
			<circle cx="18" cy="19" r="2.5" />
			<path d="M8.4 13.2 15.6 16.8M15.6 7.2 8.4 10.8" strokeLinecap="round" />
		</svg>
	);
}

export function AlertIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path d="M12 9v4.5M12 17h.01" strokeLinecap="round" />
			<path
				d="M10.3 3.9 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
				strokeLinejoin="round"
			/>
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
			<path
				d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function ExternalLinkIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path
				d="M9 6H6.5A2.5 2.5 0 0 0 4 8.5v9A2.5 2.5 0 0 0 6.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
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

export function GitHubIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
	);
}

export function DatabaseIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden>
			<ellipse cx="12" cy="5" rx="8" ry="3" />
			<path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" strokeLinecap="round" />
			<path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" strokeLinecap="round" />
		</svg>
	);
}

export function DatadogIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<path fill="#632CA6" d="M19.57 17.04l-1.997-1.316-1.665 2.782-1.937-.567-1.706 2.604.087.82 9.274-1.71-.538-5.794zm-8.649-2.498l1.488-.204c.241.108.409.15.697.223.45.117.97.23 1.741-.16.18-.088.553-.43.704-.625l6.096-1.106.622 7.527-10.444 1.882zm11.325-2.712l-.602.115L20.488 0 .789 2.285l2.427 19.693 2.306-.334c-.184-.263-.471-.581-.96-.989-.68-.564-.44-1.522-.039-2.127.53-1.022 3.26-2.322 3.106-3.956-.056-.594-.15-1.368-.702-1.898-.02.22.017.432.017.432s-.227-.289-.34-.683c-.112-.15-.2-.199-.319-.4-.085.233-.073.503-.073.503s-.186-.437-.216-.807c-.11.166-.137.48-.137.48s-.241-.69-.186-1.062c-.11-.323-.436-.965-.343-2.424.6.421 1.924.321 2.44-.439.171-.251.288-.939-.086-2.293-.24-.868-.835-2.16-1.066-2.651l-.028.02c.122.395.374 1.223.47 1.625.293 1.218.372 1.642.234 2.204-.116.488-.397.808-1.107 1.165-.71.358-1.653-.514-1.713-.562-.69-.55-1.224-1.447-1.284-1.883-.062-.477.275-.763.445-1.153-.243.07-.514.192-.514.192s.323-.334.722-.624c.165-.109.262-.178.436-.323a9.762 9.762 0 0 0-.456.003s.42-.227.855-.392c-.318-.014-.623-.003-.623-.003s.937-.419 1.678-.727c.509-.208 1.006-.147 1.286.257.367.53.752.817 1.569.996.501-.223.653-.337 1.284-.509.554-.61.99-.688.99-.688s-.216.198-.274.51c.314-.249.66-.455.66-.455s-.134.164-.259.426l.03.043c.366-.22.797-.394.797-.394s-.123.156-.268.358c.277-.002.838.012 1.056.037 1.285.028 1.552-1.374 2.045-1.55.618-.22.894-.353 1.947.68.903.888 1.609 2.477 1.259 2.833-.294.295-.874-.115-1.516-.916a3.466 3.466 0 0 1-.716-1.562 1.533 1.533 0 0 0-.497-.85s.23.51.23.96c0 .246.03 1.165.424 1.68-.039.076-.057.374-.1.43-.458-.554-1.443-.95-1.604-1.067.544.445 1.793 1.468 2.273 2.449.453.927.186 1.777.416 1.997.065.063.976 1.197 1.15 1.767.306.994.019 2.038-.381 2.685l-1.117.174c-.163-.045-.273-.068-.42-.153.08-.143.241-.5.243-.572l-.063-.111c-.348.492-.93.97-1.414 1.245-.633.359-1.363.304-1.838.156-1.348-.415-2.623-1.327-2.93-1.566 0 0-.01.191.048.234.34.383 1.119 1.077 1.872 1.56l-1.605.177.759 5.908c-.337.048-.39.071-.757.124-.325-1.147-.946-1.895-1.624-2.332-.599-.384-1.424-.47-2.214-.314l-.05.059a2.851 2.851 0 0 1 1.863.444c.654.413 1.181 1.481 1.375 2.124.248.822.42 1.7-.248 2.632-.476.662-1.864 1.028-2.986.237.3.481.705.876 1.25.95.809.11 1.577-.03 2.106-.574.452-.464.69-1.434.628-2.456l.714-.104.258 1.834 11.827-1.424zM15.05 6.848c-.034.075-.085.125-.007.37l.004.014.013.032.032.073c.14.287.295.558.552.696.067-.011.136-.019.207-.023.242-.01.395.028.492.08.009-.048.01-.119.005-.222-.018-.364.072-.982-.626-1.308-.264-.122-.634-.084-.757.068a.302.302 0 0 1 .058.013c.186.066.06.13.027.207m1.958 3.392c-.092-.05-.52-.03-.821.005-.574.068-1.193.267-1.328.372-.247.191-.135.523.047.66.511.382.96.638 1.432.575.29-.038.546-.497.728-.914.124-.288.124-.598-.058-.698m-5.077-2.942c.162-.154-.805-.355-1.556.156-.554.378-.571 1.187-.041 1.646.053.046.096.078.137.104a4.77 4.77 0 0 1 1.396-.412c.113-.125.243-.345.21-.745-.044-.542-.455-.456-.146-.749" />
		</svg>
	);
}

/** Segment brand mark. */
export function SegmentIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 256 265" className={className} aria-hidden>
			<path fill="#52BD95" d="M233.559383,141.926599 L233.730919,141.940042 L251.62229,143.810378 C252.878362,143.945722 254.031727,144.558621 254.846877,145.517067 L254.979564,145.679985 L254.809734,145.764536 C255.645772,146.819971 256.014592,148.170607 255.829453,149.504479 C251.920407,180.581499 237.190967,209.288892 214.225781,230.587832 C190.396859,252.688552 159.097527,264.967963 126.596982,264.967963 C110.811924,264.993233 95.1611576,262.087107 80.4408704,256.398937 L79.6388731,256.085915 C78.4340153,255.640672 77.4659746,254.724427 76.9534772,253.553406 L76.8763743,253.366422 C76.3745325,252.200276 76.3466522,250.887846 76.7927339,249.706061 L83.8547817,232.47639 C84.8116898,230.040624 87.5236209,228.813705 89.9727749,229.677267 L90.1356403,229.737944 C126.232536,243.675808 167.116063,235.825646 195.484521,209.509746 C213.541352,192.917988 225.184665,170.503115 228.376481,146.18948 C228.714624,143.678861 230.892709,141.852468 233.388725,141.919108 L233.559383,141.926599 L233.559383,141.926599 Z M43.4790584,206.236792 L43.731265,206.234818 L43.9844146,206.237023 C52.1042361,206.330081 58.6419662,212.895721 58.7302203,220.985764 L58.7308733,221.239069 C58.7308733,221.322891 58.7298903,221.407443 58.7284326,221.491265 C58.5870275,229.775118 51.7580427,236.376688 43.4741905,236.236012 C35.190338,236.094608 28.5894962,229.265622 28.7294433,220.98177 C28.8679626,212.866976 35.4238844,206.3665 43.4790584,206.236792 Z M4.92967673,147.082372 L151.245907,147.082372 C153.934439,147.105211 156.10653,149.258106 156.174142,151.926161 L156.175942,152.097146 L156.175942,170.413462 C156.198243,173.101993 154.081937,175.310424 151.416071,175.423172 L151.245178,175.427507 L4.92967673,175.427507 C2.24043139,175.404668 0.0690245784,173.251074 0,170.583674 L0,170.412733 L0,152.096508 L0,151.925476 C0.0675844901,149.316092 2.14770093,147.199058 4.75508624,147.086865 L4.92967673,147.082372 Z M169.561494,7.31085903 C170.828307,7.76787402 171.855316,8.71834859 172.408544,9.94580195 C172.916582,11.1849176 172.916582,12.5741849 172.408544,13.8125716 L166.034388,30.81178 C165.150971,33.3322871 162.395032,34.6625142 159.872339,33.7863866 C126.477444,22.1328685 89.4220555,28.7541192 62.1301694,51.2520855 C45.1214853,65.4887952 33.0444813,84.7351764 27.622986,106.242579 C27.0617395,108.414676 25.1061235,109.933686 22.8633242,109.940246 L21.7583247,109.940246 L4.24962094,105.733084 C2.94417618,105.426221 1.82314099,104.596013 1.14745853,103.437805 L1.06217822,103.437805 C0.353695638,102.280325 0.153979355,100.881582 0.510407319,99.5710349 C7.46330374,72.0393435 23.0207648,47.4450851 44.9188535,29.3663881 C79.7394601,0.699812731 127.018281,-7.66640438 169.561494,7.31085903 Z M104.754289,80.7452242 L251.06979,80.7452242 C253.692375,80.7666155 255.835743,82.8178629 255.99201,85.4154704 L255.999825,85.5894372 L255.999825,103.905753 C256.022125,106.594998 253.907219,108.803443 251.240726,108.916192 L251.06979,108.920527 L104.754289,108.920527 C102.082669,108.87487 99.9360988,106.729712 99.8683306,104.079305 L99.8664898,103.905753 L99.8664898,85.7592689 C99.8435255,83.0876489 101.932756,80.8873172 104.580813,80.751161 L104.754289,80.7452242 Z M206.325863,24.861606 L206.578049,24.8596325 L206.831176,24.8618385 C214.950998,24.9548961 221.488728,31.5205366 221.576982,39.6098731 L221.577635,39.8631554 C221.577635,39.9477067 221.576652,40.032258 221.575194,40.1160807 C221.434518,48.3999329 214.604804,55.0007747 206.320952,54.8600988 C198.0371,54.7194228 191.436258,47.8897091 191.576934,39.6065855 C191.714739,31.4910772 198.271346,24.9912858 206.325863,24.861606 Z" />
		</svg>
	);
}

/** Mixpanel brand mark. */
export function MixpanelIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<path fill="#7856FF" d="M6.967 9.996h3.053c-.763-.477-1.048-1.145-1.431-2.384L7.443 3.366C6.919 1.458 6.49.551 4.39.551H.004v1.145h.621c1.286 0 1.431.477 1.814 1.908L3.44 7.326c.524 1.814 1.337 2.67 3.53 2.67h-.003Zm7.06 0h3.053c2.194 0 2.956-.86 3.484-2.67l1.001-3.722c.382-1.431.57-1.908 1.814-1.908H24V.551h-4.34c-2.146 0-2.576.86-3.053 2.815l-1.145 4.246c-.384 1.286-.673 1.907-1.435 2.384Zm-4.007 4.008h4.007V9.996H10.02v4.008ZM0 23.449h4.39c2.1 0 2.529-.907 3.053-2.815l1.146-4.246c.383-1.239.668-1.907 1.431-2.384H6.967c-2.194 0-3.007.86-3.531 2.67l-1.001 3.722c-.383 1.431-.524 1.907-1.814 1.907H0v1.146Zm19.65 0h4.343v-1.146h-.622c-1.239 0-1.431-.476-1.814-1.907l-1.001-3.722c-.524-1.814-1.286-2.67-3.483-2.67h-3.046c.762.477 1.041 1.098 1.424 2.384l1.145 4.246c.477 1.955.907 2.815 3.054 2.815Z" />
		</svg>
	);
}

/** Sentry brand mark. */
export function SentryIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<path fill="currentColor" d="M13.91 2.505c-.873-1.448-2.972-1.448-3.844 0L6.904 7.92a15.478 15.478 0 0 1 8.53 12.811h-2.221A13.301 13.301 0 0 0 5.784 9.814l-2.926 5.06a7.65 7.65 0 0 1 4.435 5.848H2.194a.365.365 0 0 1-.298-.534l1.413-2.402a5.16 5.16 0 0 0-1.614-.913L.296 19.275a2.182 2.182 0 0 0 .812 2.999 2.24 2.24 0 0 0 1.086.288h6.983a9.322 9.322 0 0 0-3.845-8.318l1.11-1.922a11.47 11.47 0 0 1 4.95 10.24h5.915a17.242 17.242 0 0 0-7.885-15.28l2.244-3.845a.37.37 0 0 1 .504-.13c.255.14 9.75 16.708 9.928 16.9a.365.365 0 0 1-.327.543h-2.287c.029.612.029 1.223 0 1.831h2.297a2.206 2.206 0 0 0 1.922-3.31z" />
		</svg>
	);
}

/** incident.io brand mark. */
export function IncidentIoIcon({ className = "size-4" }: { className?: string }) {
	return <img src={incidentIoLogo} alt="" className={`rounded-[22%] ${className}`} aria-hidden />;
}

/** LaunchDarkly brand mark. */
export function LaunchDarklyIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 216 214.94" className={className} aria-hidden>
			<path fill="#405BFF" d="M109.8,214.94a4.87,4.87,0,0,1-4.26-2.66,4.5,4.5,0,0,1,.44-4.82l50.49-69.53L68,174.11a4.61,4.61,0,0,1-1.9.41,4.77,4.77,0,0,1-4.52-3.4,4.57,4.57,0,0,1,2-5.21L141.33,120,4.41,112.13a4.69,4.69,0,0,1,0-9.36l137-7.87L63.61,49a4.56,4.56,0,0,1-1.94-5.2,4.74,4.74,0,0,1,4.51-3.4,4.6,4.6,0,0,1,1.9.4L156.5,77,106,7.48a4.56,4.56,0,0,1-.44-4.83A4.84,4.84,0,0,1,109.84,0a4.59,4.59,0,0,1,3.28,1.41L213.77,102.05a7.65,7.65,0,0,1,0,10.8L113.08,213.53A4.59,4.59,0,0,1,109.8,214.94Z" />
		</svg>
	);
}

/** GitLab brand mark. */
export function GitLabIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} aria-hidden>
			<path fill="#FC6D26" d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z" />
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
			<path
				d="M12 17v5M9 3l.5 2.5L7 9.5a3 3 0 0 0 2 4.5h6a3 3 0 0 0 2-4.5L14.5 5.5 15 3H9z"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function ArchiveIcon({ className = "size-4" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.8}>
			<path
				d="M3 7.5h18v3H3v-3zM5 10.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5M10 14h4"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
