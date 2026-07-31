import { useMemo, type ReactNode } from "react";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import diff from "highlight.js/lib/languages/diff";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("jsx", javascript);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("diff", diff);

/** Tailwind class literals (must stay as static strings for the scanner). */
const TOKEN_CLASS: Record<string, string> = {
	keyword: "text-violet-300",
	built_in: "text-rose-300",
	type: "text-amber-300",
	literal: "text-amber-200",
	number: "text-amber-300",
	string: "text-sky-300",
	regexp: "text-sky-300",
	subst: "text-sky-200",
	symbol: "text-emerald-300",
	class: "text-fuchsia-300",
	function: "text-fuchsia-300",
	title: "text-fuchsia-200",
	params: "text-violet-200",
	comment: "text-violet-400/55 italic",
	doctag: "text-violet-400/70",
	meta: "text-violet-400",
	"meta-string": "text-sky-300",
	attr: "text-amber-200",
	attribute: "text-amber-200",
	variable: "text-amber-200",
	"template-variable": "text-amber-200",
	selector_tag: "text-violet-300",
	selector_id: "text-fuchsia-300",
	selector_class: "text-fuchsia-300",
	addition: "text-emerald-300",
	deletion: "text-rose-300",
	section: "text-violet-100 font-semibold",
	name: "text-violet-100",
	bullet: "text-emerald-300",
	link: "text-sky-300 underline",
	emphasis: "italic text-violet-200",
	operator: "text-violet-400/80",
	punctuation: "text-violet-400/70",
	property: "text-amber-200",
	"template-tag": "text-fuchsia-300",
};

function decodeEntities(text: string): string {
	return text
		.replaceAll("&amp;", "&")
		.replaceAll("&lt;", "<")
		.replaceAll("&gt;", ">")
		.replaceAll("&quot;", "\u0022")
		.replaceAll("&#x27;", "\u0027")
		.replaceAll("&#39;", "\u0027");
}

/** Turn highlight.js HTML into React nodes with Tailwind token colors. */
function renderHighlightedHtml(html: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	const tagRe = /<span class="hljs-([^"]+)">|<\/span>/g;
	const stack: string[] = [];
	let last = 0;
	let match: RegExpExecArray | null;
	let key = 0;

	const pushText = (raw: string, token?: string) => {
		if (!raw) return;
		const text = decodeEntities(raw);
		const className = token
			? (TOKEN_CLASS[token] ?? "text-violet-200/85")
			: stack.length
				? (TOKEN_CLASS[stack[stack.length - 1]!] ?? "text-violet-200/85")
				: "text-violet-200/85";
		nodes.push(
			<span key={key++} className={className}>
				{text}
			</span>,
		);
	};

	while ((match = tagRe.exec(html))) {
		if (match.index > last) {
			pushText(html.slice(last, match.index));
		}
		if (match[0].startsWith("</")) {
			stack.pop();
		} else if (match[1]) {
			const token = match[1].split(/\s+/)[0] ?? match[1];
			stack.push(token);
		}
		last = match.index + match[0].length;
	}
	if (last < html.length) pushText(html.slice(last));
	return nodes;
}

function highlightCode(code: string, language: string): ReactNode[] {
	const lang = language.trim().toLowerCase() || "typescript";
	const source = code.replace(/\n$/, "");
	try {
		if (hljs.getLanguage(lang)) {
			return renderHighlightedHtml(hljs.highlight(source, { language: lang }).value);
		}
	} catch {
		// fall through
	}
	try {
		return renderHighlightedHtml(hljs.highlightAuto(source).value);
	} catch {
		return [
			<span key="raw" className="text-violet-200/85">
				{source}
			</span>,
		];
	}
}

export function CodeHighlight({
	code,
	language = "typescript",
	filename,
	embedded = false,
	className = "",
}: {
	code: string;
	language?: string;
	filename?: string;
	/** Skip outer card chrome when nested inside another artifact panel. */
	embedded?: boolean;
	className?: string;
}) {
	const nodes = useMemo(() => highlightCode(code, language), [code, language]);

	if (embedded) {
		return (
			<pre
				className={`max-h-72 overflow-auto p-3 font-mono text-[11px] leading-relaxed whitespace-pre ${className}`}
			>
				<code>{nodes}</code>
			</pre>
		);
	}

	return (
		<div className={`w-full min-w-0 overflow-hidden rounded-xl border border-violet-500/15 bg-[#0c0a14] ${className}`}>
			{(filename || language) && (
				<div className="flex items-center justify-between gap-2 border-b border-violet-500/10 px-3 py-1.5">
					<span className="truncate font-mono text-[11px] text-violet-300/55">{filename || language}</span>
				</div>
			)}
			<pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed whitespace-pre">
				<code>{nodes}</code>
			</pre>
		</div>
	);
}
