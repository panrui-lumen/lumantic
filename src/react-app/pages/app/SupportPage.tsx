import { useState } from "react";
import { ChevronDown, ExternalLinkIcon, LifeBuoyIcon, SparkleIcon, SpinnerIcon } from "../../components/Icons";
import { PageHeader, Pill, inputClass, textareaClass } from "./ui";

const FAQS = [
	{
		q: "How does Lumantic decide what to propose as a memory?",
		a: "The AI watches chats and connected data sources for facts, definitions, and gotchas that come up more than once, then drops them in Proposed Memories for your team to confirm before they're treated as ground truth.",
	},
	{
		q: "What happens when I deny a proposed memory?",
		a: "It's removed immediately and never saved. Denying doesn't stop the AI from proposing something similar again later if it keeps seeing evidence for it.",
	},
	{
		q: "Can I disconnect Slack without losing my memories?",
		a: "Yes — disconnecting Slack only stops future posts to your workspace. Nothing in your Memories or Proposed Memories library is affected.",
	},
	{
		q: "Can I export my memories?",
		a: "Not yet from the UI, but it's on our roadmap. In the meantime, reach out to support and we can send you a CSV export.",
	},
];

const TICKETS: { id: number; subject: string; status: "Open" | "Resolved"; date: string }[] = [
	{ id: 1042, subject: "Slack digest posted twice on Monday", status: "Open", date: "Jul 28, 2026" },
	{ id: 1038, subject: "Can we get a second Slack channel for alerts?", status: "Open", date: "Jul 24, 2026" },
	{ id: 1021, subject: "How do I change my workspace name?", status: "Resolved", date: "Jul 12, 2026" },
];

function FaqItem({ q, a }: { q: string; a: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="border-b border-violet-500/10 last:border-0">
			<button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
				<span className="text-sm font-medium text-violet-100">{q}</span>
				<ChevronDown className={`size-4 shrink-0 text-violet-400/50 transition ${open ? "rotate-180" : ""}`} />
			</button>
			{open && <p className="pb-4 text-sm leading-relaxed text-violet-300/60">{a}</p>}
		</div>
	);
}

export function SupportPage() {
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	function handleSubmit(e: React.FormEvent) {
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

	return (
		<div className="h-full overflow-y-auto">
			<PageHeader title="Support" description="Get help from the Lumantic team." />

			<div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
				<div className="grid gap-3 sm:grid-cols-3">
					{[
						{ label: "Documentation", desc: "Guides & API reference" },
						{ label: "Status page", desc: "Uptime & incidents" },
						{ label: "Community", desc: "Ask other data teams" },
					].map((link) => (
						<a
							key={link.label}
							href="#"
							onClick={(e) => e.preventDefault()}
							className="flex items-center justify-between gap-2 rounded-2xl border border-violet-500/15 bg-white/[0.02] p-4 transition hover:border-violet-400/30 hover:bg-white/[0.04]"
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
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Contact us</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] p-5">
						{sent ? (
							<div className="flex flex-col items-center gap-2 py-6 text-center">
								<span className="flex size-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
									<SparkleIcon className="size-5" />
								</span>
								<p className="font-medium text-violet-100">Message sent</p>
								<p className="max-w-xs text-sm text-violet-300/60">We'll get back to you within one business day.</p>
								<button onClick={() => setSent(false)} className="mt-2 text-sm font-medium text-violet-300 hover:text-violet-100">
									Send another message
								</button>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="flex flex-col gap-3">
								<input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inputClass} />
								<textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="How can we help?"
									className={textareaClass}
								/>
								<div className="flex items-center justify-end">
									<button
										type="submit"
										disabled={sending || !subject.trim() || !message.trim()}
										className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{sending && <SpinnerIcon className="size-3.5" />}
										Send message
									</button>
								</div>
							</form>
						)}
					</div>
				</section>

				<section>
					<h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">
						<LifeBuoyIcon className="size-3.5" />
						Recent tickets
					</h2>
					<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-white/[0.02]">
						{TICKETS.map((t) => (
							<div key={t.id} className="flex items-center justify-between gap-4 border-b border-violet-500/10 px-5 py-3.5 last:border-0">
								<div className="min-w-0">
									<p className="truncate text-sm text-violet-100">{t.subject}</p>
									<p className="text-xs text-violet-400/50">
										#{t.id} · {t.date}
									</p>
								</div>
								<Pill tone={t.status === "Open" ? "amber" : "emerald"}>{t.status}</Pill>
							</div>
						))}
					</div>
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-violet-300/70 uppercase">Frequently asked</h2>
					<div className="rounded-2xl border border-violet-500/15 bg-white/[0.02] px-5">
						{FAQS.map((f) => (
							<FaqItem key={f.q} q={f.q} a={f.a} />
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
