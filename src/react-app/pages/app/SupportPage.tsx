import { useState, type FormEvent } from "react";
import { ChevronDown, ExternalLinkIcon, LifeBuoyIcon, SparkleIcon, SpinnerIcon } from "../../components/Icons";
import { useT } from "./i18n";
import { PageHeader, Pill, inputClass, textareaClass } from "./ui";

const FAQ_KEYS = ["faq1", "faq2", "faq3", "faq4"] as const;
const TICKET_KEYS = [
	{ id: 1042, key: "ticket1042", status: "Open" as const },
	{ id: 1038, key: "ticket1038", status: "Open" as const },
	{ id: 1021, key: "ticket1021", status: "Resolved" as const },
];

function FaqItem({ q, a }: { q: string; a: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="border-b border-violet-500/10 last:border-0">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left"
			>
				<span className="text-sm font-medium text-violet-100">{q}</span>
				<ChevronDown className={`size-4 shrink-0 text-violet-400/50 transition ${open ? "rotate-180" : ""}`} />
			</button>
			{open && <p className="pb-4 text-sm leading-relaxed text-violet-300/60">{a}</p>}
		</div>
	);
}

export function SupportPage() {
	const t = useT();
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!subject.trim() || !message.trim()) return;
		setSending(true);
		setTimeout(() => {
			setSending(false);
			setSent(true);
			setSubject("");
			setMessage("");
		}, 700);
	}

	const quickLinks = [
		{ label: t("support.docs"), desc: t("support.docsDesc"), href: null as string | null },
		{ label: t("support.status"), desc: t("support.statusDesc"), href: "/status" },
		{ label: t("support.community"), desc: t("support.communityDesc"), href: null },
	];

	return (
		<div className="h-full overflow-y-auto">
			<PageHeader title={t("support.title")} description={t("support.description")} />

			<div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
				<div className="grid gap-3 sm:grid-cols-3">
					{quickLinks.map((link) => (
						<a
							key={link.label}
							href={link.href ?? "#"}
							{...(link.href
								? { target: "_blank", rel: "noopener noreferrer" }
								: { onClick: (e: { preventDefault: () => void }) => e.preventDefault() })}
							className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4 transition hover:border-violet-400/30 hover:bg-white/[0.04]"
						>
							<div>
								<p className="text-sm font-medium text-violet-100">{link.label}</p>
								<p className="text-xs text-violet-400/50">{link.desc}</p>
							</div>
							<ExternalLinkIcon className="size-4 shrink-0 text-violet-400/50" />
						</a>
					))}
				</div>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						{t("support.contactUs")}
					</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
						{sent ? (
							<div className="flex flex-col items-center gap-2 py-6 text-center">
								<span className="flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
									<SparkleIcon className="size-5" />
								</span>
								<p className="font-medium text-violet-100">{t("support.messageSent")}</p>
								<p className="max-w-xs text-sm text-violet-300/60">{t("support.messageSentBody")}</p>
								<button
									type="button"
									onClick={() => setSent(false)}
									className="mt-2 cursor-pointer text-sm font-medium text-violet-300 hover:text-violet-100"
								>
									{t("support.sendAnother")}
								</button>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="flex flex-col gap-3">
								<input
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									placeholder={t("support.subject")}
									className={inputClass}
								/>
								<textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder={t("support.messagePlaceholder")}
									className={textareaClass}
								/>
								<div className="flex items-center justify-end">
									<button
										type="submit"
										disabled={sending || !subject.trim() || !message.trim()}
										className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{sending && <SpinnerIcon className="size-3.5" />}
										{t("support.sendMessage")}
									</button>
								</div>
							</form>
						)}
					</div>
				</section>

				<section>
					<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						<LifeBuoyIcon className="size-3.5" />
						{t("support.recentTickets")}
					</h2>
					<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
						{TICKET_KEYS.map((ticket) => (
							<div
								key={ticket.id}
								className="flex items-center justify-between gap-4 border-b border-violet-500/10 px-5 py-3.5 last:border-0"
							>
								<div className="min-w-0">
									<p className="truncate text-sm text-violet-100">{t(`support.${ticket.key}`)}</p>
									<p className="text-xs text-violet-400/50">
										#{ticket.id} · {t(`support.${ticket.key}Date`)}
									</p>
								</div>
								<Pill tone={ticket.status === "Open" ? "amber" : "emerald"}>
									{ticket.status === "Open" ? t("support.statusOpen") : t("support.statusResolved")}
								</Pill>
							</div>
						))}
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						{t("support.faqTitle")}
					</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-5">
						{FAQ_KEYS.map((key) => (
							<FaqItem key={key} q={t(`support.${key}q`)} a={t(`support.${key}a`)} />
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
