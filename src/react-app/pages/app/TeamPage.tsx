import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDown, MailIcon, MoreHorizontalIcon, PlusIcon, TrashIcon, UsersIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { Modal, PageHeader, Pill, inputClass, selectClass } from "./ui";

type Role = "Owner" | "Admin" | "Member";
type Status = "active" | "invited";

type TeamMember = {
	id: number;
	name: string;
	email: string;
	role: Role;
	status: Status;
	lastActive: string;
	isYou?: boolean;
};

const ROLES: Role[] = ["Admin", "Member"];

function initials(name: string) {
	return name
		.split(" ")
		.map((p) => p[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

type MemberMenuAction = "resend" | "remove";

function MemberOverflowMenu({
	member,
	onAction,
}: {
	member: TeamMember;
	onAction: (action: MemberMenuAction) => void;
}) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onDoc(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open]);

	const items: { action: MemberMenuAction; label: string; icon: ReactNode; tone?: "rose" }[] = [];
	if (member.status === "invited") {
		items.push({
			action: "resend",
			label: "Resend invitation link",
			icon: <MailIcon className="size-3.5" />,
		});
	}
	if (!member.isYou) {
		items.push({
			action: "remove",
			label: member.status === "invited" ? "Revoke invite" : "Remove member",
			icon: <TrashIcon className="size-3.5" />,
			tone: "rose",
		});
	}

	if (items.length === 0) {
		return <div className="size-8 shrink-0" aria-hidden />;
	}

	return (
		<div ref={rootRef} className="relative shrink-0">
			<button
				type="button"
				aria-label={`Options for ${member.name}`}
				aria-expanded={open}
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				className="flex size-8 items-center justify-center rounded-lg text-violet-400/50 transition hover:bg-white/[0.06] hover:text-violet-100"
			>
				<MoreHorizontalIcon className="size-4" />
			</button>
			{open && (
				<div
					role="menu"
					className="absolute top-9 right-0 z-50 min-w-[12.5rem] rounded-xl border border-violet-500/20 bg-ink py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]"
				>
					{items.map((item) => (
						<button
							key={item.action}
							type="button"
							role="menuitem"
							onClick={(e) => {
								e.stopPropagation();
								setOpen(false);
								onAction(item.action);
							}}
							className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-white/[0.05] ${
								item.tone === "rose" ? "text-rose-300" : "text-violet-100"
							}`}
						>
							{item.icon}
							{item.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function RemoveMemberDialog({
	member,
	onConfirm,
	onClose,
}: {
	member: TeamMember;
	onConfirm: () => void;
	onClose: () => void;
}) {
	const invited = member.status === "invited";
	return (
		<Modal title={invited ? "Revoke this invite?" : "Remove this member?"} onClose={onClose}>
			<div className="space-y-4">
				<p className="text-sm leading-relaxed text-violet-200/80">
					{invited ? (
						<>
							<strong className="font-semibold text-violet-50">{member.name}</strong> ({member.email}) will no longer be able to join with
							their invite link.
						</>
					) : (
						<>
							<strong className="font-semibold text-violet-50">{member.name}</strong> ({member.email}) will lose access to this Beacon
							workspace immediately.
						</>
					)}
				</p>
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:text-violet-100"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30"
					>
						{invited ? "Revoke invite" : "Remove member"}
					</button>
				</div>
			</div>
		</Modal>
	);
}

function InviteForm({ onInvite, onCancel }: { onInvite: (email: string, role: Role) => void; onCancel: () => void }) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<Role>("Member");

	return (
		<div className="rounded-2xl border border-violet-500/20 bg-white/[0.03] p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400/50" />
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="teammate@company.com"
						autoFocus
						className={`${inputClass} pl-9`}
					/>
				</div>
				<div className="relative">
					<select value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${selectClass} w-full sm:w-auto`}>
						{ROLES.map((r) => (
							<option key={r} value={r} className="bg-ink">
								{r}
							</option>
						))}
					</select>
					<ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-violet-400/50" />
				</div>
				<div className="flex items-center gap-2">
					<button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100">
						Cancel
					</button>
					<button
						onClick={() => {
							if (!email.trim()) return;
							onInvite(email.trim(), role);
							setEmail("");
						}}
						disabled={!email.trim()}
						className="rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
					>
						Send invite
					</button>
				</div>
			</div>
		</div>
	);
}

function MemberRow({
	member,
	onChangeRole,
	onMenuAction,
}: {
	member: TeamMember;
	onChangeRole: (id: number, role: Role) => void;
	onMenuAction: (member: TeamMember, action: MemberMenuAction) => void;
}) {
	return (
		<div className="grid grid-cols-1 gap-3 border-b border-violet-500/10 px-1 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_6.5rem_2rem] sm:items-center sm:gap-3">
			<div className="flex min-w-0 items-center gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-semibold text-white">
					{initials(member.name)}
				</span>
				<div className="min-w-0 flex-1">
					<p className="flex min-w-0 items-center gap-2 text-sm font-medium text-violet-100">
						<span className="truncate">{member.name}</span>
						{member.isYou && <Pill tone="violet">You</Pill>}
					</p>
					<p className="truncate text-xs text-violet-400/50">{member.email}</p>
				</div>
			</div>

			<div className="flex items-center gap-3 sm:contents">
				<div className="flex sm:justify-start">
					<Pill tone={member.status === "active" ? "emerald" : "amber"}>{member.status === "active" ? "Active" : "Invited"}</Pill>
				</div>
				<span className="text-xs text-violet-400/50 sm:truncate">{member.lastActive}</span>
				<div className="flex sm:justify-start">
					{member.role === "Owner" ? (
						<div className="flex h-8 w-full max-w-[6.5rem] items-center">
							<Pill tone="violet">Owner</Pill>
						</div>
					) : (
						<div className="relative w-full max-w-[6.5rem]">
							<select
								value={member.role}
								onChange={(e) => onChangeRole(member.id, e.target.value as Role)}
								className={`${selectClass} w-full py-1.5 pr-7 text-xs`}
							>
								{ROLES.map((r) => (
									<option key={r} value={r} className="bg-ink">
										{r}
									</option>
								))}
							</select>
							<ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-violet-400/50" />
						</div>
					)}
				</div>
				<div className="flex h-8 w-8 shrink-0 items-center justify-center justify-self-end sm:justify-self-center">
					<MemberOverflowMenu member={member} onAction={(action) => onMenuAction(member, action)} />
				</div>
			</div>
		</div>
	);
}

export function TeamPage() {
	const { user } = useAppAuth();
	const [members, setMembers] = useState<TeamMember[]>(() => [
		{ id: 1, name: user?.name ?? "Avery Chen", email: "avery@beacon.com", role: "Owner", status: "active", lastActive: "Now", isYou: true },
		{ id: 2, name: "Priya Nair", email: "priya@beacon.com", role: "Admin", status: "active", lastActive: "2h ago" },
		{ id: 3, name: "Sam Rivera", email: "sam@beacon.com", role: "Member", status: "active", lastActive: "1d ago" },
		{ id: 4, name: "Jordan Lee", email: "jordan@beacon.com", role: "Member", status: "invited", lastActive: "Invited 3d ago" },
	]);
	const [showInvite, setShowInvite] = useState(false);
	const [pendingRemove, setPendingRemove] = useState<TeamMember | null>(null);

	function handleInvite(email: string, role: Role) {
		const name = email
			.split("@")[0]
			.split(/[._-]/)
			.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
			.join(" ");
		setMembers((prev) => [...prev, { id: Date.now(), name, email, role, status: "invited", lastActive: "Invited just now" }]);
		setShowInvite(false);
	}

	function handleChangeRole(id: number, role: Role) {
		setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
	}

	function handleMenuAction(member: TeamMember, action: MemberMenuAction) {
		if (action === "resend") {
			setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, lastActive: "Invite resent just now" } : m)));
			toast.success(`Invitation link resent to ${member.email}`);
			return;
		}
		if (action === "remove") setPendingRemove(member);
	}

	function confirmRemove() {
		if (!pendingRemove) return;
		setMembers((prev) => prev.filter((m) => m.id !== pendingRemove.id));
		toast.success(
			pendingRemove.status === "invited"
				? `Invite for ${pendingRemove.email} revoked`
				: `${pendingRemove.name} removed from the workspace`,
		);
		setPendingRemove(null);
	}

	return (
		<div className="flex h-full flex-col">
			{pendingRemove && (
				<RemoveMemberDialog member={pendingRemove} onConfirm={confirmRemove} onClose={() => setPendingRemove(null)} />
			)}

			<PageHeader
				title="Team"
				description="Manage who has access to your Lumantic workspace."
				action={
					<button
						onClick={() => setShowInvite((v) => !v)}
						className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
					>
						<PlusIcon className="size-4" />
						Invite teammate
					</button>
				}
			/>

			<div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
				{showInvite && <InviteForm onInvite={handleInvite} onCancel={() => setShowInvite(false)} />}

				<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4">
					<div className="flex items-center gap-2 border-b border-violet-500/10 py-3 text-xs font-medium text-violet-400/50 uppercase">
						<UsersIcon className="size-3.5" />
						{members.length} {members.length === 1 ? "member" : "members"}
					</div>
					{members.map((m) => (
						<MemberRow key={m.id} member={m} onChangeRole={handleChangeRole} onMenuAction={handleMenuAction} />
					))}
				</div>
			</div>
		</div>
	);
}
