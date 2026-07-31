import { useState } from "react";
import { CheckIcon, CreditCardIcon, DownloadIcon, SparkleIcon } from "../../components/Icons";
import { ListPagination, PageHeader, Pill, Select, Tooltip, inputClass } from "./ui";

type PlanId = "starter" | "scale" | "enterprise";

const PAGE_SIZE = 5;

const PLANS: { id: PlanId; name: string; price: string; seats: string; features: string[] }[] = [
	{
		id: "starter",
		name: "Starter",
		price: "$99/mo",
		seats: "Up to 3 seats",
		features: ["AI chat", "Memory library", "Email digests"],
	},
	{
		id: "scale",
		name: "Scale",
		price: "$499/mo",
		seats: "Up to 10 seats",
		features: ["Everything in Starter", "Slack integration", "Proposed memory review"],
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: "Custom",
		seats: "Unlimited seats",
		features: ["Everything in Scale", "SSO & audit logs", "Dedicated support"],
	},
];

const INVOICES = [
	{ id: 1, date: "Jul 1, 2026", description: "Scale plan - monthly", amount: "$499.00", status: "Paid" },
	{ id: 2, date: "Jun 1, 2026", description: "Scale plan - monthly", amount: "$499.00", status: "Paid" },
	{ id: 3, date: "May 1, 2026", description: "Scale plan - monthly", amount: "$499.00", status: "Paid" },
	{ id: 4, date: "Apr 1, 2026", description: "Starter to Scale proration", amount: "$212.40", status: "Paid" },
	{ id: 5, date: "Mar 1, 2026", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 6, date: "Feb 1, 2026", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 7, date: "Jan 1, 2026", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 8, date: "Dec 1, 2025", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 9, date: "Nov 1, 2025", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 10, date: "Oct 1, 2025", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 11, date: "Sep 1, 2025", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
	{ id: 12, date: "Aug 1, 2025", description: "Starter plan - monthly", amount: "$99.00", status: "Paid" },
];

type UsageMetricId = "tokens" | "slackPosts" | "memories" | "seats";

const PLAN_PRICE: Record<PlanId, number | null> = { starter: 99, scale: 499, enterprise: null };

const PLAN_QUOTAS: Record<PlanId, Record<UsageMetricId, number>> = {
	starter: { tokens: 300_000, slackPosts: 0, memories: 50, seats: 3 },
	scale: { tokens: 1_000_000, slackPosts: 250, memories: 200, seats: 10 },
	enterprise: { tokens: Infinity, slackPosts: Infinity, memories: Infinity, seats: Infinity },
};

/** `ratePer` bills overage in chunks (e.g. $0.02 per 1K tokens). */
const USAGE_METRICS: {
	id: UsageMetricId;
	label: string;
	unit: string;
	used: number;
	rate: number;
	ratePer?: number;
}[] = [
	{ id: "tokens", label: "Tokens consumed", unit: "token", used: 1_204_000, rate: 0.02, ratePer: 1000 },
	{ id: "slackPosts", label: "Slack posts", unit: "post", used: 86, rate: 0.05 },
	{ id: "memories", label: "Memories tracked", unit: "memory", used: 48, rate: 0.1 },
	{ id: "seats", label: "Team seats", unit: "seat", used: 3, rate: 15 },
];

function currency(amount: number) {
	return `$${amount.toFixed(2)}`;
}

function PlanPicker({
	currentPlan,
	onSelect,
	onClose,
}: {
	currentPlan: PlanId;
	onSelect: (id: PlanId) => void;
	onClose: () => void;
}) {
	return (
		<div className="rounded-2xl border border-violet-500/20 bg-white/[0.03] p-4">
			<div className="grid gap-3 sm:grid-cols-3">
				{PLANS.map((plan) => {
					const isCurrent = plan.id === currentPlan;
					return (
						<div
							key={plan.id}
							className={`flex flex-col rounded-xl border p-4 ${isCurrent ? "border-violet-400/50 bg-violet-500/10" : "border-violet-500/15 bg-white/[0.02]"}`}
						>
							<p className="font-display text-sm font-semibold text-violet-50">{plan.name}</p>
							<p className="mt-1 text-lg font-semibold text-violet-100">{plan.price}</p>
							<p className="text-xs text-violet-400/50">{plan.seats}</p>
							<ul className="mt-3 flex-1 space-y-1.5">
								{plan.features.map((f) => (
									<li key={f} className="flex items-start gap-1.5 text-xs text-violet-300/70">
										<CheckIcon className="mt-0.5 size-3 shrink-0 text-violet-400" />
										{f}
									</li>
								))}
							</ul>
							<button
								onClick={() => onSelect(plan.id)}
								disabled={isCurrent}
								className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold transition ${
									isCurrent
										? "cursor-default bg-white/[0.05] text-violet-300/50"
										: "bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:brightness-110"
								}`}
							>
								{isCurrent ? "Current plan" : `Switch to ${plan.name}`}
							</button>
						</div>
					);
				})}
			</div>
			<div className="mt-3 flex items-center justify-end">
				<button onClick={onClose} className="text-sm font-medium text-violet-300/60 hover:text-violet-100">
					Close
				</button>
			</div>
		</div>
	);
}

function usageCost(used: number, quota: number, rate: number, ratePer = 1) {
	const overage = Number.isFinite(quota) ? Math.max(0, used - quota) : 0;
	return (overage / ratePer) * rate;
}

function rateUnitLabel(unit: string, ratePer = 1) {
	if (ratePer === 1000) return `1K ${unit}s`;
	return unit;
}

function UsageRow({ metric, quota }: { metric: (typeof USAGE_METRICS)[number]; quota: number }) {
	const unlimited = !Number.isFinite(quota);
	const overage = unlimited ? 0 : Math.max(0, metric.used - quota);
	const ratePer = metric.ratePer ?? 1;
	const cost = usageCost(metric.used, quota, metric.rate, ratePer);
	const pct = unlimited ? 100 : Math.min(100, (metric.used / Math.max(quota, 1)) * 100);
	const overLimit = !unlimited && overage > 0;

	return (
		<div className="py-3.5">
			<div className="flex items-center justify-between gap-4">
				<div className="min-w-0">
					<p className="text-sm font-medium text-violet-100">{metric.label}</p>
					<p className="text-xs text-violet-400/50">
						{metric.used.toLocaleString()} {unlimited ? "used" : `/ ${quota.toLocaleString()} included`}
						{overLimit &&
							` · ${overage.toLocaleString()} over at $${metric.rate.toFixed(2)}/${rateUnitLabel(metric.unit, ratePer)}`}
					</p>
				</div>
				<p className={`shrink-0 text-sm font-semibold ${overLimit ? "text-amber-300" : "text-violet-300/50"}`}>
					{cost > 0 ? currency(cost) : "Included"}
				</p>
			</div>
			<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
				<div
					className={`h-full rounded-full transition-all ${overLimit ? "bg-amber-400" : "bg-violet-400"}`}
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

const EXPIRY_MONTHS = [
	{ value: "01", label: "01 - January" },
	{ value: "02", label: "02 - February" },
	{ value: "03", label: "03 - March" },
	{ value: "04", label: "04 - April" },
	{ value: "05", label: "05 - May" },
	{ value: "06", label: "06 - June" },
	{ value: "07", label: "07 - July" },
	{ value: "08", label: "08 - August" },
	{ value: "09", label: "09 - September" },
	{ value: "10", label: "10 - October" },
	{ value: "11", label: "11 - November" },
	{ value: "12", label: "12 - December" },
];

function expiryYears(fromYear = new Date().getFullYear(), count = 16) {
	return Array.from({ length: count }, (_, i) => {
		const year = fromYear + i;
		return { value: String(year).slice(-2), label: String(year) };
	});
}

export function BillingPage() {
	const [planId, setPlanId] = useState<PlanId>("scale");
	const [showPlanPicker, setShowPlanPicker] = useState(false);
	const [showPaymentForm, setShowPaymentForm] = useState(false);
	const [paymentSaved, setPaymentSaved] = useState(false);
	const [cardExpMonth, setCardExpMonth] = useState("08");
	const [cardExpYear, setCardExpYear] = useState("28");
	const [invoicePage, setInvoicePage] = useState(1);
	const yearOptions = expiryYears();

	const plan = PLANS.find((p) => p.id === planId)!;
	const quotas = PLAN_QUOTAS[planId];
	const basePrice = PLAN_PRICE[planId];

	const usageTotal = USAGE_METRICS.reduce(
		(sum, metric) => sum + usageCost(metric.used, quotas[metric.id], metric.rate, metric.ratePer ?? 1),
		0,
	);
	const estimatedTotal = basePrice === null ? null : basePrice + usageTotal;

	const totalInvoicePages = Math.max(1, Math.ceil(INVOICES.length / PAGE_SIZE));
	const safeInvoicePage = Math.min(invoicePage, totalInvoicePages);
	if (invoicePage !== safeInvoicePage) {
		setInvoicePage(safeInvoicePage);
	}
	const pageInvoices = INVOICES.slice((safeInvoicePage - 1) * PAGE_SIZE, safeInvoicePage * PAGE_SIZE);

	return (
		<div className="h-full overflow-y-auto">
			<PageHeader title="Billing" description="Manage your plan, payment method, and invoices." />

			<div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
				<div className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4">
						<p className="font-display text-2xl font-semibold text-violet-50">
							{basePrice === null ? "Custom" : currency(basePrice)}
						</p>
						<p className="mt-1 text-xs text-violet-400/50">Plan cost this cycle</p>
					</div>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4">
						<p className={`font-display text-2xl font-semibold ${usageTotal > 0 ? "text-amber-300" : "text-violet-50"}`}>
							{currency(usageTotal)}
						</p>
						<p className="mt-1 text-xs text-violet-400/50">Usage charges this cycle</p>
					</div>
					<div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
						<p className="font-display text-2xl font-semibold text-violet-50">
							{estimatedTotal === null ? "Contact sales" : currency(estimatedTotal)}
						</p>
						<p className="mt-1 text-xs text-violet-300/60">Estimated total · due Aug 30</p>
					</div>
				</div>

				<section>
					<div className="mb-3 flex items-center justify-between">
						<h2 className="text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Usage this cycle</h2>
						<span className="text-xs text-violet-400/50">Jul 1 – Jul 30, 2026</span>
					</div>
					<div className="divide-y divide-violet-500/10 rounded-2xl border border-violet-500/15 bg-white/[0.02] px-5">
						{USAGE_METRICS.map((metric) => (
							<UsageRow key={metric.id} metric={metric} quota={quotas[metric.id]} />
						))}
					</div>
					<div className="mt-2 flex items-center justify-end px-1">
						<p className="text-sm text-violet-300/60">
							Usage total: <span className="font-semibold text-violet-100">{currency(usageTotal)}</span>
						</p>
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Current plan</h2>
					{showPlanPicker ? (
						<PlanPicker
							currentPlan={planId}
							onSelect={(id) => {
								setPlanId(id);
								setShowPlanPicker(false);
							}}
							onClose={() => setShowPlanPicker(false)}
						/>
					) : (
						<div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6">
							<div className="flex items-center gap-3">
								<span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white">
									<SparkleIcon className="size-5" />
								</span>
								<div>
									<p className="flex items-center gap-2 font-medium text-violet-50">
										{plan.name} plan <Pill tone="violet">{plan.price}</Pill>
									</p>
									<p className="text-xs text-violet-400/50">{plan.seats} · renews Aug 30, 2026</p>
								</div>
							</div>
							<button
								onClick={() => setShowPlanPicker(true)}
								className="rounded-lg border border-violet-500/25 px-3.5 py-2 text-sm font-medium text-violet-200 transition hover:border-violet-400/50 hover:text-violet-50"
							>
								Change plan
							</button>
						</div>
					)}
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Payment method</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-6">
						{showPaymentForm ? (
							<div className="flex flex-col gap-3">
								<input placeholder="Card number" defaultValue="4242 4242 4242 4242" className={inputClass} />
								<div className="grid grid-cols-3 gap-3">
									<label className="block min-w-0">
										<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Expiry month</span>
										<Select
											value={cardExpMonth}
											onChange={(e) => setCardExpMonth(e.target.value)}
											aria-label="Expiry month"
											wrapperClassName="w-full"
										>
											{EXPIRY_MONTHS.map((month) => (
												<option key={month.value} value={month.value}>
													{month.label}
												</option>
											))}
										</Select>
									</label>
									<label className="block min-w-0">
										<span className="mb-1.5 block text-xs font-medium text-violet-300/60">Expiry year</span>
										<Select
											value={cardExpYear}
											onChange={(e) => setCardExpYear(e.target.value)}
											aria-label="Expiry year"
											wrapperClassName="w-full"
										>
											{yearOptions.map((year) => (
												<option key={year.value} value={year.value}>
													{year.label}
												</option>
											))}
										</Select>
									</label>
									<label className="block min-w-0">
										<span className="mb-1.5 block text-xs font-medium text-violet-300/60">CVC</span>
										<input placeholder="123" defaultValue="123" className={inputClass} />
									</label>
								</div>
								<div className="flex items-center justify-end">
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() => setShowPaymentForm(false)}
											className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-violet-300/60 hover:text-violet-100"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={() => {
												setShowPaymentForm(false);
												setPaymentSaved(true);
											}}
											className="cursor-pointer rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
										>
											Save card
										</button>
									</div>
								</div>
							</div>
						) : (
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<span className="flex size-11 items-center justify-center rounded-xl bg-white/[0.04] text-violet-300">
										<CreditCardIcon className="size-5" />
									</span>
									<div>
										<p className="font-medium text-violet-50">Visa •••• 4242</p>
										<p className="text-xs text-violet-400/50">
											Expires {cardExpMonth}/{cardExpYear}
											{paymentSaved && <span className="ml-2 text-emerald-300">· Updated</span>}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setShowPaymentForm(true)}
									className="cursor-pointer rounded-lg border border-violet-500/25 px-3.5 py-2 text-sm font-medium text-violet-200 transition hover:border-violet-400/50 hover:text-violet-50"
								>
									Update payment method
								</button>
							</div>
						)}
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Billing history</h2>
					<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
						<table className="w-full text-left text-sm">
							<thead>
								<tr className="border-b border-violet-500/10 text-xs tracking-wide text-violet-400/50 uppercase">
									<th className="px-5 py-3 font-medium">Date</th>
									<th className="px-5 py-3 font-medium">Description</th>
									<th className="px-5 py-3 font-medium">Amount</th>
									<th className="px-5 py-3 font-medium">Status</th>
									<th className="px-5 py-3 text-right font-medium">Invoice</th>
								</tr>
							</thead>
							<tbody>
								{pageInvoices.map((inv) => (
									<tr key={inv.id} className="border-b border-violet-500/5 last:border-0">
										<td className="px-5 py-3 font-mono text-xs text-violet-300/60">{inv.date}</td>
										<td className="px-5 py-3 text-violet-100">{inv.description}</td>
										<td className="px-5 py-3 text-violet-100">{inv.amount}</td>
										<td className="px-5 py-3">
											<Pill tone="emerald">{inv.status}</Pill>
										</td>
										<td className="px-5 py-3 text-right">
											<Tooltip content="Download invoice">
												<button
													aria-label="Download invoice"
													className="inline-flex size-8 items-center justify-center rounded-full text-violet-300/70 transition hover:bg-violet-500/15 hover:text-violet-100"
												>
													<DownloadIcon className="size-4" />
												</button>
											</Tooltip>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<ListPagination
						page={safeInvoicePage}
						pageSize={PAGE_SIZE}
						total={INVOICES.length}
						onPageChange={setInvoicePage}
						className="pt-3"
					/>
				</section>
			</div>
		</div>
	);
}
