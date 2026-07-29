import { useMemo } from "react";

type Token = { text: string; className: string };

const TOKEN_REGEX =
	/("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(-?\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])|(\b(?:GET|POST|PUT|PATCH|DELETE)\b)/g;

function tokenize(code: string): Token[] {
	const tokens: Token[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	TOKEN_REGEX.lastIndex = 0;
	while ((match = TOKEN_REGEX.exec(code))) {
		if (match.index > lastIndex) {
			tokens.push({ text: code.slice(lastIndex, match.index), className: "text-violet-300/50" });
		}
		const [, key, string, number, keyword, punctuation, method] = match;
		if (key !== undefined) tokens.push({ text: key, className: "text-sky-300" });
		else if (string !== undefined) tokens.push({ text: string, className: "text-emerald-300/90" });
		else if (number !== undefined) tokens.push({ text: number, className: "text-amber-300" });
		else if (keyword !== undefined) tokens.push({ text: keyword, className: "text-rose-300" });
		else if (punctuation !== undefined) tokens.push({ text: punctuation, className: "text-violet-400/60" });
		else if (method !== undefined) tokens.push({ text: method, className: "font-semibold text-fuchsia-300" });
		lastIndex = TOKEN_REGEX.lastIndex;
	}
	if (lastIndex < code.length) {
		tokens.push({ text: code.slice(lastIndex), className: "text-violet-300/50" });
	}
	return tokens;
}

export function JsonHighlight({ code }: { code: string }) {
	const tokens = useMemo(() => tokenize(code), [code]);
	return (
		<>
			{tokens.map((token, i) => (
				<span key={i} className={token.className}>
					{token.text}
				</span>
			))}
		</>
	);
}
