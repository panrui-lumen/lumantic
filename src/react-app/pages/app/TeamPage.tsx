import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
	ChevronLeft,
	ChevronRight,
	MailIcon,
	MoreHorizontalIcon,
	PlusIcon,
	TrashIcon,
	UsersIcon,
} from "../../components/Icons";
import { useAppAuth } from "./context";
import { DelayedBusyOverlay, Modal, PageHeader, Pill, Select, formatRelative, inputClass } from "./ui";
import { UserAvatar } from "./UserAvatar";
import { useSelfAvatar } from "./selfAvatar";
import { openUserProfile } from "./userProfile";

type Role = "Owner" | "Admin" | "Member";
type Status = "active" | "invited" | "disabled";
type StatusFilter = "all" | Status;

type TeamMember = {
	id: number;
	name: string;
	email: string;
	role: Role;
	status: Status;
	lastActive: string;
	isYou?: boolean;
};

type ApiTeamMember = {
	id: number;
	name: string;
	email: string;
	role: string;
	status: string;
	is_you?: number;
	last_active_at?: string | null;
	created_at?: string;
};

const ROLES: Role[] = ["Admin", "Member"];
const PAGE_SIZE = 20;
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "active", label: "Active" },
	{ id: "invited", label: "Invited" },
	{ id: "disabled", label: "Disabled" },
];

function isRole(value: string): value is Role {
	return value === "Owner" || value === "Admin" || value === "Member";
}

function isStatus(value: string): value is Status {
	return value === "active" || value === "invited" || value === "disabled";
}

function mapMember(row: ApiTeamMember): TeamMember {
	const status = isStatus(row.status) ? row.status : "active";
	const role = isRole(row.role) ? row.role : "Member";
	let lastActive = "—";
	if (status === "invited") {
		if (row.created_at) {
			const rel = formatRelative(row.created_at);
			lastActive = rel === "Just now" ? "Invited just now" : `Invited ${rel}`;
		} else {
			lastActive = "Invited";
		}
	} else if (row.last_active_at) {
		lastActive = formatRelative(row.last_active_at);
	}
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		role,
		status,
		lastActive,
		isYou: Boolean(row.is_you),
	};
}

function statusPillTone(status: Status): "emerald" | "amber" | "violet" {
	if (status === "active") return "emerald";
	if (status === "invited") return "amber";
	return "violet";
}

