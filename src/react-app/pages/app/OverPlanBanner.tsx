import { useQuery } from "@tanstack/react-query";
import { AlertIcon } from "../../components/Icons";
import { canAccessSettings } from "../../../shared/access";
import { useAppAuth } from "./context";
import { useT } from "./i18n";

type BillingUsagePayload = {
	usageCostCents: number;
	usage: { overage: number }[];
	overdue?: boolean;
	billingStatus?: string;
};

export function OverPlanBanner({ onChangePlan }: { onChangePlan: () => void }) {
	const t = useT();
	const { request, user } = useAppAuth();
	const isAdmin = canAccessSettings(user?.workspaceRole);

	const { data } = useQuery({
		queryKey: ["billing-over-plan"],
		queryFn: () => request<BillingUsagePayload>("/billing"),
		staleTime: 60_000,
	});

	const overPlan =
		(data?.usageCostCents ?? 0) > 0 || (data?.usage?.some((row) => row.overage > 0) ?? false);

	if (!overPlan) return null;

	return (
		<div
			role="status"
			className="shrink-0 border-b border-rose-400/30 bg-rose-500/15 px-4 py-2.5 text-rose-50"
		>
			<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
				<p className="flex min-w-0 items-start gap-2 text-pretty">
					<AlertIcon className="mt-0.5 size-4 shrink-0 text-rose-200/90" />
					<span>{t("billing.overPlanMessage")}</span>
				</p>
				{isAdmin && (
					<button
						type="button"
						onClick={onChangePlan}
						className="cursor-pointer rounded-lg border border-rose-300/40 bg-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:bg-rose-500/40"
					>
						{t("billing.changePlan")}
					</button>
				)}
			</div>
		</div>
	);
}
