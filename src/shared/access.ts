export type WorkspaceRole = "Owner" | "Admin" | "Member";

/** Workspace admins (Owner + Admin) can manage company Settings. */
export function canAccessSettings(role: string | null | undefined): boolean {
	return role === "Owner" || role === "Admin";
}

export function isWorkspaceRole(role: string): role is WorkspaceRole {
	return role === "Owner" || role === "Admin" || role === "Member";
}
