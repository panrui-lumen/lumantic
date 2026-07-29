import { JsonHighlight } from "../JsonHighlight";
import { Reveal } from "../Reveal";
import { SectionHeading } from "../SectionHeading";

const USERS_JSON = `GET /v1/users?updated_after=…&cursor=usr_7f30

{
  "data": [{
    "id": "usr_7f31",
    "created_at": "2026-07-15T09:21:44Z",
    "country": "GB",
    "acquisition": {
      "channel": "paid_social"
    },
    "device": {
      "platform": "mobile_web",
      "os": "iOS"
    }
  }],
  "next_cursor": "usr_7f31"
}`;

const PAYMENT_JSON = `{
  "id": "evt_pay_01988",
  "type": "deposit.attempt.updated",
  "created": "1784627422",
  "data": {
    "attempt": {
      "id": "dep_a91",
      "user_id": "usr_7f31",
      "provider": "PayFlow",
      "amount": {
        "value": "75.00",
        "currency": "GBP"
      },
      "status": "failed",
      "failure": {
        "code": "3DS_TIMEOUT"
      },
      "client": {
        "platform": "mobile_web",
        "app_version": "web-2.14"
      }
    }
  }
}`;

const GOTCHAS = [
	"cursor + updated_at",
	"nested dimensions",
	"string timestamp + decimal",
	"duplicate event IDs",
	"out-of-order updates",
	"missing user_id → reject",
];

function CodeCard({ title, tag, code }: { title: string; tag: string; code: string }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-violet-500/15 bg-[#08060f] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
			<div className="flex items-center justify-between border-b border-violet-500/10 bg-white/[0.02] px-4 py-3">
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-full bg-rose-400/50" />
					<span className="size-2.5 rounded-full bg-amber-300/50" />
					<span className="size-2.5 rounded-full bg-emerald-400/50" />
				</div>
				<span className="font-mono text-[10px] tracking-wide text-violet-300/50 uppercase">{tag}</span>
			</div>
			<div className="px-5 pt-4 pb-1">
				<h4 className="font-display text-sm font-semibold text-violet-100">{title}</h4>
			</div>
			<pre className="overflow-x-auto px-5 pt-3 pb-5 font-mono text-[12px] leading-relaxed text-violet-200/80">
				<code>
					<JsonHighlight code={code} />
				</code>
			</pre>
		</div>
	);
}

export function DataDepth() {
	return (
		<section className="relative border-t border-violet-500/10 bg-ink py-28">
			<div className="mx-auto max-w-6xl px-6">
				<SectionHeading
					title="The source looks simple until ingestion rules matter"
					subtitle="The DE agent doesn't just move bytes. It encodes the judgment calls that make raw payloads trustworthy."
				/>

				<div className="mt-14 grid gap-6 lg:grid-cols-2">
					<Reveal>
						<CodeCard title="Cursor-paginated · mutable user snapshot" tag="Users API" code={USERS_JSON} />
					</Reveal>
					<Reveal delay={120}>
						<CodeCard title="At-least-once · payment status update" tag="Payment webhook" code={PAYMENT_JSON} />
					</Reveal>
				</div>

				<Reveal delay={220} className="mt-10">
					<div className="flex flex-wrap justify-center gap-3">
						{GOTCHAS.map((g) => (
							<span
								key={g}
								className="rounded-full border border-violet-500/20 bg-violet-500/[0.04] px-4 py-2 font-mono text-xs text-violet-300/70"
							>
								{g}
							</span>
						))}
					</div>
				</Reveal>
			</div>
		</section>
	);
}
