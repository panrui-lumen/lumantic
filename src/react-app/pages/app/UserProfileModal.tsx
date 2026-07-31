import { useEffect, useState } from "react";
import { MailIcon, SparkleIcon, UserIcon } from "../../components/Icons";
import { useAppAuth } from "./context";
import { useSelfAvatar } from "./selfAvatar";
import { UserAvatar } from "./UserAvatar";
import { Modal, Pill } from "./ui";
import {
	lookupKnownProfile,
	normalizeProfileName,
	OPEN_USER_PROFILE_EVENT,
	type UserProfileDetail,
} from "./userProfile";

type TeamApiMember = {
	name: string;
	email: string;
	role: string;
	status: string;
	is_you?: number;
};

function fromTeamMember(m: TeamApiMember): UserProfileDetail {
	return {
		name: m.name,
		email: m.email,
		role: m.role,
		status: m.status === "invited" ? "invited" : "active",
		subtitle: m.is_you ? "That's you" : null,
	};
}

function resolveProfile(name: string, members: TeamApiMember[] | null, selfName?: string): UserProfileDetail {
	const key = normalizeProfileName(name);
	const resolvedName = key === "you" && selfName ? selfName : name;

	if (members) {
		const match = members.find((m) => normalizeProfileName(m.name) === normalizeProfileName(resolvedName));
		if (match) {
			const profile = fromTeamMember(match);
			if (selfName && normalizeProfileName(match.name) === normalizeProfileName(selfName)) {
				return { ...profile, subtitle: profile.subtitle ?? "That's you" };
			}
			return profile;
		}
	}

	const known = lookupKnownProfile(resolvedName);
	if (known) {
		if (selfName && normalizeProfileName(known.name) === normalizeProfileName(selfName)) {
			return { ...known, subtitle: known.subtitle ?? "That's you" };
		}
		return known;
	}

	return {
		name: resolvedName,
		email: null,
		role: "Teammate",
		status: "active",
		subtitle: null,
	};
}

function ProfileBody({
	name,
	profile,
	loading,
	onClose,
}: {
	name: string;
	profile: UserProfileDetail;
	loading: boolean;
	onClose: () => void;
}) {
	const self = useSelfAvatar();
	const isAi = normalizeProfileName(profile.name) === "lumantic";
	const avatarUrl =
		self.avatarUrl && self.name && normalizeProfileName(self.name) === normalizeProfileName(profile.name)
			? self.avatarUrl
			: null;

	return (
		<Modal title="Profile" onClose={onClose}>
			<div className="space-y-4">
				<div className="flex items-start gap-3">
					{isAi ? (
						<span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 text-white">
							<SparkleIcon className="size-5" />
						</span>
					) : (
						<UserAvatar name={profile.name} avatarUrl={avatarUrl} sizeClass="size-12" textClass="text-sm" />
					)}
					<div className="min-w-0 flex-1">
						<p className="font-display text-base font-semibold text-violet-50">{loading ? name : profile.name}</p>
						{profile.role && <p className="mt-0.5 text-sm text-violet-300/70">{profile.role}</p>}
						{profile.subtitle && <p className="mt-1 text-xs text-violet-400/50">{profile.subtitle}</p>}
					</div>
					{profile.status && (
						<Pill tone={profile.status === "invited" ? "amber" : "emerald"}>
							{profile.status === "invited" ? "Invited" : "Active"}
						</Pill>
					)}
				</div>

				{profile.email && (
					<div className="flex items-center gap-2 rounded-xl border border-violet-500/15 bg-white/[0.03] px-3 py-2.5 text-sm text-violet-200/80">
						<MailIcon className="size-4 shrink-0 text-violet-400/50" />
						<a href={`mailto:${profile.email}`} className="truncate hover:text-violet-50">
							{profile.email}
						</a>
					</div>
				)}

				{!profile.email && isAi && (
					<div className="flex items-start gap-2 rounded-xl border border-violet-500/15 bg-white/[0.03] px-3 py-2.5 text-sm text-violet-200/80">
						<UserIcon className="mt-0.5 size-4 shrink-0 text-violet-400/50" />
						<p>Asks and answers live in Chat. Confirmed knowledge lands in Memories for the whole team.</p>
					</div>
				)}

				<div className="flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
					>
						Close
					</button>
				</div>
			</div>
		</Modal>
	);
}

function AuthedUserProfileModal({ name, onClose }: { name: string; onClose: () => void }) {
	const { request, user } = useAppAuth();
	const [profile, setProfile] = useState<UserProfileDetail>(() => resolveProfile(name, null, user?.name));
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		request<{ members: TeamApiMember[] }>("/team")
			.then((data) => {
				if (!cancelled) setProfile(resolveProfile(name, data.members, user?.name));
			})
			.catch(() => {
				if (!cancelled) setProfile(resolveProfile(name, null, user?.name));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [name, request, user?.name]);

	return <ProfileBody name={name} profile={profile} loading={loading} onClose={onClose} />;
}

function PublicUserProfileModal({ name, onClose }: { name: string; onClose: () => void }) {
	const profile = resolveProfile(name, null);
	return <ProfileBody name={name} profile={profile} loading={false} onClose={onClose} />;
}

function useProfileNameListener() {
	const [name, setName] = useState<string | null>(null);

	useEffect(() => {
		function onOpen(e: Event) {
			const detail = (e as CustomEvent<{ name?: string }>).detail;
			if (detail?.name) setName(detail.name);
		}
		window.addEventListener(OPEN_USER_PROFILE_EVENT, onOpen);
		return () => window.removeEventListener(OPEN_USER_PROFILE_EVENT, onOpen);
	}, []);

	return [name, setName] as const;
}

/** Mount inside the authenticated app shell. */
export function UserProfileHost() {
	const [name, setName] = useProfileNameListener();
	if (!name) return null;
	return <AuthedUserProfileModal key={name} name={name} onClose={() => setName(null)} />;
}

/** Mount on public pages (shared chat) without requiring auth. */
export function PublicUserProfileHost() {
	const [name, setName] = useProfileNameListener();
	if (!name) return null;
	return <PublicUserProfileModal name={name} onClose={() => setName(null)} />;
}