function statusLabel(status: Status): string {
	if (status === "active") return "Active";
	if (status === "invited") return "Invited";
	return "Disabled";
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
	if (!member.isYou && member.role !== "Owner") {
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
				className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-violet-400/50 transition hover:bg-white/[0.06] hover:text-violet-100"
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
							className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-white/[0.05] ${
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
							<strong className="font-semibold text-violet-50">{member.name}</strong> ({member.email}) will no longer be
							able to join with their invite link.
						</>
					) : (
						<>
							<strong className="font-semibold text-violet-50">{member.name}</strong> ({member.email}) will lose access
							to this Beacon workspace immediately.
						</>
					)}
				</p>
				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/70 transition hover:text-violet-100"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="cursor-pointer rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/30"
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
				<Select
					value={role}
					onChange={(e) => setRole(e.target.value as Role)}
					wrapperClassName="w-full sm:w-auto"
					aria-label="Role"
				>
					{ROLES.map((r) => (
						<option key={r} value={r} className="bg-ink">
							{r}
						</option>
					))}
				</Select>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => {
							if (!email.trim()) return;
							onInvite(email.trim(), role);
							setEmail("");
						}}
						disabled={!email.trim()}
						className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
	const self = useSelfAvatar();
	const avatarUrl = member.isYou ? self.avatarUrl : null;

	return (
		<div className="grid grid-cols-1 gap-3 border-b border-violet-500/10 px-1 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_6.5rem_2rem] sm:items-center sm:gap-3">
			<div className="flex min-w-0 items-center gap-3">
				<button
					type="button"
					onClick={() => openUserProfile(member.name)}
					aria-label={`View ${member.name}'s profile`}
					className="cursor-pointer rounded-full transition hover:brightness-110"
				>
					<UserAvatar name={member.name} avatarUrl={avatarUrl} sizeClass="size-9" textClass="text-xs" />
				</button>
				<div className="min-w-0 flex-1">
					<p className="flex min-w-0 items-center gap-2 text-sm font-medium text-violet-100">
						<button
							type="button"
							onClick={() => openUserProfile(member.name)}
							className="cursor-pointer truncate transition hover:text-violet-50"
						>
							{member.name}
						</button>
						{member.isYou && <Pill tone="violet">You</Pill>}
					</p>
					<p className="truncate text-xs text-violet-400/50">{member.email}</p>
				</div>
			</div>

			<div className="flex items-center gap-3 sm:contents">
				<div className="flex sm:justify-start">
					<Pill tone={statusPillTone(member.status)}>{statusLabel(member.status)}</Pill>
				</div>
				<span className="text-xs text-violet-400/50 sm:truncate">{member.lastActive}</span>
				<div className="flex sm:justify-start">
					{member.role === "Owner" ? (
						<div className="flex h-8 w-full max-w-[6.5rem] items-center">
							<Pill tone="violet">Owner</Pill>
						</div>
					) : (
						<Select
							value={member.role}
							onChange={(e) => onChangeRole(member.id, e.target.value as Role)}
							wrapperClassName="w-full max-w-[6.5rem]"
							size="sm"
							aria-label="Role"
						>
							{ROLES.map((r) => (
								<option key={r} value={r} className="bg-ink">
									{r}
								</option>
							))}
						</Select>
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
	const { request } = useAppAuth();
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [showInvite, setShowInvite] = useState(false);
	const [pendingRemove, setPendingRemove] = useState<TeamMember | null>(null);
	const [page, setPage] = useState(1);
	const requestIdRef = useRef(0);

	const loadMembers = useCallback(
		async (filter: StatusFilter) => {
			const requestId = ++requestIdRef.current;
			setBusy(true);
			setError("");
			try {
				const params = filter === "all" ? "" : `?status=${encodeURIComponent(filter)}`;
				const data = await request<{ members: ApiTeamMember[] }>(`/team${params}`);
				if (requestId !== requestIdRef.current) return;
				setMembers((data.members ?? []).map(mapMember));
				setPage(1);
			} catch (err) {
				if (requestId !== requestIdRef.current) return;
				setError(err instanceof Error ? err.message : "Failed to load team members");
			} finally {
				if (requestId === requestIdRef.current) setBusy(false);
			}
		},
		[request],
	);

	useEffect(() => {
		void loadMembers(statusFilter);
	}, [statusFilter, loadMembers]);

	const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const pageStart = (safePage - 1) * PAGE_SIZE;
	const pageMembers = members.slice(pageStart, pageStart + PAGE_SIZE);
	const rangeStart = members.length === 0 ? 0 : pageStart + 1;
	const rangeEnd = Math.min(safePage * PAGE_SIZE, members.length);

	if (page !== safePage) {
		setPage(safePage);
	}

	async function handleInvite(email: string, role: Role) {
		try {
			const data = await request<{ member: ApiTeamMember }>("/team", {
				method: "POST",
				body: JSON.stringify({ email, role }),
			});
			const mapped = mapMember(data.member);
			if (statusFilter === "all" || statusFilter === mapped.status) {
				setMembers((prev) => [...prev, mapped]);
			}
			setShowInvite(false);
			toast.success(`Invite sent to ${email}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't send invite");
		}
	}

	async function handleChangeRole(id: number, role: Role) {
		const previous = members;
		setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
		try {
			await request(`/team/${id}`, { method: "PUT", body: JSON.stringify({ role }) });
		} catch (err) {
			setMembers(previous);
			toast.error(err instanceof Error ? err.message : "Couldn't update role");
		}
	}

	function handleMenuAction(member: TeamMember, action: MemberMenuAction) {
		if (action === "resend") {
			setMembers((prev) =>
				prev.map((m) => (m.id === member.id ? { ...m, lastActive: "Invite resent just now" } : m)),
			);
			toast.success(`Invitation link resent to ${member.email}`);
			return;
		}
		if (action === "remove") setPendingRemove(member);
	}

	async function confirmRemove() {
		if (!pendingRemove) return;
		const removing = pendingRemove;
		setPendingRemove(null);
		setMembers((prev) => prev.filter((m) => m.id !== removing.id));
		try {
			await request(`/team/${removing.id}`, { method: "DELETE" });
			toast.success(
				removing.status === "invited"
					? `Invite for ${removing.email} revoked`
					: `${removing.name} removed from the workspace`,
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't remove member");
			void loadMembers(statusFilter);
		}
	}

	const busyMessage =
		statusFilter === "invited"
			? "Getting invited users"
			: statusFilter === "active"
				? "Getting active users"
				: statusFilter === "disabled"
					? "Getting disabled users"
					: "Getting users";

	return (
		<div className="flex h-full flex-col">
			{pendingRemove && (
				<RemoveMemberDialog member={pendingRemove} onConfirm={() => void confirmRemove()} onClose={() => setPendingRemove(null)} />
			)}

			<PageHeader
				title="Team"
				description="Manage who has access to your Lumantic workspace."
				action={
					<button
						type="button"
						onClick={() => setShowInvite((v) => !v)}
						className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
					>
						<PlusIcon className="size-4" />
						Invite teammate
					</button>
				}
			/>

			<div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
				{showInvite && <InviteForm onInvite={(email, role) => void handleInvite(email, role)} onCancel={() => setShowInvite(false)} />}

				<div className="flex flex-wrap items-center gap-2">
					{STATUS_FILTERS.map((filter) => (
						<button
							key={filter.id}
							type="button"
							onClick={() => setStatusFilter(filter.id)}
							aria-pressed={statusFilter === filter.id}
							className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition ${
								statusFilter === filter.id
									? "bg-violet-500/20 text-violet-50"
									: "text-violet-300/60 hover:bg-white/[0.04] hover:text-violet-100"
							}`}
						>
							{filter.label}
						</button>
					))}
				</div>

				{error && <p className="text-sm text-rose-300">{error}</p>}

				<div className="relative overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02] px-4">
					<div
						className={`transition-opacity duration-200 ${busy ? "pointer-events-none opacity-40" : "opacity-100"}`}
					>
						<div className="flex items-center gap-2 border-b border-violet-500/10 py-3 text-xs font-medium text-violet-400/50 uppercase">
							<UsersIcon className="size-3.5" />
							{members.length} {members.length === 1 ? "member" : "members"}
							{statusFilter !== "all" ? (
								<span className="normal-case tracking-normal text-violet-400/40">· {statusLabel(statusFilter)}</span>
							) : null}
						</div>
						{pageMembers.length === 0 && !busy ? (
							<p className="px-1 py-10 text-center text-sm text-violet-400/50">
								{statusFilter === "all" ? "No team members yet." : `No ${statusLabel(statusFilter).toLowerCase()} members.`}
							</p>
						) : (
							pageMembers.map((m) => (
								<MemberRow key={m.id} member={m} onChangeRole={handleChangeRole} onMenuAction={handleMenuAction} />
							))
						)}
						{members.length > PAGE_SIZE && (
							<div className="flex items-center justify-between gap-3 border-t border-violet-500/10 py-3 text-sm text-violet-300/60">
								<p>
									Showing {rangeStart}-{rangeEnd} of {members.length}
								</p>
								<div className="flex items-center gap-2">
									<span className="hidden text-xs sm:inline">
										Page {safePage} of {totalPages}
									</span>
									<button
										type="button"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={safePage <= 1}
										aria-label="Previous page"
										className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
									>
										<ChevronLeft className="size-4" />
									</button>
									<button
										type="button"
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={safePage >= totalPages}
										aria-label="Next page"
										className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-violet-500/20 transition hover:border-violet-400/40 hover:text-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
									>
										<ChevronRight className="size-4" />
									</button>
								</div>
							</div>
						)}
					</div>
					<DelayedBusyOverlay busy={busy} message={busyMessage} />
				</div>
			</div>
		</div>
	);
}
