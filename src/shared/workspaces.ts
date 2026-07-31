export const LIVE_WORKSPACE_ID = 1;

export const WORKSPACE_PLAN_IDS = ["starter", "scale", "enterprise"] as const;
export type WorkspacePlanId = (typeof WORKSPACE_PLAN_IDS)[number];

export const WORKSPACE_BILLING_STATUSES = ["active", "trial", "overdue", "canceled"] as const;
export type WorkspaceBillingStatus = (typeof WORKSPACE_BILLING_STATUSES)[number];

export const WORKSPACE_MEMBER_ROLES = ["Owner", "Admin", "Member"] as const;
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];

export const WORKSPACE_MEMBER_STATUSES = ["active", "invited", "disabled"] as const;
export type WorkspaceMemberStatus = (typeof WORKSPACE_MEMBER_STATUSES)[number];

export function isWorkspacePlanId(value: string): value is WorkspacePlanId {
	return (WORKSPACE_PLAN_IDS as readonly string[]).includes(value);
}

export function isWorkspaceBillingStatus(value: string): value is WorkspaceBillingStatus {
	return (WORKSPACE_BILLING_STATUSES as readonly string[]).includes(value);
}

export function isWorkspaceMemberRole(value: string): value is WorkspaceMemberRole {
	return (WORKSPACE_MEMBER_ROLES as readonly string[]).includes(value);
}

export function planLabel(planId: string): string {
	switch (planId) {
		case "starter":
			return "Starter";
		case "scale":
			return "Scale";
		case "enterprise":
			return "Enterprise";
		default:
			return planId;
	}
}

export function billingStatusLabel(status: string): string {
	switch (status) {
		case "active":
			return "Active";
		case "trial":
			return "Trial";
		case "overdue":
			return "Overdue";
		case "canceled":
			return "Canceled";
		default:
			return status;
	}
}

export function formatMrrCents(cents: number): string {
	if (!Number.isFinite(cents) || cents <= 0) return "$0";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(cents / 100);
}
