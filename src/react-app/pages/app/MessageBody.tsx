import type { ReactNode } from "react";
import { parseChatWorking, type ChatConnector } from "../../../shared/beacon-analytics";
import { CodeHighlight } from "./CodeHighlight";
import { ConnectorPills } from "./ConnectorPills";

function renderInline(text: string): ReactNode[] {
	const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
	return parts.map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
			return (
				<strong key={i} className="font-semibold text-violet-50">
					{part.slice(2, -2)}
				</strong>
			);
		}
		if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
			return (
				<code key={i} className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[12px] text-violet-100">
					{part.slice(1, -1)}
				</code>
			);
		}
		return <span key={i}>{part}</span>;
	});
}

type ContentBlock =
	| { kind: "paragraph"; text: string }
	| { kind: "quote"; text: string }
	| { kind: "code"; language: string; code: string };

function parseMessageBlocks(content: string): ContentBlock[] {
	const blocks: ContentBlock[] = [];
	const lines = content.split("\n");
	let i = 0;
	while (i < lines.length) {
		const line = lines[i] ?? "";
		const fence = line.match(/^```([\w-]*)\s*$/);
		if (fence) {
			const language = fence[1] || "typescript";
			const codeLines: string[] = [];
			i += 1;
			while (i < lines.length && !/^\s*```\s*$/.test(lines[i] ?? "")) {
				codeLines.push(lines[i] ?? "");
				i += 1;
			}
			blocks.push({ kind: "code", language, code: codeLines.join("\n") });
			i += 1;
			continue;
		}
		if (line.trim() === "") {
			i += 1;
			continue;
		}
		if (line.startsWith("> ")) {
			blocks.push({ kind: "quote", text: line.slice(2) });
			i += 1;
			continue;
		}
		blocks.push({ kind: "paragraph", text: line });
		i += 1;
	}
	return blocks;
}

export function MessageBody({ content }: { content: string }) {
	const blocks = parseMessageBlocks(content);
	return (
		<div className="space-y-2.5">
			{blocks.map((block, i) => {
				if (block.kind === "code") {
					return <CodeHighlight key={i} code={block.code} language={block.language} />;
				}
				if (block.kind === "quote") {
					return (
						<div
							key={i}
							className="border-l-2 border-violet-400/40 bg-white/[0.03] py-1.5 pl-3 text-[13px] text-violet-200/90 italic"
						>
							{renderInline(block.text)}
						</div>
					);
				}
				return (
					<p key={i} className="text-sm leading-relaxed text-violet-100">
						{renderInline(block.text)}
					</p>
				);
			})}
		</div>
	);
}

export function connectorsFromWorking(working: string | null | undefined): ChatConnector[] {
	return parseChatWorking(working)?.connectors ?? [];
}

export function WorkingConnectorPills({ working }: { working: string | null | undefined }) {
	const connectors = connectorsFromWorking(working);
	if (connectors.length === 0) return null;
	return <ConnectorPills connectors={connectors} />;
}
